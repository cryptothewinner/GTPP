'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
    Search,
    Loader2,
    Activity,
    AlertTriangle,
    Clock,
    RotateCcw,
    ArrowDownLeft,
    ArrowUpRight,
    Filter,
    XCircle,
} from 'lucide-react';
import {
    useServiceLogs,
    useServiceLogStats,
    ServiceLog,
} from '@/hooks/use-service-logs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import { ColDef } from 'ag-grid-community';
import { ServiceLogDetailSheet } from './service-log-detail-sheet';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    SUCCESS: { label: 'Başarılı', className: 'bg-emerald-500 hover:bg-emerald-600' },
    FAILED: { label: 'Hatalı', className: 'bg-rose-500 hover:bg-rose-600' },
    PENDING_RETRY: {
        label: 'Bekliyor',
        className: 'bg-amber-500 hover:bg-amber-600',
    },
    RETRIED: {
        label: 'Yeniden Denendi',
        className: 'bg-blue-500 hover:bg-blue-600',
    },
    ARCHIVED: {
        label: 'Arşivlendi',
        className: 'bg-slate-400 hover:bg-slate-500',
    },
};

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    POST: 'text-blue-700 bg-blue-50 border-blue-200',
    PUT: 'text-amber-700 bg-amber-50 border-amber-200',
    PATCH: 'text-orange-700 bg-orange-50 border-orange-200',
    DELETE: 'text-rose-700 bg-rose-50 border-rose-200',
};

type FilterPreset = 'all' | 'failed' | 'outbound' | 'slow';

