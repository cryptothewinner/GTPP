'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useMaterialBatchList, MaterialBatch } from '@/hooks/use-material-batches';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import { ColDef } from 'ag-grid-community';
import { MaterialBatchDetailSheet } from './batch-detail-sheet';
import { CreateMaterialBatchSheet } from './create-batch-sheet';
import { Package, AlertTriangle, Archive, Scale, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STATUS_LABELS: Record<string, string> = {
    AVAILABLE: 'Kullanılabilir',
    RESERVED: 'Rezerve',
    CONSUMED: 'Tüketildi',
    EXPIRED: 'Süresi Dolmuş',
    QUARANTINE: 'Karantina',
};

const STATUS_VARIANTS: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500 hover:bg-emerald-600',
    RESERVED: 'bg-amber-500 hover:bg-amber-600',
    CONSUMED: 'bg-slate-500 hover:bg-slate-600',
    EXPIRED: 'bg-rose-500 hover:bg-rose-600',
    QUARANTINE: 'bg-rose-500 hover:bg-rose-600',
};

export default function MaterialBatchesPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(500);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [createBatchOpen, setCreateBatchOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const { data, isLoading } = useMaterialBatchList({
        page,
        pageSize,
        search,
        sortField: 'createdAt',
        sortOrder: 'desc',
    });

    const meta = data?.meta;
    const allBatches = data?.data || [];

    const metrics = useMemo(() => {
        const total = meta?.total || 0;
        const lowStock = allBatches.filter(b => b.remainingQuantity < b.quantity * 0.2 && b.status === 'AVAILABLE').length;
        const expired = allBatches.filter(b => b.status === 'EXPIRED').length;
        const available = allBatches.filter(b => b.status === 'AVAILABLE').length;
        return { total, lowStock, expired, available };
    }, [allBatches, meta]);

    const colDefs = useMemo<ColDef<MaterialBatch>[]>(() => [
        {
            field: 'batchNumber',
            headerName: 'Parti No',
            width: 180,
            pinned: 'left',
            filter: 'agTextColumnFilter',
            cellClass: 'font-semibold text-slate-700',
        },
        {
            field: 'material.code',
            headerName: 'Malzeme Kodu',
            width: 140,
            filter: 'agTextColumnFilter',
            cellClass: 'text-slate-600 font-medium',
        },
        {
            field: 'material.name',
            headerName: 'Malzeme Adı',
            flex: 2,
            minWidth: 200,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'supplierLotNo',
            headerName: 'Tedarikçi Lot',
            width: 150,
            filter: 'agTextColumnFilter',
            valueFormatter: (params) => params.value || '-',
        },
        {
            field: 'remainingQuantity',
            headerName: 'Kalan',
            width: 130,
            type: 'rightAligned',
            valueFormatter: (params) => {
                const val = params.value;
                const unit = params.data?.material?.unitOfMeasure || '';
                return `${Number(val).toLocaleString('tr-TR')} ${unit}`;
            },
            cellStyle: { fontWeight: 'bold' }
        },
        {
            field: 'quantity',
            headerName: 'İlk Miktar',
            width: 130,
            type: 'rightAligned',
            valueFormatter: (params) => {
                const val = params.value;
                const unit = params.data?.material?.unitOfMeasure || '';
                return `${Number(val).toLocaleString('tr-TR')} ${unit}`;
            }
        },
        {
            field: 'storageLocation',
            headerName: 'Konum',
            width: 140,
            valueFormatter: (params) => params.value || '-',
        },
        {
            field: 'expiryDate',
            headerName: 'S.K.T.',
            width: 120,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
            cellStyle: (params) => {
                if (!params.value) return null;
                const date = new Date(params.value);
                const now = new Date();
                const diffTime = date.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0) return { color: '#e11d48', fontWeight: 'bold' };
                if (diffDays < 30) return { color: '#d97706', fontWeight: 'bold' };
                return null;
            }
        },
        {
            field: 'status',
            headerName: 'Durum',
            width: 130,
            cellRenderer: (params: any) => {
                const status = params.value as string;
                const label = STATUS_LABELS[status] || status;
                const className = STATUS_VARIANTS[status] || 'bg-slate-500';
                return <Badge className={`border-none ${className}`}>{label}</Badge>;
            },
        },
    ], []);

    const onRowDoubleClicked = useCallback((event: any) => {
        if (event.data?.id) {
            setSelectedId(event.data.id);
            setSheetOpen(true);
        }
    }, []);

    return (
        <div className="h-full flex flex-col space-y-4 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Malzeme Partileri</h2>
                <p className="text-muted-foreground text-sm">
                    Stoktakı tüm hammadde ve ambalaj partilerinin detaylı takibi ve yönetimi
                </p>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => setCreateBatchOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Parti Ekle
                </Button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="TOPLAM PARTİ"
                    value={metrics.total}
                    icon={<Package className="w-4 h-4 text-blue-500" />}
                />
                <MetricCard
                    label="KULLANILABİLİR"
                    value={metrics.available}
                    icon={<Archive className="w-4 h-4 text-emerald-500" />}
                />
                <MetricCard
                    label="KRİTİK/AZALAN"
                    value={metrics.lowStock}
                    icon={<Scale className="w-4 h-4 text-amber-500" />}
                    warning={metrics.lowStock > 0}
                />
                <MetricCard
                    label="SÜRESİ DOLMUŞ"
                    value={metrics.expired}
                    icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                    danger={metrics.expired > 0}
                />
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-200 w-fit">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Parti no, malzeme veya tedarikçi lot ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 border-none shadow-none bg-transparent focus-visible:ring-0"
                    />
                </div>
            </div>

            <div className="bg-white rounded border border-lightning-border shadow-sm flex flex-col overflow-hidden">
                {mounted ? (
                    <div style={{ height: '600px', width: '100%' }}>
                        <div style={{ height: '100%', width: '100%' }}>
                            <AgGridReact
                                theme={themeQuartz}
                                columnDefs={colDefs}
                                rowData={allBatches}
                                pagination={true}
                                paginationPageSize={20}
                                rowHeight={42}
                                headerHeight={32}
                                defaultColDef={{
                                    sortable: true,
                                    filter: true,
                                    resizable: true,
                                    floatingFilter: false,
                                }}
                                rowSelection={{ mode: 'singleRow' }}
                                onRowDoubleClicked={onRowDoubleClicked}
                                animateRows={true}
                                overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Kayıt bulunamadı</span>'
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '600px' }} className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                )}
            </div>

            <MaterialBatchDetailSheet
                batchId={selectedId}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />

            <CreateMaterialBatchSheet
                open={createBatchOpen}
                onOpenChange={setCreateBatchOpen}
            />
        </div>
    );
}

function MetricCard({ label, value, icon, warning, danger }: any) {
    return (
        <Card className="shadow-sm hover:shadow border-slate-200">
            <CardContent className="p-4">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                    {icon}
                </div>
                <div className={`text-2xl font-bold ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : 'text-slate-900'}`}>
                    {value.toLocaleString('tr-TR')}
                </div>
            </CardContent>
        </Card>
    );
}
