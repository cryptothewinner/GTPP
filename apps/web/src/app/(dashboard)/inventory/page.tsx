'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Layers,
    ShoppingBag,
    TrendingUp,
    Truck,
    AlertTriangle,
    Clock,
    RefreshCw,
    Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInventoryDashboard } from '@/hooks/use-inventory-dashboard';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function MetricCard({ label, value, icon, warning, danger, accent }: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    warning?: boolean;
    danger?: boolean;
    accent?: string;
}) {
    return (
        <div className={`bg-white p-4 border rounded shadow-sm hover:shadow-md transition-shadow ${danger ? 'border-rose-300' : warning ? 'border-amber-300' : 'border-lightning-border'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <h3 className={`text-2xl font-bold ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : accent ?? 'text-slate-800'}`}>
                {value}
            </h3>
        </div>
    );
}

export default function InventoryDashboardPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { isLoading, isError, materialsData, stocksData, productsData, suppliersData, expiredBatchCount, refetchAll } =
        useInventoryDashboard();

    const { data: materialsListResult, isError: materialsListError } = useQuery({
        queryKey: ['materials', 'list', { page: 1, pageSize: 500 }],
        queryFn: () => apiClient.get<any>('/materials?page=1&pageSize=500'),
        staleTime: 60 * 1000,
    });

    const { data: recentBatchesResult, isError: recentBatchesError } = useQuery({
        queryKey: ['material-batches', 'list', { page: 1, pageSize: 10 }],
        queryFn: () => apiClient.get<any>('/material-batches?page=1&pageSize=10'),
        staleTime: 30 * 1000,
    });

    const hasAnyError = isError || materialsListError || recentBatchesError;

    const criticalMaterials: any[] = (materialsListResult?.data ?? []).filter(
        (m: any) => m.minStockLevel > 0 && m.currentStock < m.minStockLevel,
    ).slice(0, 10);

    const recentBatches: any[] = recentBatchesResult?.data ?? [];

    const criticalCount =
        (materialsData?.lowStockCount ?? 0) + (stocksData?.lowStockCount ?? 0);

    const byType: any[] = materialsData?.byType ?? [];
    const totalByType = byType.reduce((s: number, t: any) => s + (t._count ?? t.count ?? 0), 0) || 1;

    const typeLabels: Record<string, string> = {
        RAW_MATERIAL: 'Hammadde',
        PACKAGING: 'Ambalaj',
        SEMI_FINISHED: 'Yarı Mamul',
        FINISHED_PRODUCT: 'Bitmiş Ürün',
    };
    const typeColors: Record<string, string> = {
        RAW_MATERIAL: 'bg-blue-500',
        PACKAGING: 'bg-emerald-500',
        SEMI_FINISHED: 'bg-amber-500',
        FINISHED_PRODUCT: 'bg-purple-500',
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Header */}
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-lightning-blue rounded-md text-white shadow-sm">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Envanter</p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Genel Bakış</h1>
                            <p className="text-sm text-slate-500">Tüm envanter durumunu tek ekrandan takip edin</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold"
                        onClick={refetchAll}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Yenile
                    </Button>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                {hasAnyError && (
                    <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Bazı envanter metrikleri yüklenemedi. Son bilinen değerler veya varsayılan değerler gösteriliyor.
                    </div>
                )}

                {/* Metric Cards — 2×3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MetricCard
                        label="Toplam Malzeme"
                        value={materialsData?.totalMaterials ?? '—'}
                        icon={<Layers className="w-4 h-4 text-blue-500" />}
                    />
                    <MetricCard
                        label="Toplam Ürün"
                        value={productsData?.totalProducts ?? '—'}
                        icon={<ShoppingBag className="w-4 h-4 text-purple-500" />}
                    />
                    <MetricCard
                        label="Toplam Stok Değeri"
                        value={`₺ ${(stocksData?.totalValue ?? 0).toLocaleString('tr-TR')}`}
                        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                        accent="text-emerald-700"
                    />
                    <MetricCard
                        label="Toplam Tedarikçi"
                        value={suppliersData?.totalSuppliers ?? '—'}
                        icon={<Truck className="w-4 h-4 text-slate-500" />}
                    />
                    <MetricCard
                        label="Kritik Stok"
                        value={criticalCount}
                        icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                        warning={criticalCount > 0}
                    />
                    <MetricCard
                        label="Süresi Dolmuş Parti"
                        value={expiredBatchCount}
                        icon={<Clock className="w-4 h-4 text-rose-500" />}
                        danger={expiredBatchCount > 0}
                    />
                </div>

                {/* Middle — Two-column */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Kritik Stok Tablosu */}
                    <div className="bg-white border border-lightning-border rounded shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-lightning-border">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Kritik Stok</h2>
                            <Link href="/inventory/alerts" className="text-xs text-lightning-blue hover:underline font-semibold">
                                Tümünü Gör →
                            </Link>
                        </div>
                        {criticalMaterials.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">Kritik stok yok</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {criticalMaterials.map((m: any) => {
                                    const pct = Math.min(100, Math.round((m.currentStock / m.minStockLevel) * 100));
                                    const missing = Math.max(0, m.minStockLevel - m.currentStock);
                                    return (
                                        <div key={m.id} className="px-4 py-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-700">{m.code} · {m.name}</span>
                                                <span className="text-xs text-rose-600 font-bold">-{missing} {m.unitOfMeasure}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${pct <= 0 ? 'bg-rose-500' : pct < 50 ? 'bg-amber-500' : 'bg-yellow-400'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-slate-500 w-8 text-right">{pct}%</span>
                                            </div>
                                            <div className="flex gap-4 mt-1 text-[11px] text-slate-400">
                                                <span>Mevcut: <b className="text-slate-600">{m.currentStock}</b></span>
                                                <span>Min: <b className="text-slate-600">{m.minStockLevel}</b></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Son Partiler */}
                    <div className="bg-white border border-lightning-border rounded shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-lightning-border">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Son Oluşturulan Partiler</h2>
                            <Link href="/materials/batches" className="text-xs text-lightning-blue hover:underline font-semibold">
                                Tümünü Gör →
                            </Link>
                        </div>
                        {recentBatches.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">Henüz parti yok</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentBatches.map((b: any) => {
                                    const statusColors: Record<string, string> = {
                                        AVAILABLE: 'bg-emerald-100 text-emerald-700',
                                        RESERVED: 'bg-blue-100 text-blue-700',
                                        QUARANTINE: 'bg-amber-100 text-amber-700',
                                        EXPIRED: 'bg-rose-100 text-rose-700',
                                        CONSUMED: 'bg-slate-100 text-slate-500',
                                    };
                                    return (
                                        <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-700">{b.batchNumber}</p>
                                                <p className="text-[11px] text-slate-400">{b.material?.name ?? '—'}</p>
                                            </div>
                                            <div className="flex items-center gap-3 text-right">
                                                <span className="text-xs font-bold text-slate-600">
                                                    {Number(b.remainingQuantity).toLocaleString('tr-TR')} {b.material?.unitOfMeasure ?? ''}
                                                </span>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[b.status] ?? 'bg-slate-100 text-slate-500'}`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Malzeme Türü Dağılımı */}
                {mounted && byType.length > 0 && (
                    <div className="bg-white border border-lightning-border rounded shadow-sm p-4">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Malzeme Türü Dağılımı</h2>
                        <div className="space-y-3">
                            {byType.map((t: any) => {
                                const count = t._count ?? t.count ?? 0;
                                const pct = Math.round((count / totalByType) * 100);
                                const color = typeColors[t.type] ?? 'bg-slate-400';
                                const label = typeLabels[t.type] ?? t.type;
                                return (
                                    <div key={t.type} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
                                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{count}</span>
                                        <Badge variant="outline" className="text-[10px] w-10 text-center justify-center">{pct}%</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
