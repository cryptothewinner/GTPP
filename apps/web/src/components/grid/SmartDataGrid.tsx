'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type {
    ColDef,
    GridReadyEvent,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    RowClickedEvent,
    GridApi,
} from 'ag-grid-enterprise';
import { apiClient } from '@/lib/api-client';
import type { ServerSideRequest, ServerSideResponse, FieldMetadata } from '@sepenatural/shared';


// ---- Type Mapping: Metadata -> AG Grid ColDef ----
function fieldToColDef(field: FieldMetadata): ColDef {
    const colDef: ColDef = {
        field: field.key, // Metadata uses .key, old FieldSchema used .name
        headerName: field.label,
        sortable: true,
        resizable: true,
        hide: field.type === 'readonly', // Map readonly to hide if needed or use visible
        tooltipField: field.key,
    };

    // Type-specific configurations
    switch (field.type) {
        case 'number':
        case 'currency':
            colDef.filter = 'agNumberColumnFilter';
            colDef.type = 'numericColumn';
            colDef.valueFormatter = (params) => {
                if (params.value == null) return '';
                return typeof params.value === 'number'
                    ? params.value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : String(params.value);
            };
            break;
        case 'boolean':
            colDef.filter = 'agSetColumnFilter';
            colDef.cellRenderer = (params: any) => {
                if (params.value == null) return '';
                return params.value ? '✅ Aktif' : '❌ Pasif';
            };
            colDef.filterParams = {
                values: ['true', 'false'],
                cellRenderer: (params: any) => (params.value === 'true' ? 'Aktif' : 'Pasif'),
            };
            break;
        case 'select':
            colDef.filter = 'agSetColumnFilter';
            if (field.options) {
                colDef.filterParams = {
                    values: field.options.map((o) => String(o.value)),
                    cellRenderer: (params: any) => {
                        const opt = field.options?.find((o) => String(o.value) === String(params.value));
                        return opt?.label || params.value;
                    },
                };
            }
            break;
        case 'date':
        case 'datetime':
            colDef.filter = 'agDateColumnFilter';
            colDef.valueFormatter = (params) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleDateString('tr-TR');
            };
            break;
        default:
            colDef.filter = 'agTextColumnFilter';
            break;
    }

    return colDef;
}

// ---- Component Props ----
interface SmartDataGridProps<T = any> {
    /** API endpoint for the server-side data source (POST) */
    apiEndpoint: string;
    /** Column definitions. If not provided, uses metadata fields. */
    columnDefs?: ColDef[];
    /** Metadata field definitions (alternative to columnDefs) */
    fieldDefinitions?: FieldMetadata[];
    /** Rows per page */
    pageSize?: number;
    /** Callback when a row is clicked */
    onRowClicked?: (data: T) => void;
    /** Callback when row is double-clicked */
    onRowDoubleClicked?: (data: T) => void;
    /** Global search text */
    searchText?: string;
    /** Additional class names */
    className?: string;
    /** Grid height */
    height?: string | number;
    /** Row selection mode */
    rowSelection?: 'single' | 'multiple';
    /** Custom status bar */
    statusBar?: any;
}

