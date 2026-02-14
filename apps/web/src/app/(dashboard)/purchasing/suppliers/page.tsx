'use client';

import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, themeQuartz } from 'ag-grid-community';
import { useCustomers } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, Truck, Globe, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuppliersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { data, isLoading } = useCustomers({ search: searchTerm, role: 'SUPPLIER' });

    const rowData = data?.data || [];

    const colDefs: ColDef[] = useMemo(() => [
        {
            field: 'bpNumber',
            headerName: 'Tedarikçi Kodu',
            width: 120,
            cellRenderer: (params: any) => (
                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                    {params.value}
                </span>
            )
        },
        {
            field: 'name1',
            headerName: 'Ticari Ünvan',
            flex: 2,
            cellRenderer: (params: any) => (
                <div className="flex flex-col justify-center h-full">
                    <span className="font-medium text-slate-700">{params.value}</span>
                    <span className="text-xs text-slate-400">{params.data.name2}</span>
                </div>
            )
        },
        {
            field: 'addresses[0].city',
            headerName: 'Şehir',
            width: 120,
            valueGetter: (params: any) => params.data.addresses?.[0]?.city
        },
        {
            headerName: 'İletişim',
            width: 200,
            valueGetter: (params: any) => {
                const email = params.data.addresses?.[0]?.email;
                const phone = params.data.addresses?.[0]?.phone;
                return { email, phone };
            },
            cellRenderer: (params: any) => {
                const { email, phone } = params.value;
                return (
                    <div className="flex flex-col gap-0.5 text-xs py-1">
                        {phone && <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3" /> {phone}</div>}
                        {email && <div className="flex items-center gap-1 text-blue-500"><Globe className="w-3 h-3" /> {email}</div>}
                    </div>
                );
            }
        },
        {
            headerName: 'Durum',
            width: 100,
            cellRenderer: (params: any) => {
                const isActive = params.data.isActive;
                return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                        {isActive ? 'Aktif' : 'Pasif'}
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
                    onClick={() => router.push(`/customers/${params.data.id}`)}
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
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                        <Truck className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">Tedarikçiler</h1>
                        <p className="text-xs text-slate-500">Satınalma ve tedarikçi yönetimi</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Tedarikçi ara..."
                            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link href="/customers/new?role=SUPPLIER">
                        <Button className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm ml-2">
                            <Plus className="w-4 h-4" />
                            Yeni Tedarikçi
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
                                rowData={rowData}
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
                                onRowClicked={(e) => router.push(`/customers/${e.data.id}`)}
                                overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                                overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Tedarikçi bulunamadı</span>'
                            />
                        </div>

                        {/* Footer Stats */}
                        <div className="h-10 border-t bg-slate-50 flex items-center px-4 text-xs text-slate-500 justify-between shrink-0">
                            <span>Toplam {data?.meta?.total || 0} kayıt</span>
                            <span>Sayfa {data?.meta?.page || 1} / {data?.meta?.totalPages || 1}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
