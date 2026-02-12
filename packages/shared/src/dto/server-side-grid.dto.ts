/**
 * AG Grid Server-Side Row Model request/response contract.
 */
export interface ServerSideGridRequest {
    startRow: number;
    endRow: number;
    sortModel?: SortModelItem[];
    filterModel?: Record<string, FilterModelItem>;
    searchText?: string;
}

export interface SortModelItem {
    colId: string;
    sort: 'asc' | 'desc';
}

export interface FilterModelItem {
    filterType: 'text' | 'number' | 'set' | 'date';
    type?: string; // 'contains', 'equals', 'startsWith', etc.
    filter?: string | number;
    filterTo?: string | number;
    values?: string[];
}

export interface ServerSideGridResponse<T> {
    rows: T[];
    lastRow: number; // Total count for AG Grid to know when to stop
}
