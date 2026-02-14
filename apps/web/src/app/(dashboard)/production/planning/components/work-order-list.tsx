'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import {
    ColDef,
    GridReadyEvent,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    GridApi,
    GetRowIdParams,
} from 'ag-grid-enterprise';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Play, CheckSquare, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { useProductionOrderDetail, useUpdateProductionOrder, useMaterialCheck } from '@/hooks/use-production-orders';
import { MaterialCheckDialog } from './material-check-dialog';
import { useToast } from '@/hooks/use-toast';

// --- Availability Cell Renderer ---
const AvailabilityCellRenderer = (params: any) => {
    const { data: check, isLoading } = useMaterialCheck(params.data?.id);

    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
    if (!check) return <span className="text-slate-400">-</span>;

    const status = check.isAvailable ? 'available' : 'missing';
    const color = check.isAvailable ? 'text-emerald-500' : 'text-rose-500';
    const icon = check.isAvailable ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />;

    return (
        <div className={`flex items-center gap-2 ${color} font-medium`} title={check.isAvailable ? 'Tüm malzemeler stokta' : `${check.missingItems.length} eksik malzeme`}>
            {icon}
            <span className="text-xs">{check.isAvailable ? 'Hazır' : 'Eksik'}</span>
        </div>
    );
};

// --- Actions Cell Renderer ---
const ActionsCellRenderer = (params: any) => {
    const { onAction } = params.context;
    const status = params.data?.status;

    return (
        <div className="flex items-center gap-1">
            {status === 'PLANNED' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => onAction('start', params.data)} title="Üretimi Başlat">
                    <Play className="h-3.5 w-3.5" />
                </Button>
            )}
            {status === 'IN_PROGRESS' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onAction('complete', params.data)} title="Tamamla">
                    <CheckSquare className="h-3.5 w-3.5" />
                </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onAction('reschedule', params.data)} title="Yeniden Planla">
                <CalendarClock className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Taslak', className: 'bg-slate-400' },
    PLANNED: { label: 'Planlandı', className: 'bg-blue-500' },
    IN_PROGRESS: { label: 'Devam Ediyor', className: 'bg-amber-500' },
    COMPLETED: { label: 'Tamamlandı', className: 'bg-emerald-500' },
    CANCELLED: { label: 'İptal', className: 'bg-rose-500' },
};

export function WorkOrderList({ searchTerm, onEdit }: { searchTerm: string; onEdit: (id: string) => void }) {
    const gridRef = useRef<AgGridReact>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [checkDialogOpen, setCheckDialogOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const { toast } = useToast();

    // Context for cell renderers
    const context = useMemo(() => ({
        onAction: (action: string, data: any) => {
            if (action === 'start') {
                setSelectedOrderId(data.id);
                setCheckDialogOpen(true);
            } else if (action === 'complete') {
                toast({ title: 'Bilgi', description: 'Bu özellik henüz aktif değil. (Mock)' });
            } else if (action === 'reschedule') {
                toast({ title: 'Bilgi', description: 'Takvim görünümünden planlama yapabilirsiniz.' });
            }
        }
    }), [toast]);

    const columnDefs = useMemo<ColDef[]>(() => [
        {
            field: 'orderNumber',
            headerName: 'EMİR NO',
            width: 140,
            pinned: 'left',
            cellClass: 'font-semibold text-blue-600',
            headerClass: 'text-xs font-bold text-slate-500',
        },
        {
            field: 'product.name',
            headerName: 'ÜRÜN',
            minWidth: 200,
            flex: 1,
            cellClass: 'text-slate-700 font-medium',
            headerClass: 'text-xs font-bold text-slate-500',
        },
        {
            headerName: 'MALZEME DURUMU',
            width: 140,
            cellRenderer: AvailabilityCellRenderer,
            headerClass: 'text-xs font-bold text-slate-500',
        },
        {
            field: 'plannedQuantity',
            headerName: 'MİKTAR',
            width: 100,
            type: 'numericColumn',
            headerClass: 'text-xs font-bold text-slate-500',
            valueFormatter: (p: any) => p.value?.toLocaleString('tr-TR'),
        },
        {
            field: 'status',
            headerName: 'DURUM',
            width: 130,
            headerClass: 'text-xs font-bold text-slate-500',
            cellRenderer: (params: any) => {
                const s = STATUS_MAP[params.value] ?? { label: params.value, className: 'bg-gray-400' };
                return <Badge className={`${s.className} text-[10px] px-2 py-0`}>{s.label}</Badge>;
            }
        },
        {
            field: 'plannedStart',
            headerName: 'BAŞLANGIÇ',
            width: 110,
            headerClass: 'text-xs font-bold text-slate-500',
            valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('tr-TR') : '-',
        },
        {
            headerName: 'İŞLEMLER',
            width: 100,
            pinned: 'right',
            cellRenderer: ActionsCellRenderer,
            headerClass: 'text-xs font-bold text-slate-500',
        }
    ], []);

    const createDatasource = useCallback((): IServerSideDatasource => {
        return {
            getRows: async (params: IServerSideGetRowsParams) => {
                try {
                    const { startRow, endRow } = params.request;
                    const page = Math.floor((startRow ?? 0) / 50) + 1;
                    const pageSize = (endRow ?? 50) - (startRow ?? 0);

                    // Simple URL construction - full implementation would handle sorting/filtering
                    const url = `/production-orders?page=${page}&pageSize=${pageSize}${searchTerm ? `&search=${searchTerm}` : ''}`;
                    const response = await apiClient.get<any>(url);

                    params.success({
                        rowData: response.data?.rows ?? response.data ?? [],
                        rowCount: response.meta?.total ?? -1,
                    });
                } catch (e) {
                    params.fail();
                }
            }
        };
    }, [searchTerm]);

    return (
        <div className="h-[600px] w-full bg-white border rounded-md shadow-sm overflow-hidden">
            <AgGridReact
                theme={themeQuartz}
                ref={gridRef}
                columnDefs={columnDefs}
                rowModelType="serverSide"
                cacheBlockSize={50}
                onGridReady={(e) => {
                    setGridApi(e.api);
                    e.api.setGridOption('serverSideDatasource', createDatasource());
                }}
                onRowDoubleClicked={(e) => onEdit(e.data.id)}
                context={context}
                overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Kayıt bulunamadı</span>'
            />

            <MaterialCheckDialog
                open={checkDialogOpen}
                onOpenChange={setCheckDialogOpen}
                orderId={selectedOrderId}
                onProceed={() => {
                    toast({ title: "Başarılı", description: "Üretim başlatıldı (Mock)." });
                }}
            />
        </div>
    );
}
