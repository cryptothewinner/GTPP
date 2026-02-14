'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef, GetRowIdParams } from 'ag-grid-enterprise';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSalesQuotationList, SalesQuotation } from '@/hooks/use-sales-quotations';

const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    SENT: 'Gönderildi',
    ACCEPTED: 'Kabul Edildi',
    REJECTED: 'Reddedildi',
    EXPIRED: 'Süresi Doldu',
    CONVERTED: 'Siparişe Dönüştü',
};

const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-200 text-slate-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-rose-100 text-rose-700',
    EXPIRED: 'bg-amber-100 text-amber-700',
    CONVERTED: 'bg-purple-100 text-purple-700',
};

export default function SalesQuotationsPage() {
    const router = useRouter();
    const gridRef = useRef<AgGridReact>(null);
    const { data: quotations, isLoading } = useSalesQuotationList();
    const [searchTerm, setSearchTerm] = useState('');

    const getRowId = useCallback((params: GetRowIdParams<SalesQuotation>) => params.data.id, []);

    const filteredData = useMemo(() => {
        if (!quotations) return [];
        if (!searchTerm) return quotations;
        const term = searchTerm.toLowerCase();
        return quotations.filter(q =>
            q.quoteNumber.toLowerCase().includes(term) ||
            q.customer?.name1?.toLowerCase().includes(term)
        );
    }, [quotations, searchTerm]);

    const columnDefs = useMemo<ColDef<SalesQuotation>[]>(
        () => [
            {
                field: 'quoteNumber',
                headerName: 'TEKLİF NO',
                width: 170,
                pinned: 'left',
                cellClass: 'font-semibold text-lightning-blue cursor-pointer hover:underline',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                onCellClicked: (params) => {
                    if (params.data?.id) router.push(`/sales/quotations/${params.data.id}`);
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
                width: 150,
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
                field: 'validFrom',
                headerName: 'GEÇERLİLİK BAŞLANGIÇ',
                width: 170,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
            },
            {
                field: 'validTo',
                headerName: 'GEÇERLİLİK BİTİŞ',
                width: 170,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
            },
            {
                field: 'totalGrossAmount',
                headerName: 'TOPLAM TUTAR',
                width: 160,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'font-medium text-right text-slate-700',
                valueFormatter: (params) => {
                    const val = Number(params.value || 0);
                    return val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
                },
            },
            {
                field: 'createdAt',
                headerName: 'OLUŞTURULMA',
                width: 150,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
            },
        ],
        [router],
    );

    const onRowDoubleClicked = useCallback((event: any) => {
        if (event.data?.id) router.push(`/sales/quotations/${event.data.id}`);
    }, [router]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Page Header */}
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-lightning-blue rounded-md text-white shadow-sm">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Satış & Dağıtım</p>
                        <h1 className="text-2xl font-bold text-slate-800 leading-tight">Satış Teklifleri</h1>
                        <p className="text-sm text-slate-500">Müşterilere verilen satış tekliflerinin listesi ve yönetimi</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <div className="flex flex-col h-full bg-white rounded-lg border border-lightning-border overflow-hidden shadow-sm">
                        {/* Search & Utility Bar */}
                        <div className="flex items-center justify-between gap-4 bg-[#f9fafb] px-4 py-3 border-b border-lightning-border">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Teklif no veya müşteri adı ile ara..."
                                        className="pl-9 h-8 border-lightning-border focus:ring-lightning-blue shadow-none rounded-sm bg-white text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="h-8 rounded-sm bg-lightning-blue hover:bg-blue-600 text-white text-xs font-bold px-4"
                                onClick={() => router.push('/sales/quotations/new')}
                            >
                                <Plus className="w-3.5 h-3.5 mr-2" />
                                Yeni Teklif
                            </Button>
                        </div>

                        {/* Grid */}
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
                                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Teklif bulunamadı</span>'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
