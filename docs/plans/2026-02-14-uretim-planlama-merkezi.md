# Üretim Planlama Merkezi Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `production/planning/page.tsx` sayfasını 4 sekmeli (Grid, Kanban, Takvim, Kaynak Analizi) premium bir "Üretim Planlama Merkezi"ne dönüştürmek.

**Architecture:** Backend'e `checkMaterialAvailability` ve `reschedule` endpoint'leri eklenir. Frontend'de mevcut `page.tsx` Radix Tabs ile sarılır; Grid, Kanban, Calendar, ResourceAnalysis bileşenleri `planning/` klasörüne eklenir. Her bileşen kendi veri çekimini yapar.

**Tech Stack:** Next.js 16, NestJS, Prisma, AG Grid Enterprise, @dnd-kit/core, react-big-calendar, recharts, @radix-ui/react-tabs (zaten kurulu), lucide-react

---

## Ortam Bilgisi

- **Monorepo kökü:** `c:/Users/PC/.gemini/antigravity/scratch/sepe4.6/`
- **API:** `apps/api/` — NestJS, Prisma
- **Web:** `apps/web/` — Next.js 16
- **Paket yöneticisi:** `pnpm`
- **Dev sunucularını başlatma:** `pnpm dev` (root'tan)
- **API URL:** `http://localhost:3001` (varsayılan)

---

## Task 1: Backend — `checkMaterialAvailability` Servisi

**Files:**
- Modify: `apps/api/src/modules/production-order/production-order.service.ts` (satır 1–171)
- Modify: `apps/api/src/modules/production-order/production-order.controller.ts`

### Step 1: `checkMaterialAvailability` metodunu servise ekle

`production-order.service.ts` dosyasının sonuna (`}` kapanış parantezinden önce) şu metodu ekle:

```typescript
async checkMaterialAvailability(orderId: string) {
  const order = await this.prisma.productionOrder.findUnique({
    where: { id: orderId },
    include: {
      recipe: {
        include: {
          items: {
            include: { material: true },
          },
        },
      },
    },
  });

  if (!order) throw new NotFoundException(`Üretim emri bulunamadı: ${orderId}`);
  if (!order.recipe) {
    return { isAvailable: false, status: 'NO_RECIPE', missingItems: [] };
  }

  const missingItems: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    requiredQuantity: number;
    currentStock: number;
    unit: string;
    isCritical: boolean;
  }> = [];

  for (const item of order.recipe.items) {
    const required = Number(item.quantity) * Number(order.plannedQuantity);
    const current = Number(item.material.currentStock);
    const minLevel = Number(item.material.minStockLevel);

    if (current < required) {
      missingItems.push({
        materialId: item.material.id,
        materialCode: item.material.code,
        materialName: item.material.name,
        requiredQuantity: required,
        currentStock: current,
        unit: item.material.unitOfMeasure,
        isCritical: true,
      });
    } else if (current < required + minLevel) {
      // Yeterli ama kritik seviyeye yakın
      missingItems.push({
        materialId: item.material.id,
        materialCode: item.material.code,
        materialName: item.material.name,
        requiredQuantity: required,
        currentStock: current,
        unit: item.material.unitOfMeasure,
        isCritical: false,
      });
    }
  }

  const isAvailable = missingItems.filter((i) => i.isCritical).length === 0;
  const hasCritical = missingItems.some((i) => i.isCritical);
  const hasWarning = missingItems.some((i) => !i.isCritical);

  let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  if (hasCritical) status = 'RED';
  else if (hasWarning) status = 'YELLOW';

  return { isAvailable, status, missingItems };
}
```

### Step 2: `reschedule` metodunu servise ekle

Aynı dosyanın sonuna (yukarıdaki metodun altına) ekle:

```typescript
async reschedule(id: string, dto: { plannedStart?: string; plannedEnd?: string }) {
  await this.findOne(id);
  const data: any = {};
  if (dto.plannedStart) data.plannedStart = new Date(dto.plannedStart);
  if (dto.plannedEnd) data.plannedEnd = new Date(dto.plannedEnd);

  const updated = await this.prisma.productionOrder.update({ where: { id }, data });

  // Audit log
  await this.prisma.auditLog.create({
    data: {
      entityType: 'ProductionOrder',
      entityId: id,
      action: 'RESCHEDULE',
      newData: data as any,
    },
  });

  return updated;
}
```

### Step 3: `findAllForKanban` metodunu servise ekle (Kanban için, pagination yok)

```typescript
async findAllForKanban(startDate?: string, endDate?: string) {
  const where: any = {};
  if (startDate || endDate) {
    where.OR = [
      { plannedStart: { gte: startDate ? new Date(startDate) : undefined, lte: endDate ? new Date(endDate) : undefined } },
      { status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] } },
    ];
  }

  return this.prisma.productionOrder.findMany({
    where,
    include: {
      product: { select: { id: true, code: true, name: true, imageUrl: true } },
      recipe: { select: { id: true, code: true, name: true } },
      batches: { select: { id: true, status: true, quantity: true } },
    },
    orderBy: [{ priority: 'desc' }, { plannedStart: 'asc' }],
    take: 200,
  });
}
```

### Step 4: Controller'a endpoint'leri ekle

`production-order.controller.ts` dosyasına aşağıdaki metodları ekle (mevcut `complete` metodundan sonra):

```typescript
@Get('kanban')
async findAllForKanban(
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  const orders = await this.productionOrderService.findAllForKanban(startDate, endDate);
  return { success: true, data: orders };
}

@Get(':id/availability')
async checkAvailability(@Param('id') id: string) {
  const result = await this.productionOrderService.checkMaterialAvailability(id);
  return { success: true, data: result };
}

@Patch(':id/reschedule')
async reschedule(
  @Param('id') id: string,
  @Body() dto: { plannedStart?: string; plannedEnd?: string },
) {
  const order = await this.productionOrderService.reschedule(id, dto);
  return { success: true, data: order };
}
```

**ÖNEMLİ:** `@Get('kanban')` endpoint'i `@Get(':id')` endpoint'inden **önce** gelmelidir, aksi halde NestJS `kanban`'ı bir ID olarak yorumlar. Controller içindeki sıra:
1. `@Get()` — findAll
2. `@Get('summary')` — getSummary
3. `@Get('kanban')` — **YENİ** findAllForKanban
4. `@Get(':id')` — findOne
5. ...diğerleri

### Step 5: API'yi yeniden başlat ve test et

```bash
# Terminal 1: API başlat
cd c:/Users/PC/.gemini/antigravity/scratch/sepe4.6
pnpm --filter @sepe/api dev

# Terminal 2: Test
curl http://localhost:3001/api/production-orders/kanban
# Beklenen: { "success": true, "data": [...] }

curl http://localhost:3001/api/production-orders/<GEÇERLİ_ID>/availability
# Beklenen: { "success": true, "data": { "isAvailable": true, "status": "GREEN", "missingItems": [] } }
```

### Step 6: Commit

```bash
git add apps/api/src/modules/production-order/production-order.service.ts
git add apps/api/src/modules/production-order/production-order.controller.ts
git commit -m "feat(api): add material availability check, kanban, and reschedule endpoints"
```

---

## Task 2: Frontend — Eksik Paketleri Kur

**Files:**
- Modify: `apps/web/package.json`

### Step 1: Paketleri kur

```bash
cd c:/Users/PC/.gemini/antigravity/scratch/sepe4.6
pnpm --filter @sepe/web add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts react-big-calendar
pnpm --filter @sepe/web add -D @types/react-big-calendar
```

### Step 2: Kurulumu doğrula

```bash
cat apps/web/package.json | grep -E "dnd-kit|recharts|big-calendar"
```

Beklenen çıktı: her üç paketin `dependencies`'te görünmesi.

### Step 3: Commit

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add dnd-kit, recharts, react-big-calendar packages"
```

---

## Task 3: Frontend — Hook'lar

**Files:**
- Modify: `apps/web/src/hooks/use-production-orders.ts`

### Step 1: Eksik hook'ları ekle

`use-production-orders.ts` dosyasının sonuna ekle:

```typescript
// ─── Kanban için tüm emirleri çek (pagination yok) ───────────────────────────
export function useProductionOrdersForKanban() {
  return useQuery({
    queryKey: ['production-orders', 'kanban'],
    queryFn: () => apiClient.get<{ success: boolean; data: any[] }>('/production-orders/kanban'),
    staleTime: 30 * 1000,
  });
}

// ─── Malzeme Müsaitlik Kontrolü ──────────────────────────────────────────────
export interface MaterialAvailabilityResult {
  isAvailable: boolean;
  status: 'GREEN' | 'YELLOW' | 'RED';
  missingItems: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    requiredQuantity: number;
    currentStock: number;
    unit: string;
    isCritical: boolean;
  }>;
}

