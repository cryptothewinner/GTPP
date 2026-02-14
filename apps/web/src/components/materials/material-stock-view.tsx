'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import { MaterialDetail } from '@/hooks/use-materials';
import { useMaterialMovements } from '@/hooks/use-material-documents';
import { ColDef } from 'ag-grid-community';

interface Props {
    material: MaterialDetail;
}

export function MaterialStockView({ material }: Props) {
    // Current Stock (Batches)
    const rowData = useMemo(() => {
        if (!material.batches || !Array.isArray(material.batches)) return [];
        return material.batches.map((b: any) => ({
            batchNumber: b.batchNumber,
            storageLocation: b.storageLocation || 'DEPO-1',
            quantity: b.remainingQuantity,
            status: b.status,
            expiryDate: b.expiryDate,
        }));
    }, [material.batches]);

    const columnDefs = useMemo<ColDef[]>(() => [
        { field: 'storageLocation', headerName: 'DEPO YERİ', width: 150 },
        { field: 'batchNumber', headerName: 'PARTİ NO', width: 180 },
        {
            field: 'quantity',
            headerName: 'MİKTAR',
            width: 120,
            cellClass: 'text-right font-medium',
            valueFormatter: (p) => p.value ? Number(p.value).toLocaleString() : '0'
        },
        {
            field: 'status',
            headerName: 'DURUM',
            width: 120,
            cellRenderer: (p: any) => {
                const colors: any = { AVAILABLE: 'text-emerald-600 bg-emerald-50', QUARANTINE: 'text-amber-600 bg-amber-50', BLOCKED: 'text-rose-600 bg-rose-50' };
                return <span className={`px-2 py-1 rounded text-xs font-bold ${colors[p.value] || ''}`}>{p.value}</span>;
            }
        },
        {
            field: 'expiryDate',
            headerName: 'S.K.T.',
            width: 120,
            valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('tr-TR') : '-'
        },
    ], []);

    // Movement History
    const { data: movements, isLoading } = useMaterialMovements(material.id);

    const movementDefs = useMemo<ColDef[]>(() => [
        {
            field: 'materialDocument.documentDate',
            headerName: 'TARİH',
            width: 110,
            valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('tr-TR') : '-'
        },
        {
            field: 'materialDocument.movementType',
            headerName: 'HAREKET TÜRÜ',
            width: 160,
            cellRenderer: (p: any) => (
                <span className="font-mono text-xs text-slate-600">{p.value}</span>
            )
        },
        {
            field: 'quantity',
            headerName: 'MİKTAR',
            width: 100,
            cellClass: 'text-right font-bold',
            cellStyle: (params) => ({
                color: params.data.debitCredit === 'S' ? '#059669' : '#dc2626' // Red/Green
            }),
            valueFormatter: (p) => {
                const val = Number(p.value);
                const sign = p.data.debitCredit === 'S' ? '+' : '-';
                return `${sign}${val.toLocaleString()}`;
            }
        },
        { field: 'batchNumber', headerName: 'PARTİ', width: 140 },
        { field: 'materialDocument.docNumber', headerName: 'BELGE NO', width: 140 },
        { field: 'plant.name', headerName: 'ÜRETİM YERİ', width: 150 },
    ], []);

    return (
        <div className="space-y-8">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Toplam Stok</p>
                    <p className="text-2xl font-bold text-slate-800">{material.currentStock} <span className="text-sm font-normal text-slate-500">{material.unitOfMeasure}</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Kullanılabilir</p>
                    <p className="text-2xl font-bold text-emerald-600">{rowData.filter((r: any) => r.status === 'AVAILABLE').reduce((a: number, b: any) => a + Number(b.quantity), 0)} <span className="text-sm font-normal text-slate-500">{material.unitOfMeasure}</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Kalite / Blokeli</p>
                    <p className="text-2xl font-bold text-amber-600">{rowData.filter((r: any) => r.status !== 'AVAILABLE').reduce((a: number, b: any) => a + Number(b.quantity), 0)} <span className="text-sm font-normal text-slate-500">{material.unitOfMeasure}</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Depo Değeri</p>
                    <p className="text-2xl font-bold text-blue-600">{(Number(material.currentStock) * Number(material.unitPrice || 0)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </div>
            </div>

            {/* Current Stock Grid */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Mevcut Stok (Partiler)</h3>
                <div className="h-[250px] w-full ag-theme-quartz border border-slate-200 rounded-lg overflow-hidden">
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                        autoSizeStrategy={{ type: 'fitGridWidth' }}
                    />
                </div>
            </div>

            {/* Movement History Grid */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Stok Hareket Geçmişi</h3>
                <div className="h-[350px] w-full ag-theme-quartz border border-slate-200 rounded-lg overflow-hidden">
                    <AgGridReact
                        rowData={movements || []}
                        columnDefs={movementDefs}
                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                        rowHeight={40}
                        headerHeight={32}
                    />
                </div>
            </div>
        </div>
    );
}
