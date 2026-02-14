'use client';

import { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import {
    Layers,
    RefreshCw,
    Download,
    AlertTriangle,
    Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useMaterialDetail } from '@/hooks/use-materials';

function MetricCard({ label, value, icon, warning }: { label: string; value: React.ReactNode; icon: React.ReactNode; warning?: boolean }) {
    return (
        <div className={`bg-white p-4 border rounded shadow-sm hover:shadow-md transition-shadow ${warning ? 'border-amber-300' : 'border-lightning-border'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <h3 className={`text-2xl font-bold ${warning ? 'text-amber-600' : 'text-slate-800'}`}>{value}</h3>
        </div>
    );
}

const typeLabels: Record<string, string> = {
    RAW_MATERIAL: 'Hammadde',
    PACKAGING: 'Ambalaj',
    SEMI_FINISHED: 'Yarı Mamul',
    FINISHED_PRODUCT: 'Bitmiş Ürün',
};

const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    RESERVED: 'bg-blue-100 text-blue-700',
    QUARANTINE: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-rose-100 text-rose-700',
    CONSUMED: 'bg-slate-100 text-slate-500',
};

export default function InventoryMaterialsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { data: listResult, refetch, isFetching } = useQuery({
        queryKey: ['materials', 'list', { page: 1, pageSize: 500 }],
        queryFn: () => apiClient.get<any>('/materials?page=1&pageSize=500'),
        staleTime: 30 * 1000,
    });

    const { data: summaryResult } = useQuery({
        queryKey: ['materials', 'summary'],
        queryFn: () => apiClient.get<any>('/materials/summary'),
        staleTime: 60 * 1000,
    });

    const { data: detailResult } = useMaterialDetail(selectedId);

    const rows: any[] = listResult?.data ?? [];
    const summary = summaryResult?.data;

    const detail: any = detailResult && 'data' in detailResult ? (detailResult as any).data : detailResult;
    const detailBatches: any[] = detail?.batches ?? [];

    const byType: any[] = summary?.byType ?? [];
    const rawCount = byType.find((t: any) => t.type === 'RAW_MATERIAL')?._count ?? 0;
    const packCount = byType.find((t: any) => t.type === 'PACKAGING')?._count ?? 0;

    const colDefs: ColDef[] = useMemo(() => [
        { field: 'code', headerName: 'KODU', width: 130, pinned: 'left', cellStyle: { fontWeight: 600, color: '#0176D3' } },
        { field: 'name', headerName: 'MALZEME ADI', flex: 1, minWidth: 220 },
        {
            field: 'type', headerName: 'TÜRÜ', width: 140,
            cellRenderer: (p: any) => <Badge variant="outline" className="text-[10px]">{typeLabels[p.value] ?? p.value}</Badge>,
        },
        {
            field: 'currentStock', headerName: 'TOPLAM STOK', width: 140,
            cellStyle: (p: any) => ({
                fontWeight: 700,
                color: Number(p.value) <= 0 ? '#dc2626' : Number(p.data?.minStockLevel) > 0 && Number(p.value) < Number(p.data?.minStockLevel) ? '#d97706' : '#1e293b',
            }),
            valueFormatter: (p: any) => `${Number(p.value).toLocaleString('tr-TR')} ${p.data?.unitOfMeasure ?? ''}`,
        },
        { field: 'minStockLevel', headerName: 'MİN. STOK', width: 120, valueFormatter: (p: any) => Number(p.value).toLocaleString('tr-TR') },
        {
            headerName: 'STOK DURUMU', width: 160,
            cellRenderer: (p: any) => {
                const cur = Number(p.data?.currentStock ?? 0);
                const min = Number(p.data?.minStockLevel ?? 0);
                if (min <= 0) return <span className="text-slate-400 text-xs">—</span>;
                const pct = Math.min(100, Math.round((cur / min) * 100));
                return (
                    <div className="flex items-center gap-2 h-full">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${pct <= 0 ? 'bg-rose-500' : pct < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500">{pct}%</span>
                    </div>
                );
            },
        },
        { field: 'unitPrice', headerName: 'BİRİM FİYAT', width: 120, valueFormatter: (p: any) => `₺ ${Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` },
        { field: 'supplier.name', headerName: 'TEDARİKÇİ', width: 160 },
        {
            headerName: 'PARTİ SAYISI', width: 110,
            valueGetter: (p: any) => p.data?.batches?.length ?? 0,
            cellRenderer: (p: any) => p.value > 0
                ? <Badge className="bg-blue-100 text-blue-700">{p.value}</Badge>
                : <span className="text-slate-400 text-xs">0</span>,
        },
    ], []);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-600 rounded-md text-white shadow-sm">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Envanter</p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Malzeme Stok Durumu</h1>
                            <p className="text-sm text-slate-500">Hammadde ve ambalaj stoklarının detaylı durumu ve parti bazlı takibi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
                            className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
                            <Download className="w-4 h-4 mr-2" />
                            Dışa Aktar
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard label="Toplam Malzeme" value={summary?.totalMaterials ?? '—'} icon={<Layers className="w-4 h-4 text-blue-500" />} />
                    <MetricCard label="Düşük Stok" value={summary?.lowStockCount ?? 0} icon={<AlertTriangle className="w-4 h-4 text-amber-500" />} warning={(summary?.lowStockCount ?? 0) > 0} />
                    <MetricCard label="Hammadde" value={rawCount} icon={<Package className="w-4 h-4 text-slate-500" />} />
                    <MetricCard label="Ambalaj" value={packCount} icon={<Package className="w-4 h-4 text-emerald-500" />} />
                </div>

                <div className="bg-white rounded border border-lightning-border shadow-sm overflow-hidden" style={{ height: '520px' }}>
                    {mounted && (
                        <AgGridReact
                            theme={themeQuartz}
                            rowData={rows}
                            columnDefs={colDefs}
                            rowSelection="single"
                            onRowClicked={(e) => setSelectedId(e.data?.id ?? null)}
                            defaultColDef={{ sortable: true, resizable: true, filter: true }}
                            getRowId={(p) => p.data.id}
                        />
                    )}
                </div>
            </div>

            {/* Detail Sheet — malzeme + partileri */}
            <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
                <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col rounded-l-3xl overflow-hidden">
                    <SheetHeader className="bg-slate-900 text-white px-6 py-5 shrink-0">
                        <SheetTitle className="text-white text-lg font-bold">{detail?.name ?? 'Malzeme Detayı'}</SheetTitle>
                        <SheetDescription className="text-slate-400 text-sm">{detail?.code} · {typeLabels[detail?.type] ?? detail?.type}</SheetDescription>
                        <div className="flex gap-3 mt-2 text-sm">
                            <span className="text-slate-300">Mevcut: <b className="text-white">{Number(detail?.currentStock ?? 0).toLocaleString('tr-TR')} {detail?.unitOfMeasure}</b></span>
                            <span className="text-slate-300">Min: <b className="text-white">{Number(detail?.minStockLevel ?? 0).toLocaleString('tr-TR')}</b></span>
                        </div>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Partiler ({detailBatches.length})</h3>
                            {detailBatches.length === 0 ? (
                                <p className="text-slate-400 text-sm">Bu malzemeye ait parti yok.</p>
                            ) : (
                                <div className="space-y-2">
                                    {detailBatches.map((b: any) => (
                                        <div key={b.id} className="border border-lightning-border rounded p-3 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{b.batchNumber}</p>
                                                <p className="text-xs text-slate-400">Lot: {b.supplierLotNo ?? '—'}</p>
                                                {b.expiryDate && (
                                                    <p className="text-xs text-slate-400">SKT: {new Date(b.expiryDate).toLocaleDateString('tr-TR')}</p>
                                                )}
                                                {b.storageLocation && (
                                                    <p className="text-xs text-slate-400">Depo: {b.storageLocation}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-700">{Number(b.remainingQuantity).toLocaleString('tr-TR')} {detail?.unitOfMeasure}</p>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[b.status] ?? 'bg-slate-100 text-slate-500'}`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}
