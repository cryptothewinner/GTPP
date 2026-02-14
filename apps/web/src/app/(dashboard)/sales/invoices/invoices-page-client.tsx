'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef, GetRowIdParams } from 'ag-grid-enterprise';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ReceiptText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInvoiceList, type Invoice } from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';

const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    POSTED: 'Muhasebeleşti',
    CANCELLED: 'İptal',
};

const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-200 text-slate-700',
    POSTED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function InvoicesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const gridRef = useRef<AgGridReact>(null);

    const status = searchParams.get('status') ?? '';
    const customerId = searchParams.get('customerId') ?? '';
    const invoiceDateFrom = searchParams.get('invoiceDateFrom') ?? '';
    const invoiceDateTo = searchParams.get('invoiceDateTo') ?? '';

    const queryParams = useMemo(
        () => ({
            status: status || undefined,
            customerId: customerId || undefined,
            invoiceDateFrom: invoiceDateFrom || undefined,
            invoiceDateTo: invoiceDateTo || undefined,
        }),
        [customerId, invoiceDateFrom, invoiceDateTo, status],
    );

    const { data: invoices, isLoading } = useInvoiceList(queryParams);
    const { data: customersData } = useCustomers({ pageSize: 300 });

    const customers = Array.isArray(customersData)
        ? customersData
        : Array.isArray(customersData?.data)
            ? customersData.data
            : [];

    const updateQueryParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (!value) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
            const next = params.toString();
            router.replace(next ? `${pathname}?${next}` : pathname);
        },
        [pathname, router, searchParams],
    );

    const getRowId = useCallback((params: GetRowIdParams<Invoice>) => params.data.id, []);

    const filteredData = useMemo(() => {
        if (!invoices) return [];

        return invoices.filter((invoice) => {
            const statusMatch = !status || invoice.status === status;
            const customerMatch = !customerId || invoice.customerId === customerId;
            const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;

            const fromMatch = !invoiceDateFrom || (invoiceDate && invoiceDate >= new Date(invoiceDateFrom));
            const toMatch = !invoiceDateTo || (invoiceDate && invoiceDate <= new Date(`${invoiceDateTo}T23:59:59`));

            return Boolean(statusMatch && customerMatch && fromMatch && toMatch);
        });
    }, [customerId, invoiceDateFrom, invoiceDateTo, invoices, status]);

    const columnDefs = useMemo<ColDef<Invoice>[]>(
        () => [
            {
                field: 'invoiceNumber',
                headerName: 'FATURA NO',
                width: 180,
                pinned: 'left',
                cellClass: 'font-semibold text-lightning-blue cursor-pointer hover:underline',
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            },
            {
                headerName: 'MÜŞTERİ',
                width: 230,
                flex: 1,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueGetter: (params) => params.data?.customer?.name1 || '-',
            },
            {
                headerName: 'FATURA / KAYIT TARİHİ',
                width: 190,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueGetter: (params) => {
                    const invoiceDateLabel = params.data?.invoiceDate
                        ? new Date(params.data.invoiceDate).toLocaleDateString('tr-TR')
                        : '-';
                    const postingDateLabel = params.data?.createdAt
                        ? new Date(params.data.createdAt).toLocaleDateString('tr-TR')
                        : '-';
                    return `${invoiceDateLabel} / ${postingDateLabel}`;
                },
            },
            {
                field: 'totalGrossAmount',
                headerName: 'TOPLAM TUTAR',
                width: 160,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'font-medium text-right text-slate-700',
                valueFormatter: (params) => Number(params.value || 0).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }),
            },
            {
                field: 'currency',
                headerName: 'PB',
                width: 100,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                cellClass: 'font-medium',
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
                headerName: 'KAYNAK TESLİMAT',
                width: 180,
                headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
                valueGetter: (params) =>
                    params.data?.sourceDeliveryId ||
                    params.data?.deliveryId ||
                    '-',
            },
        ],
        [],
    );

    const onRowClicked = useCallback(
        (event: any) => {
            if (event.data?.id) {
                router.push(`/sales/invoices/${event.data.id}`);
            }
        },
        [router],
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-lightning-blue rounded-md text-white shadow-sm">
                        <ReceiptText className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Satış & Dağıtım</p>
                        <h1 className="text-2xl font-bold text-slate-800 leading-tight">Faturalar</h1>
                        <p className="text-sm text-slate-500">Satış faturalarının listesi</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <div className="flex flex-col h-full bg-white rounded-lg border border-lightning-border overflow-hidden shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#f9fafb] px-4 py-3 border-b border-lightning-border">
                            <Input
                                type="date"
                                value={invoiceDateFrom}
                                onChange={(e) => updateQueryParam('invoiceDateFrom', e.target.value)}
                            />
                            <Input
                                type="date"
                                value={invoiceDateTo}
                                onChange={(e) => updateQueryParam('invoiceDateTo', e.target.value)}
                            />
                            <Select
                                value={status || 'all'}
                                onValueChange={(value) => updateQueryParam('status', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Durum" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={customerId || 'all'}
                                onValueChange={(value) => updateQueryParam('customerId', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Müşteri" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Müşteriler</SelectItem>
                                    {customers.map((customer: any) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.name1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                onRowClicked={onRowClicked}
                                animateRows={true}
                                rowSelection={{ mode: 'singleRow', checkboxes: false }}
                                loading={isLoading}
                                overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Fatura bulunamadı</span>'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