export default function MonitoringPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [activePreset, setActivePreset] = useState<FilterPreset>('all');
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [directionFilter, setDirectionFilter] = useState<string | undefined>();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filtre preset'leri
    const queryParams = useMemo(() => {
        const params: Record<string, unknown> = {
            page,
            pageSize: 100,
            search: search || undefined,
            sortField: 'createdAt',
            sortOrder: 'desc' as const,
        };

        switch (activePreset) {
            case 'failed':
                params.status = 'FAILED';
                break;
            case 'outbound':
                params.direction = 'OUTBOUND';
                break;
            case 'slow':
                params.sortField = 'durationMs';
                break;
        }

        if (statusFilter) params.status = statusFilter;
        if (directionFilter) params.direction = directionFilter;

        return params;
    }, [page, search, activePreset, statusFilter, directionFilter]);

    const { data: logsResponse, isLoading } = useServiceLogs(queryParams);
    const { data: statsResponse } = useServiceLogStats();

    const logs = useMemo(() => {
        if (!logsResponse) return [];
        const d = (logsResponse as any).data;
        return Array.isArray(d) ? d : [];
    }, [logsResponse]);

    const stats = useMemo(() => {
        if (!statsResponse) return null;
        return 'data' in (statsResponse as any)
            ? (statsResponse as any).data
            : statsResponse;
    }, [statsResponse]);

    const colDefs = useMemo<ColDef<ServiceLog>[]>(
        () => [
            {
                field: 'status',
                headerName: 'Durum',
                width: 120,
                cellRenderer: (params: any) => {
                    const status = params.value as string;
                    const config = STATUS_CONFIG[status] || {
                        label: status,
                        className: 'bg-slate-500',
                    };
                    return (
                        <Badge className={`border-none text-white ${config.className}`}>
                            {config.label}
                        </Badge>
                    );
                },
            },
            {
                field: 'direction',
                headerName: 'Yön',
                width: 80,
                cellRenderer: (params: any) =>
                    params.value === 'INBOUND' ? (
                        <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                    ) : (
                        <ArrowUpRight className="w-4 h-4 text-orange-500" />
                    ),
            },
            {
                field: 'method',
                headerName: 'Metot',
                width: 90,
                cellRenderer: (params: any) => {
                    const method = params.value as string;
                    return (
                        <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${METHOD_COLORS[method] || 'text-slate-600 bg-slate-50'}`}
                        >
                            {method}
                        </span>
                    );
                },
            },
            {
                field: 'endpoint',
                headerName: 'URL',
                flex: 2,
                minWidth: 250,
                filter: 'agTextColumnFilter',
                cellClass: 'font-mono text-xs text-slate-700',
            },
            {
                field: 'statusCode',
                headerName: 'Kod',
                width: 80,
                type: 'rightAligned',
                cellStyle: (params: any) => {
                    const code = params.value as number;
                    if (code >= 500) return { color: '#e11d48', fontWeight: 700 };
                    if (code >= 400) return { color: '#d97706', fontWeight: 700 };
                    return { color: '#059669', fontWeight: 500 };
                },
            },
            {
                field: 'durationMs',
                headerName: 'Süre',
                width: 100,
                type: 'rightAligned',
                valueFormatter: (params) => `${params.value} ms`,
                cellStyle: (params: any) => {
                    if (params.value > 1000)
                        return { color: '#e11d48', fontWeight: 700 };
                    if (params.value > 500) return { color: '#d97706', fontWeight: 500 };
                    return { color: '#334155', fontWeight: 400 };
                },
            },
            {
                field: 'createdAt',
                headerName: 'Tarih',
                width: 160,
                valueFormatter: (params) =>
                    params.value
                        ? new Date(params.value).toLocaleString('tr-TR')
                        : '-',
            },
            {
                field: 'errorMessage',
                headerName: 'Hata',
                flex: 1,
                minWidth: 150,
                cellClass: 'text-xs text-rose-600',
                valueFormatter: (params) => params.value || '-',
            },
        ],
        [],
    );

    const onRowDoubleClicked = useCallback((event: any) => {
        if (event.data?.id) {
            setSelectedId(event.data.id);
            setSheetOpen(true);
        }
    }, []);

    const clearFilters = () => {
        setActivePreset('all');
        setStatusFilter(undefined);
        setDirectionFilter(undefined);
        setSearch('');
    };

    const hasActiveFilter =
        activePreset !== 'all' || statusFilter || directionFilter || search;

    return (
        <div className="h-full flex flex-col space-y-4 p-4 md:p-6 max-w-[1800px] mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sistem
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Servis Takip Paneli
                </h2>
                <p className="text-muted-foreground text-sm">
                    Gelen ve giden HTTP trafiğini izleyin, hataları yönetin,
                    başarısız işlemleri yeniden deneyin.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <MetricCard
                    label="BUGÜN TOPLAM"
                    value={stats?.totalToday ?? 0}
                    icon={<Activity className="w-4 h-4 text-blue-500" />}
                />
                <MetricCard
                    label="HATALI"
                    value={stats?.failedToday ?? 0}
                    icon={<XCircle className="w-4 h-4 text-rose-500" />}
                    danger={(stats?.failedToday ?? 0) > 0}
                />
                <MetricCard
                    label="HATA ORANI"
                    value={`%${stats?.errorRateToday ?? 0}`}
                    icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                    warning={(stats?.errorRateToday ?? 0) > 5}
                />
                <MetricCard
                    label="SON 1 SAAT"
                    value={stats?.totalLastHour ?? 0}
                    icon={<Clock className="w-4 h-4 text-slate-500" />}
                />
                <MetricCard
                    label="SON 1 SAAT HATA"
                    value={stats?.failedLastHour ?? 0}
                    icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                    danger={(stats?.failedLastHour ?? 0) > 0}
                />
                <MetricCard
                    label="ORT. SÜRE"
                    value={`${stats?.avgDurationMs ?? 0} ms`}
                    icon={<Clock className="w-4 h-4 text-blue-500" />}
                />
                <MetricCard
                    label="BEKLEYEN RETRY"
                    value={stats?.pendingRetry ?? 0}
                    icon={<RotateCcw className="w-4 h-4 text-amber-500" />}
                    warning={(stats?.pendingRetry ?? 0) > 0}
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {(
                        [
                            ['all', 'Tümü'],
                            ['failed', 'Sadece Hatalılar'],
                            ['outbound', 'SAP / Dış İstekler'],
                            ['slow', 'En Yavaşlar'],
                        ] as [FilterPreset, string][]
                    ).map(([preset, label]) => (
                        <Button
                            key={preset}
                            variant={activePreset === preset ? 'default' : 'ghost'}
                            size="sm"
                            className={`text-xs h-7 ${activePreset === preset ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                            onClick={() => {
                                setActivePreset(preset);
                                setStatusFilter(undefined);
                                setDirectionFilter(undefined);
                            }}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Endpoint, hata mesajı veya trace ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {hasActiveFilter && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500"
                        onClick={clearFilters}
                    >
                        <Filter className="w-3 h-3 mr-1" />
                        Filtreleri Temizle
                    </Button>
                )}
            </div>

            {/* Data Grid */}
            <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {mounted ? (
                    <div style={{ height: '600px', width: '100%' }}>
                        <AgGridReact
                            theme={themeQuartz}
                            columnDefs={colDefs}
                            rowData={logs}
                            pagination={true}
                            paginationPageSize={25}
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
                            overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Henüz log kaydı yok</span>'
                            getRowStyle={(params) => {
                                if (params.data?.status === 'FAILED') {
                                    return { backgroundColor: '#fef2f2' };
                                }
                                return undefined;
                            }}
                        />
                    </div>
                ) : (
                    <div
                        style={{ height: '600px' }}
                        className="flex items-center justify-center"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                )}
            </div>

            {/* Detail Sheet */}
            <ServiceLogDetailSheet
                logId={selectedId}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
        </div>
    );
}

function MetricCard({
    label,
    value,
    icon,
    warning,
    danger,
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    warning?: boolean;
    danger?: boolean;
}) {
    return (
        <Card className="shadow-sm hover:shadow border-slate-200">
            <CardContent className="p-3">
                <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {label}
                    </span>
                    {icon}
                </div>
                <div
                    className={`text-xl font-bold ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : 'text-slate-900'}`}
                >
                    {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
                </div>
            </CardContent>
        </Card>
    );
}