export function useMaterialAvailability(orderId: string | null) {
  return useQuery({
    queryKey: ['production-orders', 'availability', orderId],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: MaterialAvailabilityResult }>(
        `/production-orders/${orderId}/availability`,
      ),
    enabled: !!orderId,
    staleTime: 60 * 1000,
  });
}

// ─── Reschedule mutation ──────────────────────────────────────────────────────
export function useRescheduleProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plannedStart, plannedEnd }: { id: string; plannedStart?: string; plannedEnd?: string }) =>
      apiClient.patch<any>(`/production-orders/${id}/reschedule`, { plannedStart, plannedEnd }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production-orders'] });
    },
  });
}
```

### Step 2: Commit

```bash
git add apps/web/src/hooks/use-production-orders.ts
git commit -m "feat(web): add kanban, availability, reschedule hooks"
```

---

## Task 4: Frontend — `PlanningGrid.tsx` (Mevcut Grid'in Upgrade'i)

**Files:**
- Create: `apps/web/src/app/(dashboard)/production/planning/planning-grid.tsx`

Bu bileşen mevcut `page.tsx`'teki grid mantığını alır ve şunları ekler:
- **Malzeme Kontrolü kolonu** (trafik ışığı: 🟢🟡🔴)
- **İlerleme Çubuğu** kolonu (batch doluluk oranı)
- **Gecikme** satır stili (kırmızı arka plan)
- **Row Actions** (Başlat, Tamamla, Planla butonları)

### Step 1: Dosyayı oluştur

```tsx
// apps/web/src/app/(dashboard)/production/planning/planning-grid.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, CheckCircle, Calendar, Circle, AlertCircle, Minus } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, IServerSideDatasource, IServerSideGetRowsParams, GridApi, GetRowIdParams, RowClassParams } from 'ag-grid-enterprise';
import { apiClient } from '@/lib/api-client';
import { useStartProductionOrder, useCompleteProductionOrder } from '@/hooks/use-production-orders';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Taslak', className: 'bg-slate-400' },
  PLANNED: { label: 'Planlandı', className: 'bg-blue-500' },
  IN_PROGRESS: { label: 'Devam Ediyor', className: 'bg-amber-500' },
  QC_PENDING: { label: 'KK Bekliyor', className: 'bg-purple-500' },
  COMPLETED: { label: 'Tamamlandı', className: 'bg-emerald-500' },
  CANCELLED: { label: 'İptal', className: 'bg-rose-500' },
};

