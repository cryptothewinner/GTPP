'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Factory,
    Database,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    Download,
    Plus,
    RefreshCw,
    Search,
    Filter,
    Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type {
    ColDef,
    GridReadyEvent,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    GridApi,
    GetRowIdParams,
} from 'ag-grid-enterprise';

import { apiClient } from '@/lib/api-client';
import { useProductionOrderDetail, useUpdateProductionOrder } from '@/hooks/use-production-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormEngine } from '@/components/form-engine/form-engine';
import { useToast } from '@/hooks/use-toast';



const STATUS_MAP: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Taslak', className: 'bg-slate-400' },
    PLANNED: { label: 'Planland\u0131', className: 'bg-blue-500' },
    IN_PROGRESS: { label: 'Devam Ediyor', className: 'bg-amber-500' },
    COMPLETED: { label: 'Tamamland\u0131', className: 'bg-emerald-500' },
    CANCELLED: { label: '\u0130ptal', className: 'bg-rose-500' },
};

export default function ProductionPlanningPage() {
    const gridRef = useRef<AgGridReact>(null);
    const getRowId = useCallback((params: GetRowIdParams<any>) => params.data.id, []);

    const { data: summaryResult, refetch, isFetching } = useQuery({
        queryKey: ['production-orders-summary'],
        queryFn: () => apiClient.get<any>('/production-orders/summary'),
    });

    const summary = summaryResult?.data;
    const byStatus = summary?.byStatus ?? {};

    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { toast } = useToast();
    const { data: detailResponse, isLoading: isLoadingDetail, error: detailError } =
        useProductionOrderDetail(sheetOpen ? selectedId : null);
    const updateMutation = useUpdateProductionOrder();
    const detail = detailResponse?.data;

    // --- Column Definitions ---
    const columnDefs = useMemo<ColDef[]>(
        () => [
            {
                field: 'orderNumber',
                headerName: 'EM\u0130R NO',
                width: 160,
                filter: 'agTextColumnFilter',
                pinned: 'left',
                cellClass: 'font-semibold text-lightning-blue border-r border-lightning-border',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                field: 'product.name',
                headerName: '\u00dcR\u00dcN',
                minWidth: 220,
                flex: 1,
                filter: 'agTextColumnFilter',
                cellClass: 'text-slate-700 font-medium',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueGetter: (params: any) => params.data?.product?.name ?? '',
            },
            {
                field: 'recipe.name',
                headerName: 'RE\u00c7ETE',
                width: 180,
                filter: 'agTextColumnFilter',
                cellClass: 'text-slate-600',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueGetter: (params: any) => params.data?.recipe?.name ?? '',
            },
            {
                field: 'plannedQuantity',
                headerName: 'PLANLANAN M\u0130KTAR',
                width: 160,
                filter: 'agNumberColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'font-bold text-slate-700 text-right',
                valueFormatter: (params: any) =>
                    params.value != null ? params.value.toLocaleString('tr-TR') : '',
            },
            {
                field: 'status',
                headerName: 'DURUM',
                width: 140,
                filter: 'agSetColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const s = STATUS_MAP[params.value] ?? { label: params.value, className: 'bg-gray-400' };
                    return (
                        <div className="flex items-center h-full">
                            <Badge className={`rounded-sm text-[10px] font-bold uppercase tracking-tight py-0 px-2 shadow-none border-none text-white ${s.className}`}>
                                {s.label}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                field: 'plannedStart',
                headerName: 'BA\u015eLANG\u0130\u00c7',
                width: 130,
                filter: 'agDateColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-slate-600',
                valueFormatter: (params: any) =>
                    params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '',
            },
            {
                field: 'plannedEnd',
                headerName: 'B\u0130T\u0130\u015e',
                width: 130,
                filter: 'agDateColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-slate-600',
                valueFormatter: (params: any) =>
                    params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '',
            },
        ],
        [],
    );

    // --- Server-Side Datasource ---
    const createDatasource = useCallback((): IServerSideDatasource => {
        return {
            getRows: async (params: IServerSideGetRowsParams) => {
                console.log('ProductionPlanning: getRows called', params.request);
                try {
                    const { startRow, endRow, sortModel, filterModel } = params.request;
                    const page = Math.floor((startRow ?? 0) / 50) + 1;
                    const pageSize = (endRow ?? 50) - (startRow ?? 0);

                    const searchParams = new URLSearchParams();
                    searchParams.set('page', String(page));
                    searchParams.set('pageSize', String(pageSize));
                    if (searchTerm) searchParams.set('search', searchTerm);
                    if (sortModel && sortModel.length > 0) {
                        searchParams.set('sortField', sortModel[0].colId);
                        searchParams.set('sortOrder', sortModel[0].sort as string);
                    }
                    if (filterModel && Object.keys(filterModel).length > 0) {
                        searchParams.set('filters', JSON.stringify(filterModel));
                    }

                    console.log('ProductionPlanning: fetching from', `/production-orders?${searchParams.toString()}`);
                    const response = await apiClient.get<any>(
                        `/production-orders?${searchParams.toString()}`,
                    );

                    console.log('ProductionPlanning: data received', response.data?.length, 'rows');

                    params.success({
                        rowData: response.data?.rows ?? response.data ?? [],
                        rowCount: response.data?.lastRow ?? response.meta?.total ?? -1,
                    });
                } catch (error) {
                    console.error('ProductionPlanning grid error:', error);
                    params.fail();
                }
            },
        };
    }, [searchTerm]);

    const onGridReady = useCallback(
        (event: GridReadyEvent) => {
            console.debug('ProductionGrid: onGridReady called', {
                rowCount: event.api.getDisplayedRowCount(),
            });
            setGridApi(event.api);
            event.api.setGridOption('serverSideDatasource', createDatasource());
        },
        [createDatasource],
    );

    useEffect(() => {
        if (gridApi) {
            gridApi.setGridOption('serverSideDatasource', createDatasource());
        }
    }, [searchTerm, gridApi, createDatasource]);

    const onRowDoubleClicked = useCallback((event: any) => {
        if (event.data?.id) {
            setSelectedId(event.data.id);
            setSheetOpen(true);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSheetSubmit = useCallback(
        async (formData: Record<string, any>) => {
            if (!selectedId) return;
            try {
                await updateMutation.mutateAsync({ id: selectedId, data: formData });
                toast({ title: 'Ba\u015far\u0131l\u0131', description: '\u00dcretim emri ba\u015far\u0131yla g\u00fcncellendi.' });
                setSheetOpen(false);
                gridApi?.refreshServerSide({ purge: false });
                refetch();
            } catch (error: any) {
                toast({
                    title: 'Hata',
                    description: error.message || 'G\u00fcncelleme s\u0131ras\u0131nda bir hata olu\u015ftu.',
                    variant: 'destructive',
                });
            }
        },
        [selectedId, updateMutation, toast, gridApi, refetch],
    );

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
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">\u00dcretim</p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">\u00dcretim Planlama</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold"
                            onClick={() => {
                                refetch();
                                gridApi?.refreshServerSide({ purge: true });
                            }}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            D\u0131\u015fa Aktar
                        </Button>
                        <Button className="bg-lightning-blue hover:bg-lightning-blue-dark text-white h-[32px] px-4 font-bold rounded shadow-sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Yeni \u00dcretim Emri
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard
                        label="PLANLANAN"
                        value={byStatus?.PLANNED ?? 0}
                        icon={<Clock className="w-4 h-4 text-blue-500" />}
                    />
                    <MetricCard
                        label="DEVAM EDEN"
                        value={byStatus?.IN_PROGRESS ?? 0}
                        icon={<Database className="w-4 h-4 text-amber-500" />}
                    />
                    <MetricCard
                        label="TAMAMLANAN"
                        value={byStatus?.COMPLETED ?? 0}
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    />
                    <MetricCard
                        label="\u0130PTAL ED\u0130LEN"
                        value={byStatus?.CANCELLED ?? 0}
                        icon={<XCircle className="w-4 h-4 text-rose-500" />}
                    />
                    <MetricCard
                        label="GECIKMIŞ"
                        value={summary?.overdueCount ?? 0}
                        icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                        warning={(summary?.overdueCount ?? 0) > 0}
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
                                    placeholder="Liste i\u00e7erisinde ara..."
                                    className="pl-9 h-8 border-lightning-border focus:ring-lightning-blue shadow-none rounded-sm bg-white text-sm"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                                \u00dcretim Emirleri
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

                    {/* Grid */}
                    <div className="flex-1 overflow-hidden" style={{ height: '500px', width: '100%' }}>
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
                                rowHeight={42}
                                headerHeight={32}
                                rowModelType="serverSide"
                                cacheBlockSize={50}
                                onGridReady={onGridReady}
                                onRowDoubleClicked={onRowDoubleClicked}
                                animateRows={true}
                                rowSelection={{ mode: 'singleRow', checkboxes: false }}
                                overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Kayıt bulunamadı</span>'
                            />
                        </div>
                    </div>
                </div>

                {/* Edit Sheet */}
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
                                            {isLoadingDetail ? 'Y\u00fckleniyor...' : detail?.orderNumber || '\u00dcretim Emri D\u00fczenle'}
                                        </SheetTitle>
                                        {detail?.status && (
                                            <Badge className={`text-white ${STATUS_MAP[detail.status]?.className ?? 'bg-gray-400'}`}>
                                                {STATUS_MAP[detail.status]?.label ?? detail.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <SheetDescription className="text-slate-400 font-medium">
                                        {detail ? (detail.product?.name ?? 'Se\u00e7ili \u00fcretim emrini d\u00fczenleyin') : 'Se\u00e7ili \u00fcretim emrinin detaylar\u0131n\u0131 g\u00fcncelleyin.'}
                                    </SheetDescription>
                                </SheetHeader>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
                        </div>

                        <ScrollArea className="flex-1 px-8 py-8 bg-white">
                            {isLoadingDetail ? (
                                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-slate-500 font-medium animate-pulse">\u00dcretim emri verileri getiriliyor...</p>
                                </div>
                            ) : detailError ? (
                                <div className="text-center py-24 space-y-4">
                                    <p className="text-rose-500 font-bold">Veri Y\u00fckleme Hatas\u0131</p>
                                    <p className="text-slate-500 text-sm">{(detailError as any).message}</p>
                                </div>
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
                                <div className="text-center py-24">
                                    <p className="text-slate-400 italic">\u00dcretim emri bulunamad\u0131 veya ID ge\u00e7ersiz.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, trend, positive, warning, danger }: any) {
    return (
        <div className="bg-white p-4 border border-lightning-border rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="flex items-end justify-between">
                <h3 className={`text-2xl font-bold ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : 'text-slate-800'}`}>
                    {value}
                </h3>
            </div>
            {trend && (
                <p className={`text-[11px] mt-2 font-medium ${positive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {trend}
                </p>
            )}
        </div>
    );
}
