'use client';

import { useState } from 'react';
import {
    AlertTriangle,
    RefreshCw,
    ShoppingBag,
    Layers,
    Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function AlertCard({ item, type }: { item: any; type: 'material' | 'product' }) {
    const cur = Number(item.currentStock ?? 0);
    const min = Number(item.minStockLevel ?? 0);
    const missing = Math.max(0, min - cur);
    const pct = min > 0 ? Math.min(100, Math.round((cur / min) * 100)) : 100;

    const severity = cur <= 0 ? 'critical' : pct < 50 ? 'warning' : 'caution';
    const borderClass =
        severity === 'critical' ? 'border-rose-400 bg-rose-50' :
            severity === 'warning' ? 'border-amber-400 bg-amber-50' :
                'border-yellow-400 bg-yellow-50';
    const badgeClass =
        severity === 'critical' ? 'bg-rose-100 text-rose-700' :
            severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-yellow-100 text-yellow-700';
    const badgeLabel =
        severity === 'critical' ? 'KRİTİK' :
            severity === 'warning' ? 'UYARI' : 'DİKKAT';

    const barColor =
        severity === 'critical' ? 'bg-rose-500' :
            severity === 'warning' ? 'bg-amber-500' : 'bg-yellow-400';

    const code = type === 'material' ? item.code : item.code;
    const name = item.name;
    const unit = item.unitOfMeasure;
    const supplierName = item.supplier?.name;
    const leadTime = item.supplier?.leadTimeDays;
    const lastBatch = item.batches?.[item.batches.length - 1]?.batchNumber;

    return (
        <div className={`border-l-4 rounded-lg p-4 ${borderClass} border border-l-4`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-800">{code} · {name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeLabel}</span>
                    {type === 'material' && item.type && (
                        <Badge variant="outline" className="text-[10px]">
                            {item.type === 'RAW_MATERIAL' ? 'Hammadde' : item.type === 'PACKAGING' ? 'Ambalaj' : item.type}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm mb-3">
                <span className="text-slate-600">Mevcut: <b className="text-slate-800">{cur} {unit}</b></span>
                <span className="text-slate-600">Min: <b className="text-slate-800">{min} {unit}</b></span>
                <span className="text-rose-700 font-semibold">Eksik: {missing} {unit}</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-white/70 rounded-full h-2 border border-slate-200">
                    <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                {supplierName && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {supplierName}</span>}
                {leadTime && <span>Teslim: {leadTime} gün</span>}
                {lastBatch && <span>Son Parti: {lastBatch}</span>}
            </div>
        </div>
    );
}

export default function LowStockAlertsPage() {
    const [tab, setTab] = useState<'materials' | 'products'>('materials');

    const { data: materialsResult, refetch: refetchMaterials, isFetching: matFetching } = useQuery({
        queryKey: ['materials', 'list', { page: 1, pageSize: 500 }],
        queryFn: () => apiClient.get<any>('/materials?page=1&pageSize=500'),
        staleTime: 30 * 1000,
    });

    const { data: productsResult, refetch: refetchProducts, isFetching: prodFetching } = useQuery({
        queryKey: ['products', 'list', { page: 1, pageSize: 500 }],
        queryFn: () => apiClient.get<any>('/products?page=1&pageSize=500'),
        staleTime: 30 * 1000,
    });

    const materials: any[] = (materialsResult?.data ?? []).filter(
        (m: any) => m.minStockLevel > 0 && m.currentStock < m.minStockLevel,
    );

    const products: any[] = (productsResult?.data ?? []).filter(
        (p: any) => p.minStockLevel != null && p.minStockLevel > 0 && p.currentStock < p.minStockLevel,
    );

    const totalAlerts = materials.length + products.length;
    const isFetching = matFetching || prodFetching;

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-500 rounded-md text-white shadow-sm">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div className="flex items-start gap-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Envanter</p>
                                <h1 className="text-2xl font-bold text-slate-800 leading-tight">Düşük Stok Uyarıları</h1>
                                <p className="text-sm text-slate-500">Kritik stok seviyesine ulaşmış malzeme ve ürünleri inceleyin</p>
                            </div>
                            {totalAlerts > 0 && (
                                <span className="mt-1 bg-rose-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                    {totalAlerts}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { refetchMaterials(); refetchProducts(); }} disabled={isFetching}
                        className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        Yenile
                    </Button>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-lightning-border">
                    <button
                        onClick={() => setTab('materials')}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${tab === 'materials' ? 'border-lightning-blue text-lightning-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Layers className="w-4 h-4" />
                        Malzeme Uyarıları
                        {materials.length > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{materials.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('products')}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${tab === 'products' ? 'border-lightning-blue text-lightning-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Ürün Uyarıları
                        {products.length > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{products.length}</span>
                        )}
                    </button>
                </div>

                {/* Content */}
                {tab === 'materials' && (
                    <div>
                        {materials.length === 0 ? (
                            <div className="bg-white border border-lightning-border rounded p-12 text-center">
                                <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Tüm malzeme stokları yeterli seviyede</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {materials.map((m: any) => <AlertCard key={m.id} item={m} type="material" />)}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'products' && (
                    <div>
                        {products.length === 0 ? (
                            <div className="bg-white border border-lightning-border rounded p-12 text-center">
                                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Tüm ürün stokları yeterli seviyede</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {products.map((p: any) => <AlertCard key={p.id} item={p} type="product" />)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