// Trafik ışığı cell renderer
function MaterialStatusRenderer(params: any) {
  const status = params.data?._materialStatus;
  if (!status) return <Minus className="w-4 h-4 text-slate-300" />;
  if (status === 'GREEN') return <Circle className="w-4 h-4 fill-emerald-500 text-emerald-500" />;
  if (status === 'YELLOW') return <AlertCircle className="w-4 h-4 text-amber-500" />;
  return <AlertCircle className="w-4 h-4 text-rose-500" />;
}

// İlerleme çubuğu cell renderer
function ProgressRenderer(params: any) {
  const batches = params.data?.batches ?? [];
  const planned = Number(params.data?.plannedQuantity ?? 0);
  if (!planned || batches.length === 0) return <span className="text-slate-300 text-xs">—</span>;
  const done = batches
    .filter((b: any) => ['QC_PASSED', 'RELEASED'].includes(b.status))
    .reduce((s: number, b: any) => s + Number(b.quantity), 0);
  const pct = Math.min(100, Math.round((done / planned) * 100));
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-500 font-medium w-8 text-right">{pct}%</span>
    </div>
  );
}

interface Props {
  searchTerm: string;
  onRowClick: (id: string) => void;
  onPlanClick: (id: string) => void;
  gridApiRef?: (api: GridApi) => void;
}

