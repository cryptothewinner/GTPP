'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ReceiptText, Truck } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useInvoiceDetail } from '@/hooks/use-invoice';
import type { ColDef } from 'ag-grid-enterprise';
import type { InvoiceItem } from '@/hooks/use-invoices';

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

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: invoice, isLoading } = useInvoiceDetail(id);

    const relatedDeliveryId = useMemo(
        () => invoice?.sourceDeliveryId || invoice?.deliveryId,
        [invoice?.deliveryId, invoice?.sourceDeliveryId],
    );

    const itemDefs = useMemo<ColDef<InvoiceItem>[]>(
        () => [
            { field: 'materialId', headerName: 'MALZEME', minWidth: 160, flex: 1 },
            {
                field: 'quantity',
                headerName: 'MİKTAR',
                width: 120,
                cellClass: 'text-right font-medium',
                valueFormatter: (params) => Number(params.value || 0).toLocaleString('tr-TR'),
            },
            { field: 'unit', headerName: 'BİRİM', width: 100 },
            {
                field: 'netPrice',
                headerName: 'BR. FİYAT',
                width: 130,
                cellClass: 'text-right',
                valueFormatter: (params) => Number(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
            },
            {
                field: 'netAmount',
                headerName: 'NET',
                width: 140,
                cellClass: 'text-right font-medium',
                valueFormatter: (params) => Number(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
            },
            {
                field: 'taxAmount',
                headerName: 'KDV',
                width: 140,
                cellClass: 'text-right',
                valueFormatter: (params) => Number(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
            },
            {
                field: 'grossAmount',
                headerName: 'BRÜT',
                width: 140,
                cellClass: 'text-right font-semibold',
                valueFormatter: (params) => Number(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
            },
        ],
        [],
    );

    if (isLoading) return <div className="p-6">Yükleniyor...</div>;
    if (!invoice) return <div className="p-6">Fatura bulunamadı.</div>;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <header className="bg-white border-b border-lightning-border p-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => router.push('/sales/invoices')}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-lightning-blue" />
                            <h1 className="text-xl font-bold text-slate-800">{invoice.invoiceNumber}</h1>
                            <span className={`text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-sm ${statusColors[invoice.status] || 'bg-slate-100 text-slate-700'}`}>
                                {statusLabels[invoice.status] || invoice.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{invoice.customer?.name1 || invoice.customerId}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => router.push('/sales/invoices')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Listeye Dön
                </Button>
            </header>

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Fatura Özeti</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Fatura No</Label>
                            <div className="mt-1 text-sm font-medium">{invoice.invoiceNumber}</div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Müşteri</Label>
                            <div className="mt-1 text-sm font-medium">{invoice.customer?.name1 || invoice.customerId}</div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Fatura Tarihi</Label>
                            <div className="mt-1 text-sm font-medium">{new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Vade Tarihi</Label>
                            <div className="mt-1 text-sm font-medium">
                                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('tr-TR') : '-'}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Durum</Label>
                            <div className="mt-1 text-sm font-medium">{statusLabels[invoice.status] || invoice.status}</div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Net Toplam</Label>
                            <div className="mt-1 text-sm font-medium">
                                {Number(invoice.totalNetAmount).toLocaleString('tr-TR', { style: 'currency', currency: invoice.currency })}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">KDV Toplam</Label>
                            <div className="mt-1 text-sm font-medium">
                                {Number(invoice.totalTaxAmount).toLocaleString('tr-TR', { style: 'currency', currency: invoice.currency })}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Brüt Toplam</Label>
                            <div className="mt-1 text-sm font-semibold text-slate-800">
                                {Number(invoice.totalGrossAmount).toLocaleString('tr-TR', { style: 'currency', currency: invoice.currency })}
                            </div>
                        </div>
                    </div>

                    {relatedDeliveryId && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">İlişkili Teslimat</Label>
                            <div className="mt-1">
                                <Link href={`/sales/deliveries/${relatedDeliveryId}`} className="inline-flex items-center text-sm font-medium text-lightning-blue hover:underline">
                                    <Truck className="w-4 h-4 mr-2" />
                                    {relatedDeliveryId}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm h-[500px] flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Fatura Kalemleri</h2>
                    <div className="flex-1 -mx-2">
                        <AgGridReact
                            className="ag-theme-quartz"
                            theme={themeQuartz}
                            rowData={invoice.items || []}
                            columnDefs={itemDefs}
                            defaultColDef={{ resizable: true, sortable: true }}
                            rowHeight={42}
                            headerHeight={32}
                            overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Kalem bulunamadı</span>'
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
