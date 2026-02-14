'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, GridApi, GetRowIdParams } from 'ag-grid-community';
import { apiClient } from '@/lib/api-client';
import { useRecipeSummary } from '@/hooks/use-recipes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    BookOpen,
    CheckCircle,
    DollarSign,
    FlaskConical,
    Filter,
    Loader2,
    Plus,
    RefreshCw,
    Search,
} from 'lucide-react';
import { RecipeDetailSheet } from './recipe-detail-sheet';
import { CreateRecipeSheet } from './create-recipe-sheet';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecipeRow {
    id: string;
    code: string;
    name: string;
    product?: { name: string; code: string };
    version: string;
    batchSize: number;
    batchUnit: string;
    totalCost: number;
    currency: string;
    isActive: boolean;
    approvedBy?: string;
    approvedAt?: string;
    items?: { id: string }[];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductionRecipesPage() {
    /* ---------- summary ---------- */
    const {
        data: summaryResult,
        refetch: refetchSummary,
        isFetching: isFetchingSummary,
    } = useRecipeSummary();
    const summary = (summaryResult as any)?.data ?? summaryResult;

    /* ---------- grid state ---------- */
    const gridRef = useRef<AgGridReact>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowData, setRowData] = useState<RecipeRow[]>([]);
    const [isLoadingGrid, setIsLoadingGrid] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    /* ---------- sheet state ---------- */
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const getRowId = useCallback(
        (params: GetRowIdParams<RecipeRow>) => params.data.id,
        [],
    );

    /* ---------- computed metrics ---------- */
    const recipesWithItems = useMemo(
        () => rowData.filter(r => (r.items?.length ?? 0) > 0).length,
        [rowData],
    );

    /* ---------- data fetch ---------- */
    const fetchRecipes = useCallback(async () => {
        try {
            setIsLoadingGrid(true);
            const sp = new URLSearchParams();
            sp.set('page', '1');
            sp.set('pageSize', '500');
            if (searchTerm) sp.set('search', searchTerm);

            const response = await apiClient.get<any>(`/recipes?${sp.toString()}`);
            const recipes = response.data ?? [];
            setRowData(recipes);
        } catch (error) {
            console.error('RecipesGrid error:', error);
        } finally {
            setIsLoadingGrid(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const handleRefresh = useCallback(() => {
        refetchSummary();
        fetchRecipes();
    }, [refetchSummary, fetchRecipes]);

    const onGridReady = useCallback((event: GridReadyEvent) => {
        setGridApi(event.api);
    }, []);

    const onRowClicked = useCallback((event: any) => {
        if (event.data?.id) {
            setSelectedId(event.data.id);
            setDetailOpen(true);
        }
    }, []);

    /* ---------- columns ---------- */
    const columnDefs = useMemo<ColDef<RecipeRow>[]>(
        () => [
            {
                field: 'code',
                headerName: 'REÇETE KODU',
                width: 140,
                pinned: 'left',
                filter: 'agTextColumnFilter',
                cellClass: 'font-semibold text-lightning-blue border-r border-lightning-border',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                field: 'name',
                headerName: 'REÇETE ADI',
                flex: 1,
                minWidth: 250,
                filter: 'agTextColumnFilter',
                cellClass: 'text-slate-700 font-medium',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                headerName: 'ÜRÜN',
                width: 200,
                filter: 'agTextColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueGetter: (params: any) => params.data?.product?.name ?? '-',
                cellRenderer: (params: any) => {
                    const name = params.data?.product?.name;
                    if (!name) return <span className="text-slate-400">-</span>;
                    return (
                        <div className="flex items-center h-full">
                            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-slate-300 text-slate-600 bg-slate-50 rounded-sm">
                                {name}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                field: 'version',
                headerName: 'VERSİYON',
                width: 90,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-center text-slate-600',
                valueFormatter: (params) => params.value ? `v${params.value}` : '-',
            },
            {
                headerName: 'PARTİ BÜYÜKLÜĞܒ',
                width: 140,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-slate-700',
                valueGetter: (params: any) => {
                    const size = params.data?.batchSize;
                    const unit = params.data?.batchUnit;
                    if (!size) return '-';
                    return `${Number(size).toLocaleString('tr-TR')} ${unit ?? ''}`.trim();
                },
            },
            {
                field: 'totalCost',
                headerName: 'TOPLAM MALİYET',
                width: 150,
                filter: 'agNumberColumnFilter',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-right font-bold text-slate-800',
                valueFormatter: (params) => {
                    if (params.value == null) return '-';
                    return `₺${Number(params.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
                },
            },
            {
                headerName: 'MALZEME',
                width: 100,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const count = params.data?.items?.length ?? 0;
                    if (count === 0) return <span className="text-slate-400">-</span>;
                    return (
                        <div className="flex items-center h-full">
                            <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] font-bold px-2 py-0 h-5 rounded-sm">
                                {count}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                field: 'isActive',
                headerName: 'DURUM',
                width: 100,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => (
                    <div className="flex items-center h-full">
                        <Badge
                            className={`rounded-sm text-[10px] font-bold uppercase tracking-tight py-0 px-2 shadow-none border-none ${params.value ? 'bg-emerald-500' : 'bg-slate-300 text-slate-600'}`}
                        >
                            {params.value ? 'AKTİF' : 'PASİF'}
                        </Badge>
                    </div>
                ),
            },
            {
                headerName: 'ONAY',
                width: 140,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => {
                    const { approvedBy, approvedAt } = params.data ?? {};
                    if (approvedBy) {
                        return (
                            <div className="flex items-center gap-1.5 h-full">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="text-xs text-slate-600 truncate">{approvedBy}</span>
                            </div>
                        );
                    }
                    return (
                        <span className="text-xs text-amber-600 font-medium">Bekliyor</span>
                    );
                },
            },
        ],
        [],
    );

    /* ------------------------------------------------------------------ */
    /*  Render                                                              */
    /* ------------------------------------------------------------------ */

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Header */}
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-[#38b2ac] rounded-md text-white shadow-sm">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Üretim
                            </p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                                Üretim Reçeteleri
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Ürün formülasyonlarını ve malzeme listelerini yönetin
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
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingSummary ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                        <Button
                            className="bg-[#38b2ac] hover:bg-[#2c9a94] text-white h-[32px] px-4 font-bold rounded shadow-sm"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Yeni Reçete
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="TOPLAM REÇETE"
                        value={summary?.totalRecipes ?? rowData.length}
                        icon={<BookOpen className="w-4 h-4 text-blue-500" />}
                    />
                    <MetricCard
                        label="AKTİF REÇETE"
                        value={summary?.activeRecipes ?? rowData.filter(r => r.isActive).length}
                        icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                    />
                    <MetricCard
                        label="ORT. MALİYET"
                        value={
                            summary?.avgCost != null
                                ? `₺${Number(summary.avgCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                                : '—'
                        }
                        icon={<DollarSign className="w-4 h-4 text-amber-500" />}
                    />
                    <MetricCard
                        label="MALZEMELİ REÇETE"
                        value={recipesWithItems}
                        icon={<FlaskConical className="w-4 h-4 text-purple-500" />}
                    />
                </div>

                {/* Data Grid */}
                <div className="bg-white rounded border border-lightning-border shadow-sm flex flex-col overflow-hidden">
                    {/* Search Bar */}
                    <div className="flex items-center justify-between gap-4 bg-[#f3f3f3] px-6 py-3 border-b border-lightning-border">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder="Reçete ara..."
                                    className="pl-9 h-8 border-lightning-border focus:ring-lightning-blue shadow-none rounded-sm bg-white text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                                {isLoadingGrid ? 'Yükleniyor...' : `${rowData.length} kayıt`}
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
                                    onRowClicked={onRowClicked}
                                    animateRows={true}
                                    rowSelection={{ mode: 'singleRow', checkboxes: false }}
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

            {/* Detail Sheet */}
            <RecipeDetailSheet
                recipeId={selectedId}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onRefresh={handleRefresh}
            />

            {/* Create Sheet */}
            <CreateRecipeSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={handleRefresh}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  MetricCard                                                         */
/* ------------------------------------------------------------------ */

function MetricCard({ label, value, icon, warning, danger }: any) {
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
        </div>
    );
}
