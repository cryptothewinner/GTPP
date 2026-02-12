'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
    ColDef,
    GridReadyEvent,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    RowClickedEvent,
    GridApi,
} from 'ag-grid-enterprise';
import { ModuleRegistry, AllEnterpriseModule } from 'ag-grid-enterprise';
import { apiClient } from '@/lib/api-client';
import { StockEditSheet } from './stock-edit-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, TrendingUp, Filter } from 'lucide-react';

ModuleRegistry.registerModules([AllEnterpriseModule]);

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
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Column Definitions
    const columnDefs = useMemo<ColDef<StockRow>[]>(
        () => [
            {
                field: 'stockCode',
                headerName: 'Stok Kodu',
                width: 140,
                filter: 'agTextColumnFilter',
                pinned: 'left',
                cellClass: 'font-mono font-bold text-primary',
            },
            {
                field: 'stockName',
                headerName: 'Stok Adı',
                minWidth: 250,
                flex: 1,
                filter: 'agTextColumnFilter',
                cellClass: 'font-medium text-slate-700',
            },
            {
                field: 'currentStock',
                headerName: 'Mevcut Stok',
                width: 130,
                filter: 'agNumberColumnFilter',
                cellRenderer: (params: any) => {
                    const val = params.value ?? 0;
                    const color = val <= 10 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50';
                    return (
                        <div className={`px-2 py-0.5 rounded-full text-center font-bold ${color}`}>
                            {val.toLocaleString()}
                        </div>
                    );
                }
            },
            {
                field: 'salePrice',
                headerName: 'Satış Fiyatı',
                width: 140,
                filter: 'agNumberColumnFilter',
                valueFormatter: (params) => {
                    if (params.value == null) return '';
                    return `${params.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
                }
            },
            {
                field: 'isActive',
                headerName: 'Durum',
                width: 110,
                cellRenderer: (params: any) => (
                    <Badge variant={params.value ? "default" : "secondary"}>
                        {params.value ? "Aktif" : "Pasif"}
                    </Badge>
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
                    const { startRow, endRow, sortModel, filterModel } = params.request;

                    const response = await apiClient.post<any>('/stocks/grid', {
                        startRow: startRow ?? 0,
                        endRow: endRow ?? 100,
                        sortModel: sortModel?.map(s => ({ colId: s.colId, sort: s.sort as 'asc' | 'desc' })) ?? [],
                        filterModel: filterModel as any,
                        searchText: searchTerm
                    });

                    params.success({
                        rowData: response.rows,
                        rowCount: response.lastRow,
                    });
                } catch (error) {
                    console.error('StockDataGrid error:', error);
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
        // Grid will refresh via useMemo or explicit API call
    };

    useMemo(() => {
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
        <div className="flex flex-col h-full space-y-4">
            {/* Search & Filters */}
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Ürün adı, kod veya barkod ile ara..."
                        className="pl-10 h-10 border-slate-200 focus:ring-primary shadow-none rounded-xl"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200">
                        <Filter className="w-4 h-4 mr-2" />
                        Gelişmiş Filtre
                    </Button>
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 bg-white rounded-2xl border shadow-xl shadow-slate-200/50 overflow-hidden ag-theme-quartz">
                <AgGridReact
                    columnDefs={columnDefs}
                    defaultColDef={{
                        sortable: true,
                        resizable: true,
                        filter: true,
                        floatingFilter: true,
                        flex: 0,
                    }}
                    rowModelType="serverSide"
                    cacheBlockSize={50}
                    onGridReady={onGridReady}
                    onRowDoubleClicked={onRowDoubleClicked}
                    animateRows={true}
                    rowSelection={{ mode: 'singleRow', checkboxes: false }}
                    overlayLoadingTemplate='<span class="ag-overlay-loading-center">Ürünler yükleniyor...</span>'
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
    );
}
