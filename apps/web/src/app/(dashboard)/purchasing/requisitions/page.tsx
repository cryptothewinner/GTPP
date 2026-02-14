'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, themeQuartz } from 'ag-grid-community';
import Link from 'next/link';
import { Calendar, ClipboardList, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePurchaseRequisitionList } from '@/hooks/use-purchase-requisitions';

const statusColors: Record<string, string> = {
    DRAFT: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function PurchaseRequisitionListPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: requisitions } = usePurchaseRequisitionList();

    const rows = useMemo(() => {
        if (!requisitions) return [];
        if (!searchTerm) return requisitions;
        const term = searchTerm.toLowerCase();
        return requisitions.filter((pr) =>
            pr.prNumber.toLowerCase().includes(term) ||
            (pr.requestedBy || '').toLowerCase().includes(term),
        );
    }, [requisitions, searchTerm]);

    const colDefs: ColDef[] = useMemo(() => [
        {
            field: 'prNumber',
            headerName: 'Talep No',
            width: 140,
            cellRenderer: (params: any) => <span className="font-mono text-xs font-semibold text-blue-600">{params.value}</span>,
        },
        {
            field: 'requestedBy',
            headerName: 'Talep Eden',
            flex: 1,
            cellRenderer: (params: any) => <span className="text-slate-700">{params.value || 'Belirtilmemiş'}</span>,
        },
        {
            field: 'requestDate',
            headerName: 'Talep Tarihi',
            width: 150,
            cellRenderer: (params: any) => (
                <div className="text-slate-600 text-xs flex items-center gap-2 h-full">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {format(new Date(params.value), 'd MMM yyyy', { locale: tr })}
                </div>
            ),
        },
        {
            field: 'items',
            headerName: 'Kalem',
            width: 110,
            valueGetter: (params: any) => params.data.items?.length || 0,
            cellRenderer: (params: any) => <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{params.value} Kalem</span>,
        },
        {
            field: 'status',
            headerName: 'Durum',
            width: 130,
            cellRenderer: (params: any) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[params.value] || 'bg-slate-100 text-slate-700'}`}>
                    {params.value}
                </span>
            ),
        },
    ], []);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <header className="bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">Satınalma Talepleri</h1>
                        <p className="text-xs text-slate-500">PR kayıtları ve onay akışı</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Talep no / talep eden ara..."
                            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link href="/purchasing/requisitions/new">
                        <Button className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm ml-2">
                            <Plus className="w-4 h-4" />
                            Yeni Talep
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex-1 w-full" style={{ minHeight: '500px' }}>
                            <AgGridReact
                                className="ag-theme-quartz"
                                theme={themeQuartz}
                                rowData={rows}
                                columnDefs={colDefs}
                                defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                rowHeight={50}
                                headerHeight={40}
                                animateRows
                                rowSelection={{ mode: 'singleRow' }}
                                onRowClicked={(e) => router.push(`/purchasing/requisitions/${e.data.id}`)}
                            />
                        </div>
                        <div className="h-10 border-t bg-slate-50 flex items-center px-4 text-xs text-slate-500 justify-between shrink-0">
                            <span>Toplam {rows.length} kayıt</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