export function PlanningGrid({ searchTerm, onRowClick, onPlanClick, gridApiRef }: Props) {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const { toast } = useToast();
  const startMutation = useStartProductionOrder();
  const completeMutation = useCompleteProductionOrder();

  const getRowId = useCallback((params: GetRowIdParams<any>) => params.data.id, []);

  // Gecikmiş satırlara kırmızı arka plan
  const getRowClass = useCallback((params: RowClassParams) => {
    const d = params.data;
    if (!d) return '';
    const today = new Date();
    if (d.plannedEnd && new Date(d.plannedEnd) < today && !['COMPLETED', 'CANCELLED'].includes(d.status)) {
      return 'bg-rose-50';
    }
    return '';
  }, []);

  const handleStart = useCallback(
    async (id: string, materialStatus: string) => {
      if (materialStatus === 'RED') {
        toast({ title: 'Malzeme Yetersiz', description: 'Eksik malzeme var, üretime başlanamaz.', variant: 'destructive' });
        return;
      }
      await startMutation.mutateAsync(id);
      toast({ title: 'Başarılı', description: 'Üretim başlatıldı.' });
      gridApi?.refreshServerSide({ purge: false });
    },
    [startMutation, toast, gridApi],
  );

  const handleComplete = useCallback(
    async (id: string) => {
      await completeMutation.mutateAsync(id);
      toast({ title: 'Başarılı', description: 'Üretim tamamlandı.' });
      gridApi?.refreshServerSide({ purge: false });
    },
    [completeMutation, toast, gridApi],
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'orderNumber',
        headerName: 'EMİR NO',
        width: 160,
        pinned: 'left',
        filter: 'agTextColumnFilter',
        cellClass: 'font-semibold text-lightning-blue',
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
      },
      {
        field: 'product.name',
        headerName: 'ÜRÜN',
        minWidth: 200,
        flex: 1,
        filter: 'agTextColumnFilter',
        cellClass: 'text-slate-700 font-medium',
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
        valueGetter: (p: any) => p.data?.product?.name ?? '',
      },
      {
        field: '_materialStatus',
        headerName: 'MAL.',
        width: 70,
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
        cellRenderer: MaterialStatusRenderer,
        sortable: false,
        filter: false,
      },
      {
        field: 'status',
        headerName: 'DURUM',
        width: 140,
        filter: 'agSetColumnFilter',
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
        cellRenderer: (p: any) => {
          const s = STATUS_MAP[p.value] ?? { label: p.value, className: 'bg-gray-400' };
          return (
            <div className="flex items-center h-full">
              <span className={`rounded-sm text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 text-white ${s.className}`}>
                {s.label}
              </span>
            </div>
          );
        },
      },
      {
        field: '_progress',
        headerName: 'İLERLEME',
        width: 130,
        cellRenderer: ProgressRenderer,
        sortable: false,
        filter: false,
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
      },
      {
        field: 'plannedQuantity',
        headerName: 'MİKTAR',
        width: 120,
        filter: 'agNumberColumnFilter',
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
        cellClass: 'font-bold text-slate-700 text-right',
        valueFormatter: (p: any) => (p.value != null ? p.value.toLocaleString('tr-TR') : ''),
      },
      {
        field: 'plannedStart',
        headerName: 'BAŞLANGIC',
        width: 120,
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
        valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleDateString('tr-TR') : ''),
      },
      {
        field: 'plannedEnd',
        headerName: 'BİTİŞ',
        width: 120,
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
        valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleDateString('tr-TR') : ''),
      },
      {
        headerName: 'AKSIYONLAR',
        width: 200,
        sortable: false,
        filter: false,
        pinned: 'right',
        headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
        cellRenderer: (p: any) => {
          const d = p.data;
          if (!d) return null;
          return (
            <div className="flex items-center gap-1 h-full">
              {(d.status === 'DRAFT' || d.status === 'PLANNED') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={(e) => { e.stopPropagation(); handleStart(d.id, d._materialStatus); }}
                >
                  <Play className="w-3 h-3 mr-1" /> Başlat
                </Button>
              )}
              {d.status === 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={(e) => { e.stopPropagation(); handleComplete(d.id); }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" /> Tamamla
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                onClick={(e) => { e.stopPropagation(); onPlanClick(d.id); }}
              >
                <Calendar className="w-3 h-3 mr-1" /> Planla
              </Button>
            </div>
          );
        },
      },
    ],
    [handleStart, handleComplete, onPlanClick],
  );

  const createDatasource = useCallback((): IServerSideDatasource => ({
    getRows: async (params: IServerSideGetRowsParams) => {
      try {
        const { startRow, endRow, sortModel, filterModel } = params.request;
        const page = Math.floor((startRow ?? 0) / 50) + 1;
        const pageSize = (endRow ?? 50) - (startRow ?? 0);
        const sp = new URLSearchParams();
        sp.set('page', String(page));
        sp.set('pageSize', String(pageSize));
        if (searchTerm) sp.set('search', searchTerm);
        if (sortModel?.length) { sp.set('sortField', sortModel[0].colId); sp.set('sortOrder', sortModel[0].sort as string); }
        if (filterModel && Object.keys(filterModel).length) sp.set('filters', JSON.stringify(filterModel));

        const res = await apiClient.get<any>(`/production-orders?${sp.toString()}`);
        const rows: any[] = res.data?.rows ?? res.data ?? [];

        params.success({ rowData: rows, rowCount: res.data?.lastRow ?? res.meta?.total ?? -1 });
      } catch {
        params.fail();
      }
    },
  }), [searchTerm]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      gridApiRef?.(event.api);
      event.api.setGridOption('serverSideDatasource', createDatasource());
    },
    [createDatasource, gridApiRef],
  );

  useEffect(() => {
    if (gridApi) gridApi.setGridOption('serverSideDatasource', createDatasource());
  }, [searchTerm, gridApi, createDatasource]);

  return (
    <div style={{ height: '560px', width: '100%' }}>
      <AgGridReact
        theme={themeQuartz}
        ref={gridRef}
        getRowId={getRowId}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, resizable: true, filter: true }}
        rowHeight={42}
        headerHeight={32}
        rowModelType="serverSide"
        cacheBlockSize={50}
        onGridReady={onGridReady}
        onRowDoubleClicked={(e) => e.data?.id && onRowClick(e.data.id)}
        animateRows
        getRowClass={getRowClass}
        rowSelection={{ mode: 'singleRow', checkboxes: false }}
      />
    </div>
  );
}
```

### Step 2: Commit

```bash
git add apps/web/src/app/\(dashboard\)/production/planning/planning-grid.tsx
git commit -m "feat(web): add PlanningGrid with material status, progress and row actions"
```

---

## Task 5: Frontend — `PlanningKanban.tsx`

**Files:**
- Create: `apps/web/src/app/(dashboard)/production/planning/planning-kanban.tsx`

### Step 1: Dosyayı oluştur

```tsx
// apps/web/src/app/(dashboard)/production/planning/planning-kanban.tsx
'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Circle, AlertCircle, User, ChevronRight } from 'lucide-react';
import { useProductionOrdersForKanban, useUpdateProductionOrder, useMaterialAvailability } from '@/hooks/use-production-orders';
import { useToast } from '@/hooks/use-toast';

