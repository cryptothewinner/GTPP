'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type {
    ColDef,
    GridReadyEvent,
    GridApi,
    GetRowIdParams,
} from 'ag-grid-community';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import {
    useMaterialDetail,
    useUpdateMaterial,
    type MaterialDetail,
    type MaterialDetailResponse,
} from '@/hooks/use-materials';
import { FormEngine } from '@/components/form-engine/form-engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
    Layers,
    Search,
    Filter,
    RefreshCw,
    Plus,
    Loader2,
    Database,
    AlertTriangle,
    Beaker,
    PackageOpen,
} from 'lucide-react';
import { CreateMaterialSheet } from './create-material-sheet';


/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MaterialRow {
    id: string;
    code: string;
    name: string;
    type: string;
    currentStock: number;
    minStockLevel: number;
    unitPrice: number;
    supplier?: { name: string };
    isActive: boolean;
    batches?: { batchNumber: string; remainingQuantity: number }[];
}

function unwrapMaterialDetail(response: MaterialDetailResponse | undefined): MaterialDetail | null {
    if (!response) return null;

    if ('data' in response) {
        return response.data;
    }

    return response;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RawMaterialsPage() {
    const { toast } = useToast();

    /* ---------- summary ---------- */
    const {
        data: summaryResult,
        refetch: refetchSummary,
        isFetching: isFetchingSummary,
    } = useQuery({
        queryKey: ['materials-summary'],
        queryFn: () => apiClient.get<any>('/materials/summary'),
    });
    const summary = summaryResult?.data ?? summaryResult;

    /* ---------- grid state ---------- */
    const gridRef = useRef<AgGridReact>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    /* ---------- edit sheet state ---------- */
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const getRowId = useCallback(
        (params: GetRowIdParams<MaterialRow>) => params.data.id,
        [],
    );
    const [sheetOpen, setSheetOpen] = useState(false);
    const [createSheetOpen, setCreateSheetOpen] = useState(false);

    const {
        data: detailResponse,
        isLoading: isLoadingDetail,
        error: detailError,
    } = useMaterialDetail(sheetOpen ? selectedId : null);
    const updateMutation = useUpdateMaterial();
    const detail = unwrapMaterialDetail(detailResponse);

    /* ---------- helpers ---------- */
    const byTypeMap = useMemo(() => {
        const map: Record<string, number> = {};
        if (summary?.byType && Array.isArray(summary.byType)) {
            summary.byType.forEach((item: any) => {
                map[item.type] = item.count;
            });
        }
        return map;
    }, [summary]);

    const rawMaterialCount = byTypeMap['RAW_MATERIAL'] ?? byTypeMap['raw_material'] ?? 0;
    const packagingCount = byTypeMap['PACKAGING'] ?? byTypeMap['packaging'] ?? 0;

    /* ---------- columns ---------- */
    const columnDefs = useMemo<ColDef<MaterialRow>[]>(
        () => [
            {
                field: 'code',
                headerName: 'MALZEME KODU',
                width: 140,
                pinned: 'left',
                filter: 'agTextColumnFilter',
                cellClass:
                    'font-semibold text-lightning-blue border-r border-lightning-border',
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                field: 'name',
                headerName: 'MALZEME ADI',
                minWidth: 250,
                flex: 1,
                filter: 'agTextColumnFilter',
                cellClass: 'text-slate-700 font-medium',
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                field: 'type',
                headerName: 'MALZEME TÜRÜ',
                width: 130,
                filter: 'agTextColumnFilter',
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const map: Record<
                        string,
                        { label: string; cls: string }
                    > = {
                        RAW_MATERIAL: {
                            label: 'Hammadde',
                            cls: 'bg-emerald-500',
                        },
                        PACKAGING: {
                            label: 'Ambalaj',
                            cls: 'bg-blue-500',
                        },
                        SEMI_FINISHED: {
                            label: 'Yarı Mamul',
                            cls: 'bg-amber-500',
                        },
                        FINISHED_PRODUCT: {
                            label: 'Bitmiş Ürün',
                            cls: 'bg-purple-500',
                        },
                    };
                    const entry = map[params.value] ?? {
                        label: params.value,
                        cls: 'bg-slate-400',
                    };
                    return (
                        <div className="flex items-center h-full">
                            <Badge
                                className={`rounded-sm text-[10px] font-bold uppercase tracking-tight py-0 px-2 shadow-none border-none text-white ${entry.cls}`}
                            >
                                {entry.label}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                field: 'currentStock',
                headerName: 'MEVCUT STOK',
                width: 130,
                filter: 'agNumberColumnFilter',
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const val = params.value ?? 0;
                    const min = params.data?.minStockLevel ?? 0;
                    const color =
                        val < min ? 'text-rose-600' : 'text-slate-700';
                    return (
                        <div className={`font-bold ${color}`}>
                            {val.toLocaleString('tr-TR')}
                        </div>
                    );
                },
            },
            {
                field: 'unitPrice',
                headerName: 'BİRİM FİYAT',
                width: 130,
                filter: 'agNumberColumnFilter',
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => {
                    if (params.value == null) return '';
                    return `${params.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} \u20BA`;
                },
                cellClass: 'font-medium text-slate-700 text-right',
            },
            {
                headerName: 'TEDARİKÇİ',
                width: 180,
                filter: 'agTextColumnFilter',
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueGetter: (params: any) =>
                    params.data?.supplier?.name ?? '-',
                cellClass: 'text-slate-600',
            },
            {
                headerName: 'MEVCUT PARTİLER',
                width: 160,
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const batches = params.data?.batches || [];
                    if (batches.length === 0) return <span className="text-slate-400">-</span>;

                    return (
                        <div className="flex items-center gap-1 flex-wrap py-1">
                            {batches.slice(0, 2).map((b: any) => (
                                <Badge key={b.batchNumber} variant="outline" className="text-[10px] h-5 px-1 bg-slate-50 border-slate-200 text-slate-600">
                                    {b.batchNumber}
                                </Badge>
                            ))}
                            {batches.length > 2 && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1">
                                    +{batches.length - 2}
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                field: 'minStockLevel',
                headerName: 'MİN. STOK',
                width: 120,
                filter: 'agNumberColumnFilter',
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-slate-600',
            },
            {
                field: 'isActive',
                headerName: 'DURUM',
                width: 100,
                headerClass:
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => (
                    <div className="flex items-center h-full">
                        <Badge
                            className={`rounded-sm text-[10px] font-bold uppercase tracking-tight py-0 px-2 shadow-none border-none ${params.value ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            {params.value ? 'AKTİF' : 'PASİF'}
                        </Badge>
                    </div>
                ),
            },
        ],
        [],
    );

    /* ---------- client-side data fetch ---------- */
    const [rowData, setRowData] = useState<MaterialRow[]>([]);
    const [isLoadingGrid, setIsLoadingGrid] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const fetchMaterials = useCallback(async () => {
        try {
            setIsLoadingGrid(true);
            const sp = new URLSearchParams();
            sp.set('page', '1');
            sp.set('pageSize', '500');
            if (searchTerm) sp.set('search', searchTerm);

            const response = await apiClient.get<any>(`/materials?${sp.toString()}`);
            console.log('MaterialsGrid: data received', response.data?.length, 'rows');

            const materials = (response.data ?? []).map((row: any) => ({
                ...row,
                currentStock: Number(row.currentStock) || 0,
                minStockLevel: Number(row.minStockLevel) || 0,
                unitPrice: Number(row.unitPrice) || 0,
            }));

            setRowData(materials);
        } catch (error) {
            console.error('MaterialsGrid error:', error);
        } finally {
            setIsLoadingGrid(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const onGridReady = useCallback(
        (event: GridReadyEvent) => {
            setGridApi(event.api);
        },
        [],
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const onRowDoubleClicked = useCallback((event: any) => {
        if (event.data?.id) {
            setSelectedId(event.data.id);
            setSheetOpen(true);
        }
    }, []);

    const handleRefresh = useCallback(() => {
        refetchSummary();
        fetchMaterials();
    }, [refetchSummary, fetchMaterials]);

    /* ---------- edit sheet submit ---------- */
    const handleEditSubmit = useCallback(
        async (formData: Record<string, any>) => {
            if (!selectedId) return;
            try {
                await updateMutation.mutateAsync({
                    id: selectedId,
                    data: formData,
                });
                toast({
                    title: 'Başarılı',
                    description: 'Malzeme bilgileri başarıyla güncellendi.',
                });
                setSheetOpen(false);
                handleRefresh();
            } catch (error: any) {
                toast({
                    title: 'Hata',
                    description:
                        error.message ||
                        'Güncelleme sırasında bir hata oluştu.',
                    variant: 'destructive',
                });
            }
        },
        [selectedId, updateMutation, toast, handleRefresh],
    );

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Header */}
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-[#38b2ac] rounded-md text-white shadow-sm">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Malzemeler
                            </p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                                Malzemeler
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Malzeme envanterini ve tedarikçi bilgilerini
                                yönetin
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold"
                            onClick={handleRefresh}
                            disabled={isFetchingSummary}
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${isFetchingSummary ? 'animate-spin' : ''}`}
                            />
                            Yenile
                        </Button>
                        <Button
                            className="bg-[#38b2ac] hover:bg-[#2c9a94] text-white h-[32px] px-4 font-bold rounded shadow-sm"
                            onClick={() => setCreateSheetOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Yeni Malzeme Ekle
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="TOPLAM MALZEME"
                        value={summary?.totalMaterials ?? 0}
                        icon={
                            <Database className="w-4 h-4 text-blue-500" />
                        }
                    />
                    <MetricCard
                        label="DÜŞÜK STOK"
                        value={summary?.lowStockCount ?? 0}
                        icon={
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        }
                        warning={(summary?.lowStockCount ?? 0) > 0}
                    />
                    <MetricCard
                        label="HAMMADDE ÇEŞİDİ"
                        value={rawMaterialCount}
                        icon={
                            <Beaker className="w-4 h-4 text-emerald-500" />
                        }
                    />
                    <MetricCard
                        label="AMBALAJ ÇEŞİDİ"
                        value={packagingCount}
                        icon={
                            <PackageOpen className="w-4 h-4 text-indigo-500" />
                        }
                    />
                </div>

                {/* Data Grid */}
                <div className="bg-white rounded border border-lightning-border shadow-sm min-h-[600px] flex flex-col overflow-hidden">
                    {/* Search & Utility Bar */}
                    <div className="flex items-center justify-between gap-4 bg-[#f3f3f3] px-6 py-3 border-b border-lightning-border">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder="Malzeme ara..."
                                    className="pl-9 h-8 border-lightning-border focus:ring-lightning-blue shadow-none rounded-sm bg-white text-sm"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                                {summary?.totalMaterials
                                    ? `${summary.totalMaterials} kayıt`
                                    : 'Kayıtlar yükleniyor...'}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-sm border-lightning-border bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold px-3"
                            >
                                <Filter className="w-3.5 h-3.5 mr-2" />
                                Filtrele
                            </Button>
                        </div>
                    </div>

                    {/* AG Grid */}
                    {mounted ? (
                        <div style={{ height: '500px', width: '100%' }}>
                            <div style={{ height: '100%', width: '100%' }}>
                                <AgGridReact
                                    theme={themeQuartz}
                                    ref={gridRef}
                                    getRowId={getRowId}
                                    columnDefs={columnDefs}
                                    defaultColDef={{
                                        sortable: true,
                                        resizable: true,
                                        filter: true,
                                        floatingFilter: false,
                                        flex: 0,
                                    }}
                                    rowData={rowData}
                                    rowHeight={42}
                                    headerHeight={32}
                                    onGridReady={onGridReady}
                                    onRowDoubleClicked={onRowDoubleClicked}
                                    animateRows={true}
                                    rowSelection={{
                                        mode: 'singleRow',
                                        checkboxes: false,
                                    }}
                                    overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                                    overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Kayıt bulunamadı</span>'
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '500px' }} className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col p-0 border-none rounded-l-3xl shadow-2xl">
                    <div className="bg-slate-900 text-white p-8 flex-shrink-0 relative overflow-hidden">
                        <div className="relative z-10">
                            <SheetHeader>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-[#38b2ac]/20 rounded-xl">
                                        <Layers className="w-6 h-6 text-[#38b2ac]" />
                                    </div>
                                    <SheetTitle className="text-2xl font-black text-white">
                                        {isLoadingDetail
                                            ? 'Yükleniyor...'
                                            : detail?.code ||
                                            'Malzeme Düzenle'}
                                    </SheetTitle>
                                    {detail && (
                                        <Badge
                                            variant={
                                                detail.isActive
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className={
                                                detail.isActive
                                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                                    : ''
                                            }
                                        >
                                            {detail.isActive
                                                ? 'Aktif'
                                                : 'Pasif'}
                                        </Badge>
                                    )}
                                </div>
                                <SheetDescription className="text-slate-400 font-medium">
                                    {detail
                                        ? detail.name
                                        : 'Seçili malzemenin detaylarını güncelleyin.'}
                                </SheetDescription>
                            </SheetHeader>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#38b2ac]/20 blur-3xl rounded-full -mr-16 -mt-16" />
                    </div>

                    <ScrollArea className="flex-1 px-8 py-8 bg-white">
                        {isLoadingDetail ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-[#38b2ac]" />
                                <p className="text-slate-500 font-medium animate-pulse">
                                    Malzeme verileri getiriliyor...
                                </p>
                            </div>
                        ) : detailError ? (
                            <div className="text-center py-24 space-y-4">
                                <p className="text-rose-500 font-bold">
                                    Veri Yükleme Hatası
                                </p>
                                <p className="text-slate-500 text-sm">
                                    {(detailError as any).message}
                                </p>
                            </div>
                        ) : detail ? (
                            <FormEngine
                                entitySlug="material-card"
                                initialData={detail}
                                onSubmit={handleEditSubmit}
                                isSubmitting={updateMutation.isPending}
                                onCancel={() => setSheetOpen(false)}
                                className="pb-12"
                            />
                        ) : (
                            <div className="text-center py-24">
                                <p className="text-slate-400 italic">
                                    Malzeme bulunamadı veya ID geçersiz.
                                </p>
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <CreateMaterialSheet
                open={createSheetOpen}
                onOpenChange={setCreateSheetOpen}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  MetricCard                                                         */
/* ------------------------------------------------------------------ */

function MetricCard({
    label,
    value,
    icon,
    trend,
    positive,
    warning,
    danger,
}: any) {
    return (
        <div className="bg-white p-4 border border-lightning-border rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {label}
                </span>
                {icon}
            </div>
            <div className="flex items-end justify-between">
                <h3
                    className={`text-2xl font-bold ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : 'text-slate-800'}`}
                >
                    {value}
                </h3>
            </div>
            {trend && (
                <p
                    className={`text-[11px] mt-2 font-medium ${positive ? 'text-emerald-600' : 'text-slate-400'}`}
                >
                    {trend}
                </p>
            )}
        </div>
    );
}