export function SmartDataGrid<T = any>({
    apiEndpoint,
    columnDefs: externalColDefs,
    fieldDefinitions,
    pageSize = 100,
    onRowClicked,
    onRowDoubleClicked,
    searchText,
    className = '',
    height = '100%',
    rowSelection = 'single',
}: SmartDataGridProps<T>) {
    const gridRef = useRef<AgGridReact>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);

    // Build column defs from metadata if not provided externally
    const columnDefs = useMemo(() => {
        if (externalColDefs) return externalColDefs;
        if (fieldDefinitions) {
            return fieldDefinitions
                .filter((f) => f.visible !== false)
                .map(fieldToColDef);
        }
        return [];
    }, [externalColDefs, fieldDefinitions]);

    // Server-Side Datasource
    const createDatasource = useCallback((): IServerSideDatasource => {
        return {
            getRows: async (params: IServerSideGetRowsParams) => {
                const { startRow, endRow, sortModel, filterModel, groupKeys, rowGroupCols, valueCols, pivotCols, pivotMode } = params.request;

                try {
                    const request: ServerSideRequest = {
                        startRow: startRow ?? 0,
                        endRow: endRow ?? pageSize,
                        sortModel: sortModel?.map((s) => ({
                            colId: s.colId,
                            sort: s.sort as 'asc' | 'desc',
                        })) ?? [],
                        filterModel: filterModel as any,
                        groupKeys: groupKeys ?? [],
                        rowGroupCols: (rowGroupCols as any) ?? [],
                        valueCols: (valueCols as any) ?? [],
                        pivotCols: (pivotCols as any) ?? [],
                        pivotMode: pivotMode ?? false,
                    };

                    const response = await apiClient.post<ServerSideResponse<T>>(
                        apiEndpoint,
                        request,
                    );
                    const responseData = (response as any)?.data;

                    params.success({
                        rowData: responseData?.rows ?? [],
                        rowCount: responseData?.lastRow ?? 0,
                    });
                } catch (error) {
                    console.error('SmartDataGrid: Failed to fetch rows', error);
                    params.fail();
                }
            },
        };
    }, [apiEndpoint, pageSize, searchText]);

    // Grid Ready
    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            setGridApi(params.api);
            console.debug('SmartGrid: onGridReady called', {
                rowCount: params.api.getDisplayedRowCount(),
            });
            params.api.setGridOption('serverSideDatasource', createDatasource());
        },
        [createDatasource],
    );

    // Refresh datasource when searchText changes
    useMemo(() => {
        if (gridApi) {
            gridApi.setGridOption('serverSideDatasource', createDatasource());
        }
    }, [searchText, gridApi, createDatasource]);

    // Row click handlers
    const handleRowClicked = useCallback(
        (event: RowClickedEvent) => {
            if (onRowClicked && event.data) {
                onRowClicked(event.data);
            }
        },
        [onRowClicked],
    );

    const handleRowDoubleClicked = useCallback(
        (event: any) => {
            if (onRowDoubleClicked && event.data) {
                onRowDoubleClicked(event.data);
            }
        },
        [onRowDoubleClicked],
    );

    // Default col def
    const defaultColDef = useMemo<ColDef>(
        () => ({
            sortable: true,
            resizable: true,
            filter: true,
            floatingFilter: true,
            minWidth: 80,
        }),
        [],
    );

    // Status bar
    const statusBarConfig = useMemo(
        () => ({
            statusPanels: [
                { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
                { statusPanel: 'agSelectedRowCountComponent', align: 'center' },
                { statusPanel: 'agAggregationComponent', align: 'right' },
            ],
        }),
        [],
    );

    return (
        <div
            className={className}
            style={{ height, width: '100%' }}
        >
            <div style={{ height: '100%', width: '100%' }}>
                <AgGridReact
                    theme={themeQuartz}
                    ref={gridRef}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowModelType="serverSide"
                    cacheBlockSize={pageSize}
                    maxBlocksInCache={10}
                    onGridReady={onGridReady}
                    onRowClicked={handleRowClicked}
                    onRowDoubleClicked={handleRowDoubleClicked}
                    rowSelection={rowSelection}
                    animateRows={true}
                    enableCellTextSelection={true}
                    statusBar={statusBarConfig}
                    tooltipShowDelay={500}
                    overlayLoadingTemplate='<span class="ag-overlay-loading-center">Veriler yükleniyor...</span>'
                    overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Kayıt bulunamadı</span>'
                    localeText={{
                        // Turkish locale overrides
                        page: 'Sayfa',
                        more: 'Daha',
                        to: '-',
                        of: '/',
                        next: 'İleri',
                        last: 'Son',
                        first: 'İlk',
                        previous: 'Geri',
                        loadingOoo: 'Yükleniyor...',
                        noRowsToShow: 'Kayıt bulunamadı',
                        filterOoo: 'Filtrele...',
                        equals: 'Eşittir',
                        notEqual: 'Eşit Değil',
                        contains: 'İçerir',
                        notContains: 'İçermez',
                        startsWith: 'İle Başlar',
                        endsWith: 'İle Biter',
                        lessThan: 'Küçüktür',
                        greaterThan: 'Büyüktür',
                        searchOoo: 'Ara...',
                        selectAll: 'Tümünü Seç',
                        blanks: 'Boş',
                        notBlank: 'Boş Değil',
                    }}
                />
            </div>
        </div>
    );
}