const COLUMNS: Array<{ id: string; label: string; color: string; bg: string }> = [
  { id: 'DRAFT',       label: 'Taslak',        color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  { id: 'PLANNED',     label: 'Planlandı',     color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
  { id: 'IN_PROGRESS', label: 'Devam Ediyor',  color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { id: 'COMPLETED',   label: 'Tamamlandı',    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
];

function MaterialDot({ status }: { status?: string }) {
  if (status === 'GREEN') return <Circle className="w-3 h-3 fill-emerald-500 text-emerald-500 flex-shrink-0" />;
  if (status === 'YELLOW') return <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />;
  if (status === 'RED') return <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />;
  return <Circle className="w-3 h-3 text-slate-300 flex-shrink-0" />;
}

function KanbanCard({ order, isDragging = false }: { order: any; isDragging?: boolean }) {
  const batches = order.batches ?? [];
  const planned = Number(order.plannedQuantity ?? 0);
  const done = batches
    .filter((b: any) => ['QC_PASSED', 'RELEASED'].includes(b.status))
    .reduce((s: number, b: any) => s + Number(b.quantity), 0);
  const pct = planned ? Math.min(100, Math.round((done / planned) * 100)) : 0;

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm ${isDragging ? 'opacity-50' : 'hover:shadow-md'} transition-all cursor-grab active:cursor-grabbing`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-500">{order.orderNumber}</span>
        <MaterialDot status={order._materialStatus} />
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-tight mb-2 line-clamp-2">
        {order.product?.name ?? '—'}
      </p>
      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
        <span>{Number(order.plannedQuantity).toLocaleString('tr-TR')} adet</span>
        {order.plannedStart && (
          <span>{new Date(order.plannedStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
        )}
      </div>
      {planned > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
        </div>
      )}
      {order.assignedTo && (
        <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400">
          <User className="w-3 h-3" />
          <span>{order.assignedTo}</span>
        </div>
      )}
    </div>
  );
}

function DroppableColumn({ col, orders }: { col: typeof COLUMNS[0]; orders: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className={`flex-1 min-w-[220px] rounded-xl border ${col.bg} ${isOver ? 'ring-2 ring-blue-400' : ''} transition-all`}>
      <div className="px-3 py-2.5 border-b border-inherit flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</span>
        <span className="text-xs font-bold text-slate-400 bg-white rounded-full px-2 py-0.5 shadow-sm">{orders.length}</span>
      </div>
      <div ref={setNodeRef} className="p-2 flex flex-col gap-2 min-h-[300px]">
        {orders.map((o) => (
          <DraggableCard key={o.id} order={o} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ order }: { order: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id, data: { order } });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)`, zIndex: 9999 } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCard order={order} isDragging={isDragging} />
    </div>
  );
}

export function PlanningKanban() {
  const { data, refetch } = useProductionOrdersForKanban();
  const updateMutation = useUpdateProductionOrder();
  const { toast } = useToast();
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const orders: any[] = data?.data?.data ?? [];

  const grouped = COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
    acc[col.id] = orders.filter((o) => o.status === col.id);
    return acc;
  }, {});

  const handleDragStart = (event: DragStartEvent) => {
    setActiveOrder(event.active.data.current?.order ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) return;

    const order = active.data.current?.order;
    const newStatus = over.id as string;

    if (!order || order.status === newStatus) return;

    // Kısıt: Malzeme yoksa PLANNED → IN_PROGRESS geçişine izin verme
    if (newStatus === 'IN_PROGRESS' && order._materialStatus === 'RED') {
      toast({ title: 'Malzeme Yetersiz', description: 'Eksik malzeme nedeniyle üretime geçilemez.', variant: 'destructive' });
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: order.id, data: { status: newStatus } });
      refetch();
    } catch {
      toast({ title: 'Hata', description: 'Durum güncellenemedi.', variant: 'destructive' });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <DroppableColumn key={col.id} col={col} orders={grouped[col.id] ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeOrder && <KanbanCard order={activeOrder} />}
      </DragOverlay>
    </DndContext>
  );
}
```

### Step 2: Commit

```bash
git add apps/web/src/app/\(dashboard\)/production/planning/planning-kanban.tsx
git commit -m "feat(web): add PlanningKanban with dnd-kit drag-drop and material constraint"
```

---

## Task 6: Frontend — `PlanningCalendar.tsx`

**Files:**
- Create: `apps/web/src/app/(dashboard)/production/planning/planning-calendar.tsx`

### Step 1: Dosyayı oluştur

`react-big-calendar`'ın CSS'ini de import etmemiz gerekiyor. Önce global stil dosyasını bul:
- `apps/web/src/app/globals.css` veya `apps/web/src/app/layout.tsx`

`layout.tsx` ya da `globals.css` dosyasına şu import'u ekle (en üste):
```css
@import 'react-big-calendar/lib/css/react-big-calendar.css';
```

Ardından `planning-calendar.tsx` dosyasını oluştur:

```tsx
// apps/web/src/app/(dashboard)/production/planning/planning-calendar.tsx
'use client';

import React, { useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useProductionOrdersForKanban, useRescheduleProductionOrder } from '@/hooks/use-production-orders';
import { useToast } from '@/hooks/use-toast';

