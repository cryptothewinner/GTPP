'use client';

import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, themeQuartz } from 'ag-grid-community';
import { usePurchaseOrderList } from '@/hooks/use-purchase-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, FileText, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PurchaseOrdersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: orders, isLoading } = usePurchaseOrderList();

    // Client-side filtering for now
    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (!searchTerm) return orders;
        const lower = searchTerm.toLowerCase();
        return orders.filter(o =>
            o.poNumber.toLowerCase().includes(lower) ||
            o.supplier?.name1.toLowerCase().includes(lower)
        );
    }, [orders, searchTerm]);

    const colDefs: ColDef[] = useMemo(() => [
        {
            field: 'poNumber',
            headerName: 'Sipariş No',
            width: 140,
            cellRenderer: (params: any) => (
                <span className="font-mono text-xs font-semibold text-blue-600">
                    {params.value}
                </span>
            )
        },
        {
            field: 'supplier.name1',
            headerName: 'Tedarikçi',
            flex: 2,
            cellRenderer: (params: any) => (
                <div className="flex flex-col justify-center h-full">
                    <span className="font-medium text-slate-700">{params.value || 'Giriş Yok'}</span>
                </div>
            )
        },
        {
            field: 'documentDate',
            headerName: 'Belge Tarihi',
            width: 130,
            cellRenderer: (params: any) => (
                <div className="text-slate-600 text-xs flex items-center gap-2 h-full">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {format(new Date(params.value), 'd MMM yyyy', { locale: tr })}
                </div>
            )
        },
        {
            field: 'items',
            headerName: 'Kalemler',
            width: 100,
            valueGetter: (params: any) => params.data.items?.length || 0,
            cellRenderer: (params: any) => (
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {params.value} Kalem
                </span>
            )
        },
        {
            headerName: 'TOPLAM TUTAR',
            width: 140,
            headerClass: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider',
            cellClass: 'font-medium text-right text-slate-700',
            valueGetter: (params: any) => {
                if (!params.data.items) return 0;
                return params.data.items.reduce((sum: number, item: any) => {
                    return sum + (Number(item.quantity) * Number(item.netPrice));
                }, 0);
            },
            valueFormatter: (params: any) => {
                const val = Number(params.value || 0);
                return val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
            }
        },
        {
            field: 'status',
            headerName: 'Durum',
            width: 120,
            cellRenderer: (params: any) => {
                const status = params.value;
                let colorClass = 'bg-slate-100 text-slate-700';
                if (status === 'CONFIRMED') colorClass = 'bg-emerald-100 text-emerald-700';
                if (status === 'DRAFT') colorClass = 'bg-amber-100 text-amber-700';
                if (status === 'CANCELLED') colorClass = 'bg-rose-100 text-rose-700';

                return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            headerName: '',
            width: 100,
            cellRenderer: (params: any) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => router.push(`/purchasing/orders/${params.data.id}`)}
                >
                    Detay
                </Button>
            ),
            pinned: 'right'
        }
    ], []);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">Satınalma Siparişleri</h1>
                        <p className="text-xs text-slate-500">Tedarikçi siparişleri ve takibi</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Sipariş veya tedarikçi ara..."
                            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link href="/purchasing/orders/new">
                        <Button className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm ml-2">
                            <Plus className="w-4 h-4" />
                            Yeni Sipariş
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex-1 w-full" style={{ minHeight: '500px' }}>
                            <AgGridReact
                                className="ag-theme-quartz"
                                theme={themeQuartz}
                                rowData={filteredOrders}
                                columnDefs={colDefs}
                                defaultColDef={{
                                    sortable: true,
                                    filter: true,
                                    resizable: true
                                }}
                                rowHeight={50}
                                headerHeight={40}
                                animateRows={true}
                                rowSelection={{ mode: 'singleRow' }}
                                onRowClicked={(e) => router.push(`/purchasing/orders/${e.data.id}`)}
                                overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Sipariş bulunamadı</span>'
                            />
                        </div>

                        {/* Footer Stats */}
                        <div className="h-10 border-t bg-slate-50 flex items-center px-4 text-xs text-slate-500 justify-between shrink-0">
                            <span>Toplam {filteredOrders.length} kayıt</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
