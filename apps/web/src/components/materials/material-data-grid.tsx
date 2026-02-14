'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus, FileSpreadsheet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MaterialDetail } from '@/hooks/use-materials';

export function MaterialDataGrid() {
    const router = useRouter();
    const gridRef = useRef<AgGridReact>(null);
    const getRowId = useCallback((params: GetRowIdParams<MaterialDetail>) => params.data.id, []);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Column Definitions
    const columnDefs = useMemo<ColDef<MaterialDetail>[]>(
        () => [
            {
                field: 'code',
                headerName: 'MALZEME KODU',
                width: 160,
                filter: 'agTextColumnFilter',
                pinned: 'left',
                cellClass: 'font-semibold text-lightning-blue border-r border-lightning-border cursor-pointer hover:underline',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                onCellClicked: (params) => {
                    if (params.data?.id) {
                        router.push(`/materials/${params.data.id}`);
                    }
                }
            },
            {
                field: 'name',
                headerName: 'MALZEME ADI',
                minWidth: 250,
                flex: 1,
                filter: 'agTextColumnFilter',
                cellClass: 'text-slate-700 font-medium',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                field: 'type',
                headerName: 'TÜR',
                width: 140,
                filter: 'agSetColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const typeLabels: Record<string, string> = {
                        RAW_MATERIAL: 'Hammadde',
                        PACKAGING: 'Ambalaj',
                        SEMI_FINISHED: 'Yarı Mamul',
                        FINISHED_PRODUCT: 'Bitmiş Ürün',
                        TRADING_GOOD: 'Ticari Mal',
                    };
                    const typeColors: Record<string, string> = {
                        RAW_MATERIAL: 'bg-blue-100 text-blue-700',
                        PACKAGING: 'bg-indigo-100 text-indigo-700',
                        SEMI_FINISHED: 'bg-amber-100 text-amber-700',
                        FINISHED_PRODUCT: 'bg-emerald-100 text-emerald-700',
                    };
                    const label = typeLabels[params.value] || params.value;
                    const color = typeColors[params.value] || 'bg-slate-100 text-slate-700';
                    return (
                        <div className="flex items-center h-full">
                            <span className={`text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-sm ${color}`}>
                                {label}
                            </span>
                        </div>
                    );
                }
            },
            {
                field: 'unitOfMeasure',
                headerName: 'BİRİM',
                width: 100,
                filter: false,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-slate-600',
            },
            {
                field: 'currentStock',
                headerName: 'MEVCUT STOK',
                width: 130,
                filter: 'agNumberColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'font-medium text-right text-slate-700',
            },
            {
                field: 'minStockLevel',
                headerName: 'MİN. STOK',
                width: 130,
                filter: 'agNumberColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-right text-slate-500',
            },
            {
                field: 'isActive',
                headerName: 'DURUM',
                width: 120,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => (
                    <div className="flex items-center h-full">
                        <Badge className={`rounded-sm text-[10px] font-bold uppercase tracking-tight py-0 px-2 shadow-none border-none ${params.value ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            {params.value ? "AKTIF" : "PASIF"}
                        </Badge>
                    </div>
                ),
            }
        ],
        [router],
    );

    // Server-Side Datasource
    const createDatasource = useCallback((): IServerSideDatasource => {
        return {
            getRows: async (params: IServerSideGetRowsParams) => {
                try {
                    const { startRow, endRow, sortModel, filterModel } = params.request;
                    const pageSize = (endRow ?? 100) - (startRow ?? 0);
                    const page = Math.floor((startRow ?? 0) / pageSize) + 1;

                    // Map AG Grid Sort to API Sort
                    let sortField: string | undefined;
                    let sortOrder: 'asc' | 'desc' | undefined;
                    if (sortModel && sortModel.length > 0) {
                        sortField = sortModel[0].colId;
                        sortOrder = sortModel[0].sort;
                    }

                    // Map AG Grid Filters to API Filters
                    // API expects JSON stringified filters
                    const filters = filterModel;

                    const sp = new URLSearchParams();
                    sp.set('page', String(page));
                    sp.set('pageSize', String(pageSize));
                    if (sortField) sp.set('sortField', sortField);
                    if (sortOrder) sp.set('sortOrder', sortOrder);
                    if (searchTerm) sp.set('search', searchTerm);
                    if (filters && Object.keys(filters).length > 0) {
                        sp.set('filters', JSON.stringify(filters));
                    }

                    const response = await apiClient.get<any>(`/materials?${sp.toString()}`);

                    params.success({
                        rowData: response.data ?? [],
                        rowCount: response.meta?.total ?? 0,
                    });
                } catch (error) {
                    console.error('MaterialDataGrid error:', error);
                    params.fail();
                }
            },
        };
    }, [searchTerm]);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        setGridApi(params.api);
        params.api.setGridOption('serverSideDatasource', createDatasource());
    }, [createDatasource]);

    // Handle Search Input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    useEffect(() => {
        if (gridApi) {
            gridApi.setGridOption('serverSideDatasource', createDatasource());
        }
    }, [searchTerm, gridApi, createDatasource]);

    const onRowDoubleClicked = useCallback((event: any) => {
        if (event.data?.id) {
            router.push(`/materials/${event.data.id}`);
        }
    }, [router]);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-lightning-border overflow-hidden shadow-sm">
            {/* Search & Utility Bar */}
            <div className="flex items-center justify-between gap-4 bg-[#f9fafb] px-4 py-3 border-b border-lightning-border">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Malzeme kodu veya adı ile ara..."
                            className="pl-9 h-8 border-lightning-border focus:ring-lightning-blue shadow-none rounded-sm bg-white text-sm"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-sm border-lightning-border bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold px-3">
                        <Filter className="w-3.5 h-3.5 mr-2" />
                        Filtreler
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 rounded-sm border-lightning-border bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold px-3">
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
                        Excel
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 rounded-sm bg-lightning-blue hover:bg-blue-600 text-white text-xs font-bold px-4"
                        onClick={() => router.push('/materials/new')}
                    >
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        Yeni Malzeme
                    </Button>
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 w-full" style={{ minHeight: '500px' }}>
                <AgGridReact
                    className="ag-theme-quartz"
                    theme={themeQuartz}
                    ref={gridRef}
                    getRowId={getRowId}
                    columnDefs={columnDefs}
                    defaultColDef={{
                        sortable: true,
                        resizable: true,
                        filter: true,
                        floatingFilter: false,
                        flex: 1,
                    }}
                    rowModelType="serverSide"
                    cacheBlockSize={50}
                    maxBlocksInCache={5}
                    rowHeight={42}
                    headerHeight={32}
                    pagination={true}
                    paginationPageSize={50}
                    onGridReady={onGridReady}
                    onRowDoubleClicked={onRowDoubleClicked}
                    animateRows={true}
                    rowSelection={{ mode: 'singleRow', checkboxes: false }}
                    overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                    overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Malzeme bulunamadı</span>'
                />
            </div>
        </div>
    );
}