// date-fns localizer (pnpm add date-fns --filter @sepe/web gerekebilir)
const locales = { tr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  PLANNED: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

interface CalendarEvent extends Event {
  id: string;
  resourceId?: string;
  status: string;
  orderId: string;
}

export function PlanningCalendar() {
  const { data, refetch } = useProductionOrdersForKanban();
  const rescheduleMutation = useRescheduleProductionOrder();
  const { toast } = useToast();

  const orders: any[] = data?.data?.data ?? [];

  const events = useMemo<CalendarEvent[]>(() =>
    orders
      .filter((o) => o.plannedStart && o.plannedEnd)
      .map((o) => ({
        id: o.id,
        orderId: o.id,
        title: `${o.orderNumber} — ${o.product?.name ?? ''}`,
        start: new Date(o.plannedStart),
        end: new Date(o.plannedEnd),
        status: o.status,
        resourceId: o.assignedTo ?? 'hat-1',
      })),
  [orders]);

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: STATUS_COLORS[event.status] ?? '#94a3b8',
        border: 'none',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 6px',
        cursor: 'pointer',
      },
    }),
    [],
  );

  const onEventDrop = useCallback(
    async ({ event, start, end }: any) => {
      try {
        await rescheduleMutation.mutateAsync({
          id: (event as CalendarEvent).orderId,
          plannedStart: (start as Date).toISOString(),
          plannedEnd: (end as Date).toISOString(),
        });
        toast({ title: 'Yeniden planlandı', description: 'Tarihler güncellendi.' });
        refetch();
      } catch {
        toast({ title: 'Hata', description: 'Tarihleri güncellenemedi.', variant: 'destructive' });
      }
    },
    [rescheduleMutation, toast, refetch],
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4" style={{ height: 600 }}>
      <DnDCalendar
        localizer={localizer}
        events={events}
        defaultView="month"
        views={['month', 'week', 'day']}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventPropGetter}
        onEventDrop={onEventDrop}
        resizable
        onEventResize={onEventDrop}
        culture="tr"
        messages={{
          today: 'Bugün',
          previous: 'Geri',
          next: 'İleri',
          month: 'Ay',
          week: 'Hafta',
          day: 'Gün',
          noEventsInRange: 'Bu aralıkta üretim emri yok.',
        }}
        style={{ height: '100%' }}
      />
    </div>
  );
}
```

**Not:** `date-fns` ve `date-fns/locale` kurulu değilse:
```bash
pnpm --filter @sepe/web add date-fns
```

### Step 2: Commit

```bash
git add apps/web/src/app/\(dashboard\)/production/planning/planning-calendar.tsx
git commit -m "feat(web): add PlanningCalendar with react-big-calendar and drag-to-reschedule"
```

---

## Task 7: Frontend — `ResourceAnalysis.tsx`

**Files:**
- Create: `apps/web/src/app/(dashboard)/production/planning/resource-analysis.tsx`

### Step 1: Malzeme ihtiyacı endpoint'ini servise ekle

`production-order.service.ts` sonuna ekle:

```typescript
async getMaterialDemand(days: number = 30) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const orders = await this.prisma.productionOrder.findMany({
    where: {
      plannedStart: { lte: endDate },
      status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] },
    },
    include: {
      recipe: {
        include: {
          items: {
            include: { material: { select: { id: true, code: true, name: true, currentStock: true, unitOfMeasure: true, minStockLevel: true } } },
          },
        },
      },
    },
  });

  // Malzeme bazlı toplam ihtiyaç
  const demandMap = new Map<string, { materialId: string; materialName: string; unit: string; required: number; currentStock: number; minStockLevel: number }>();

  for (const order of orders) {
    for (const item of order.recipe?.items ?? []) {
      const required = Number(item.quantity) * Number(order.plannedQuantity);
      const existing = demandMap.get(item.materialId);
      if (existing) {
        existing.required += required;
      } else {
        demandMap.set(item.materialId, {
          materialId: item.materialId,
          materialName: item.material.name,
          unit: item.material.unitOfMeasure,
          required,
          currentStock: Number(item.material.currentStock),
          minStockLevel: Number(item.material.minStockLevel),
        });
      }
    }
  }

  const items = Array.from(demandMap.values()).map((i) => ({
    ...i,
    shortage: Math.max(0, i.required - i.currentStock),
    isShortage: i.currentStock < i.required,
    isCritical: i.currentStock < i.minStockLevel,
  }));

  return {
    items,
    criticalCount: items.filter((i) => i.isShortage).length,
  };
}
```

`production-order.controller.ts`'e ekle:

```typescript
@Get('material-demand')
async getMaterialDemand(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
  const result = await this.productionOrderService.getMaterialDemand(days);
  return { success: true, data: result };
}
```

**ÖNEMLİ:** Bu endpoint'i de `@Get(':id')` endpoint'inden önce ekle.

### Step 2: Hook'u ekle

`use-production-orders.ts` sonuna ekle:

```typescript
export function useMaterialDemand(days: number = 30) {
  return useQuery({
    queryKey: ['production-orders', 'material-demand', days],
    queryFn: () => apiClient.get<{ success: boolean; data: any }>(`/production-orders/material-demand?days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}
```

### Step 3: Bileşeni oluştur

```tsx
// apps/web/src/app/(dashboard)/production/planning/resource-analysis.tsx
'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { AlertTriangle, PackageCheck, TrendingDown } from 'lucide-react';
import { useMaterialDemand } from '@/hooks/use-production-orders';

export function ResourceAnalysis() {
  const { data, isLoading } = useMaterialDemand(30);
  const result = data?.data?.data;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Yükleniyor...</div>;
  }

  const items: any[] = result?.items ?? [];
  const criticalItems = items.filter((i) => i.isShortage);
  const okItems = items.filter((i) => !i.isShortage);

  const chartData = items.slice(0, 15).map((i) => ({
    name: i.materialName.length > 16 ? i.materialName.slice(0, 16) + '…' : i.materialName,
    'İhtiyaç': parseFloat(i.required.toFixed(2)),
    'Mevcut Stok': parseFloat(i.currentStock.toFixed(2)),
    isShortage: i.isShortage,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-rose-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-lg">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kritik Malzeme</p>
            <p className="text-2xl font-bold text-rose-600">{criticalItems.length}</p>
            <p className="text-xs text-slate-400">Stok yetersiz</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hazır Malzeme</p>
            <p className="text-2xl font-bold text-emerald-600">{okItems.length}</p>
            <p className="text-xs text-slate-400">Stok yeterli</p>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Malzeme</p>
            <p className="text-2xl font-bold text-amber-600">{items.length}</p>
            <p className="text-xs text-slate-400">30 günlük plan kapsamı</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-4">30 Günlük Hammadde İhtiyacı vs Mevcut Stok</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="İhtiyaç" fill="#ef4444" opacity={0.8} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mevcut Stok" fill="#10b981" opacity={0.8} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Kritik Malzemeler Tablosu */}
      {criticalItems.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl overflow-hidden">
          <div className="bg-rose-50 px-4 py-2.5 border-b border-rose-200">
            <h3 className="text-sm font-bold text-rose-700">Eksik Malzeme Listesi</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-2">Malzeme</th>
                <th className="text-right px-4 py-2">İhtiyaç</th>
                <th className="text-right px-4 py-2">Mevcut</th>
                <th className="text-right px-4 py-2">Eksik</th>
              </tr>
            </thead>
            <tbody>
              {criticalItems.map((i) => (
                <tr key={i.materialId} className="border-t border-slate-100 hover:bg-rose-50/50">
                  <td className="px-4 py-2 font-medium text-slate-700">{i.materialName}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{i.required.toFixed(2)} {i.unit}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{i.currentStock.toFixed(2)} {i.unit}</td>
                  <td className="px-4 py-2 text-right font-bold text-rose-600">{i.shortage.toFixed(2)} {i.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Commit

```bash
git add apps/api/src/modules/production-order/production-order.service.ts
git add apps/api/src/modules/production-order/production-order.controller.ts
git add apps/web/src/hooks/use-production-orders.ts
git add apps/web/src/app/\(dashboard\)/production/planning/resource-analysis.tsx
git commit -m "feat: add material demand analysis endpoint and ResourceAnalysis component"
```

---

## Task 8: Frontend — `page.tsx` Tab Yapısına Geçiş (Ana Entegrasyon)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/production/planning/page.tsx`

Bu adım tüm bileşenleri birleştirir. Mevcut `page.tsx` içeriğini tamamen aşağıdaki ile değiştir:

```tsx
// apps/web/src/app/(dashboard)/production/planning/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import {
  Factory, Clock, Database, CheckCircle2, XCircle, AlertTriangle,
  Download, Plus, RefreshCw, Search, Filter,
  LayoutList, KanbanSquare, CalendarDays, BarChart3,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { useProductionOrderDetail, useUpdateProductionOrder } from '@/hooks/use-production-orders';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormEngine } from '@/components/form-engine/form-engine';
import { useToast } from '@/hooks/use-toast';
import { PlanningGrid } from './planning-grid';
import { PlanningKanban } from './planning-kanban';
import { PlanningCalendar } from './planning-calendar';
import { ResourceAnalysis } from './resource-analysis';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Taslak', className: 'bg-slate-400' },
  PLANNED: { label: 'Planlandı', className: 'bg-blue-500' },
  IN_PROGRESS: { label: 'Devam Ediyor', className: 'bg-amber-500' },
  QC_PENDING: { label: 'KK Bekliyor', className: 'bg-purple-500' },
  COMPLETED: { label: 'Tamamlandı', className: 'bg-emerald-500' },
  CANCELLED: { label: 'İptal', className: 'bg-rose-500' },
};

const TAB_ITEMS = [
  { id: 'grid',     label: 'İş Emirleri',      icon: LayoutList },
  { id: 'kanban',   label: 'Kanban',           icon: KanbanSquare },
  { id: 'calendar', label: 'Takvim',           icon: CalendarDays },
  { id: 'resources',label: 'Kaynak Analizi',   icon: BarChart3 },
];

export default function ProductionPlanningPage() {
  const [activeTab, setActiveTab] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  const { data: summaryResult, refetch, isFetching } = useQuery({
    queryKey: ['production-orders-summary'],
    queryFn: () => apiClient.get<any>('/production-orders/summary'),
  });
  const summary = summaryResult?.data;
  const byStatus = summary?.byStatus ?? {};
  const byStatusMap: Record<string, number> = {};
  if (Array.isArray(byStatus)) {
    for (const s of byStatus) byStatusMap[s.status] = s.count;
  }

  const { data: detailResponse, isLoading: isLoadingDetail, error: detailError } =
    useProductionOrderDetail(sheetOpen ? selectedId : null);
  const updateMutation = useUpdateProductionOrder();
  const detail = detailResponse?.data;

  const handleRowClick = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  const handlePlanClick = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  const handleSheetSubmit = useCallback(async (formData: Record<string, any>) => {
    if (!selectedId) return;
    try {
      await updateMutation.mutateAsync({ id: selectedId, data: formData });
      toast({ title: 'Başarılı', description: 'Üretim emri güncellendi.' });
      setSheetOpen(false);
      refetch();
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message || 'Güncelleme hatası.', variant: 'destructive' });
    }
  }, [selectedId, updateMutation, toast, refetch]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#f88962] rounded-md text-white shadow-sm">
              <Factory className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Üretim</p>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">Üretim Planlama Merkezi</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
              className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} /> Yenile
            </Button>
            <Button variant="outline" size="sm" className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
              <Download className="w-4 h-4 mr-2" /> Dışa Aktar
            </Button>
            <Button className="bg-lightning-blue hover:bg-lightning-blue-dark text-white h-[32px] px-4 font-bold rounded shadow-sm">
              <Plus className="w-4 h-4 mr-1" /> Yeni Üretim Emri
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="PLANLANAN" value={byStatusMap.PLANNED ?? 0} icon={<Clock className="w-4 h-4 text-blue-500" />} />
          <MetricCard label="DEVAM EDEN" value={byStatusMap.IN_PROGRESS ?? 0} icon={<Database className="w-4 h-4 text-amber-500" />} />
          <MetricCard label="TAMAMLANAN" value={byStatusMap.COMPLETED ?? 0} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
          <MetricCard label="İPTAL" value={byStatusMap.CANCELLED ?? 0} icon={<XCircle className="w-4 h-4 text-rose-500" />} />
          <MetricCard label="GECİKMİŞ" value={summary?.overdueCount ?? 0} icon={<AlertTriangle className="w-4 h-4 text-amber-500" />} warning={(summary?.overdueCount ?? 0) > 0} />
        </div>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            {TAB_ITEMS.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-slate-500 transition-all
                  data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm
                  hover:text-slate-700"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Tab 1: Grid */}
          <Tabs.Content value="grid" className="mt-4">
            <div className="bg-white rounded border border-lightning-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 bg-[#f3f3f3] px-6 py-3 border-b border-lightning-border">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Liste içerisinde ara..."
                    className="pl-9 h-8 border-lightning-border shadow-none rounded-sm bg-white text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-sm border-lightning-border bg-white text-slate-600 text-xs font-semibold px-3">
                  <Filter className="w-3.5 h-3.5 mr-2" /> Filtrele
                </Button>
              </div>
              <PlanningGrid
                searchTerm={searchTerm}
                onRowClick={handleRowClick}
                onPlanClick={handlePlanClick}
              />
            </div>
          </Tabs.Content>

          {/* Tab 2: Kanban */}
          <Tabs.Content value="kanban" className="mt-4">
            <PlanningKanban />
          </Tabs.Content>

          {/* Tab 3: Takvim */}
          <Tabs.Content value="calendar" className="mt-4">
            <PlanningCalendar />
          </Tabs.Content>

          {/* Tab 4: Kaynak Analizi */}
          <Tabs.Content value="resources" className="mt-4">
            <ResourceAnalysis />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col p-0 border-none rounded-l-3xl shadow-2xl">
          <div className="bg-slate-900 text-white p-8 flex-shrink-0 relative overflow-hidden">
            <div className="relative z-10">
              <SheetHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <Factory className="w-6 h-6 text-orange-400" />
                  </div>
                  <SheetTitle className="text-2xl font-black text-white">
                    {isLoadingDetail ? 'Yükleniyor...' : detail?.orderNumber || 'Üretim Emri Düzenle'}
                  </SheetTitle>
                  {detail?.status && (
                    <Badge className={`text-white ${STATUS_MAP[detail.status]?.className ?? 'bg-gray-400'}`}>
                      {STATUS_MAP[detail.status]?.label ?? detail.status}
                    </Badge>
                  )}
                </div>
                <SheetDescription className="text-slate-400 font-medium">
                  {detail?.product?.name ?? 'Seçili üretim emrini düzenleyin'}
                </SheetDescription>
              </SheetHeader>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
          </div>
          <ScrollArea className="flex-1 px-8 py-8 bg-white">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-24 text-slate-400">Yükleniyor...</div>
            ) : detail ? (
              <FormEngine
                entitySlug="production-order-card"
                initialData={detail}
                onSubmit={handleSheetSubmit}
                isSubmitting={updateMutation.isPending}
                onCancel={() => setSheetOpen(false)}
                className="pb-12"
              />
            ) : (
              <div className="text-center py-24 text-slate-400 italic">Üretim emri bulunamadı.</div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MetricCard({ label, value, icon, warning }: any) {
  return (
    <div className="bg-white p-4 border border-lightning-border rounded shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <h3 className={`text-2xl font-bold ${warning ? 'text-amber-600' : 'text-slate-800'}`}>{value}</h3>
    </div>
  );
}
```

### Step 2: Commit

```bash
git add apps/web/src/app/\(dashboard\)/production/planning/page.tsx
git commit -m "feat(web): convert production planning page to multi-view tabs"
```

---

## Task 9: Son Kontrol & Build

### Step 1: TypeScript hata kontrolü

```bash
cd c:/Users/PC/.gemini/antigravity/scratch/sepe4.6
pnpm --filter @sepe/web exec tsc --noEmit
```

Çıkan hataları gözden geçir ve düzelt.

### Step 2: Web'i başlat ve manuel test et

```bash
pnpm --filter @sepe/web dev
```

Kontrol listesi:
- [ ] http://localhost:3000/production/planning açılıyor
- [ ] Grid sekmesi veri gösteriyor
- [ ] Kanban sekmesi sütunlara ayrılmış kartlar gösteriyor
- [ ] Takvim sekmesi açılıyor (olaylar opsiyonel, tarihsiz emirler görünmez)
- [ ] Kaynak Analizi sekmesi grafik gösteriyor
- [ ] Trafik ışığı ikonları grid'de görünüyor
- [ ] Kanban'da sürükle-bırak çalışıyor

### Step 3: Final commit

```bash
git add -A
git commit -m "feat: complete Uretim Planlama Merkezi - multi-view production planning"
```

---

## Bilinen Sınırlamalar & Sonraki Adımlar

1. **Trafik ışığı grid'de:** `checkMaterialAvailability` sunucu taraflı grid datasource içinden çağrılamaz (N+1 sorun). Bunun yerine `findAll` sorgusu genişletilerek her emre `_materialStatus` alanı eklenebilir (ileride yapılacak optimizasyon).

2. **Calendar CSS:** `react-big-calendar/lib/css/react-big-calendar.css` import'u globals.css'e eklenmelidir yoksa takvim stili bozuk çıkar.

3. **date-fns locale:** `tr` locale'i `date-fns` paketinden gelir. Eğer TypeScript import hatası alınırsa `date-fns/locale/tr` formatında dene.

4. **`QC_PENDING` durumu:** Schema'da `ProductionOrderStatus` enum'unda `QC_PENDING` yok, bu yüzden `complete()` metodu direkt `COMPLETED`'a geçiriyor. İleride `QC_PENDING` eklenebilir.
