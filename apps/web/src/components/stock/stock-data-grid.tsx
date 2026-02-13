'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type {
    ColDef,
    GridReadyEvent,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    RowClickedEvent,
    GridApi,
    GetRowIdParams,
} from 'ag-grid-enterprise';
import { apiClient } from '@/lib/api-client';
import { StockEditSheet } from './stock-edit-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, TrendingUp, Filter } from 'lucide-react';


interface StockRow {
    id: string;
    stockCode: string;
    stockName: string;
    barcode: string | null;
    unitOfMeasure: string;
    isActive: boolean;
    purchasePrice: number;
    salePrice: number;
    currentStock: number;
    category: string | null;
    brand: string | null;
}

export function StockDataGrid() {
    const gridRef = useRef<AgGridReact>(null);
    const getRowId = useCallback((params: GetRowIdParams<StockRow>) => params.data.id, []);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Column Definitions
    const columnDefs = useMemo<ColDef<StockRow>[]>(
        () => [
            {
                field: 'stockCode',
                headerName: 'STOK KODU',
                width: 160,
                filter: 'agTextColumnFilter',
                pinned: 'left',
                cellClass: 'font-semibold text-lightning-blue border-r border-lightning-border',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                field: 'stockName',
                headerName: 'STOK ADI',
                minWidth: 300,
                flex: 1,
                filter: 'agTextColumnFilter',
                cellClass: 'text-slate-700 font-medium',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                field: 'currentStock',
                headerName: 'STOK MİKTARI',
                width: 150,
                filter: 'agNumberColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const val = params.value ?? 0;
                    const color = val <= 10 ? 'text-rose-600' : 'text-slate-700';
                    return (
                        <div className={`font-bold ${color}`}>
                            {val.toLocaleString()}
                        </div>
                    );
                }
            },
            {
                field: 'salePrice',
                headerName: 'SATIŞ FİYATI',
                width: 150,
                filter: 'agNumberColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => {
                    if (params.value == null) return '';
                    return `${params.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
                },
                cellClass: 'font-medium text-slate-700 text-right',
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
        [],
    );

    // Server-Side Datasource
    const createDatasource = useCallback((): IServerSideDatasource => {
        return {
            getRows: async (params: IServerSideGetRowsParams) => {
                try {
                    console.log('StockDataGrid: getRows called', params.request);
                    const { startRow, endRow, sortModel, filterModel } = params.request;

                    const response = await apiClient.post<any>('/inventory/grid', {
                        startRow: startRow ?? 0,
                        endRow: endRow ?? 100,
                        sortModel: sortModel?.map(s => ({ colId: s.colId, sort: s.sort as 'asc' | 'desc' })) ?? [],
                        filterModel: filterModel as any,
                        searchText: searchTerm
                    });

                    console.log('StockDataGrid: data received', response.data?.rows?.length, 'rows');

                    params.success({
                        rowData: response.data?.rows ?? [],
                        rowCount: response.data?.lastRow ?? 0,
                    });
                } catch (error) {
                    console.error('StockDataGrid error:', error);
                    params.fail();
                }
            },
        };
    }, [searchTerm]);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        console.log('StockDataGrid: onGridReady called');
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
            setSelectedStockId(event.data.id);
            setSheetOpen(true);
        }
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Search & Utility Bar */}
            <div className="flex items-center justify-between gap-4 bg-[#f3f3f3] px-6 py-3 border-b border-lightning-border">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Liste içerisinde ara..."
                            className="pl-9 h-8 border-lightning-border focus:ring-lightning-blue shadow-none rounded-sm bg-white text-sm"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        50+ Kayıt Gösteriliyor
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-sm border-lightning-border bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold px-3">
                        <Filter className="w-3.5 h-3.5 mr-2" />
                        Filtrele
                    </Button>
                </div>
            </div>

            {/* Grid Container */}
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

                {/* Edit Component */}
                <StockEditSheet
                    stockId={selectedStockId}
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                />
            </div>
        </div>
    );
}
