'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef, GetRowIdParams } from 'ag-grid-enterprise';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOutboundDeliveryList, OutboundDelivery } from '@/hooks/use-outbound-deliveries';

const statusLabels: Record<string, string> = {
    Open: 'Açık',
    DRAFT: 'Taslak',
    PICKED: 'Toplandı',
    ISSUED: 'Sevk Edildi',
    Shipped: 'Sevk Edildi',
};

const statusColors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700',
    DRAFT: 'bg-slate-200 text-slate-700',
    PICKED: 'bg-amber-100 text-amber-700',
    ISSUED: 'bg-emerald-100 text-emerald-700',
    Shipped: 'bg-emerald-100 text-emerald-700',
};

export default function OutboundDeliveriesPage() {
    const router = useRouter();
    const gridRef = useRef<AgGridReact>(null);
    const { data: deliveries, isLoading } = useOutboundDeliveryList();
    const [searchTerm, setSearchTerm] = useState('');

    const getRowId = useCallback((params: GetRowIdParams<OutboundDelivery>) => params.data.id, []);

    const filteredData = useMemo(() => {
        if (!deliveries) return [];
        if (!searchTerm) return deliveries;
        const term = searchTerm.toLowerCase();
        return deliveries.filter(d =>
            d.deliveryNumber.toLowerCase().includes(term) ||
            d.customer?.name1?.toLowerCase().includes(term)
        );
    }, [deliveries, searchTerm]);

    const columnDefs = useMemo<ColDef<OutboundDelivery>[]>(
        () => [
            {
                field: 'deliveryNumber',
                headerName: 'TESLİMAT NO',
                width: 160,
                pinned: 'left',
                cellClass: 'font-semibold text-lightning-blue cursor-pointer hover:underline',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                onCellClicked: (params) => {
                    if (params.data?.id) router.push(`/sales/deliveries/${params.data.id}`);
                },
            },
            {
                headerName: 'MÜŞTERİ',
                width: 220,
                flex: 1,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'text-slate-700 font-medium',
                valueGetter: (params) => params.data?.customer?.name1 || '-',
            },
            {
                field: 'status',
                headerName: 'DURUM',
                width: 140,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellRenderer: (params: any) => (
                    <div className="flex items-center h-full">
                        <span className={`text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-sm ${statusColors[params.value] || 'bg-slate-100 text-slate-700'}`}>
                            {statusLabels[params.value] || params.value}
                        </span>
                    </div>
                ),
            },
            {
                field: 'deliveryDate',
                headerName: 'TESLİMAT TARİHİ',
                width: 140,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
            },
            {
                field: 'actualGI',
                headerName: 'SEVK TARİHİ (PGI)',
                width: 140,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
            },
            {
                field: 'createdAt',
                headerName: 'OLUŞTURULMA',
                width: 140,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
            },
        ],
        [router],
    );

    const onRowDoubleClicked = useCallback((event: any) => {
        if (event.data?.id) router.push(`/sales/deliveries/${event.data.id}`);
    }, [router]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-lightning-blue rounded-md text-white shadow-sm">
                        <Truck className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Satış & Dağıtım</p>
                        <h1 className="text-2xl font-bold text-slate-800 leading-tight">Teslimatlar</h1>
                        <p className="text-sm text-slate-500">Giden teslimatların listesi ve yönetimi</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <div className="flex flex-col h-full bg-white rounded-lg border border-lightning-border overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between gap-4 bg-[#f9fafb] px-4 py-3 border-b border-lightning-border">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Teslimat no veya müşteri adı..."
                                        className="pl-9 h-8 border-lightning-border focus:ring-lightning-blue shadow-none rounded-sm bg-white text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full" style={{ minHeight: '500px' }}>
                            <AgGridReact
                                className="ag-theme-quartz"
                                theme={themeQuartz}
                                ref={gridRef}
                                getRowId={getRowId}
                                rowData={filteredData}
                                columnDefs={columnDefs}
                                defaultColDef={{
                                    sortable: true,
                                    resizable: true,
                                    filter: true,
                                    flex: 1,
                                }}
                                rowHeight={42}
                                headerHeight={32}
                                pagination={true}
                                paginationPageSize={50}
                                onRowDoubleClicked={onRowDoubleClicked}
                                animateRows={true}
                                rowSelection={{ mode: 'singleRow', checkboxes: false }}
                                loading={isLoading}
                                overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Teslimat bulunamadı</span>'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
