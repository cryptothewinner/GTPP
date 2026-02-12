'use client';

import React from 'react';
import { Package, TrendingUp, AlertTriangle, Database, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { StockDataGrid } from '@/components/stock/stock-data-grid';

export default function InventoryPage() {
    // Stats Query carried over from previous implementation
    const { data: summaryResult } = useQuery({
        queryKey: ['stock-summary'],
        queryFn: () => apiClient.get<any>('/stocks/summary'),
    });

    const summary = summaryResult?.data;

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen animate-in fade-in duration-700">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Package className="w-10 h-10 text-primary" />
                        Envanter Yönetimi
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Tüm ürünlerinizi, stok durumlarını ve fiyatlarını buradan yönetebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Ürün"
                    value={summary?.totalProducts ?? 0}
                    icon={<Package className="w-5 h-5" />}
                    color="blue"
                />
                <StatCard
                    title="Stok Değeri"
                    value={`${(summary?.totalValue ?? 0).toLocaleString('tr-TR')} ₺`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="emerald"
                />
                <StatCard
                    title="Kritik Stok"
                    value={summary?.lowStockCount ?? 0}
                    icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                    color="amber"
                    warning
                />
                <StatCard
                    title="Stokta Yok"
                    value={summary?.outOfStockCount ?? 0}
                    icon={<Info className="w-5 h-5 text-rose-500" />}
                    color="rose"
                />
            </div>

            {/* Main Content Area */}
            <div className="h-[750px] relative">
                <StockDataGrid />
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, warning = false }: { title: string, value: string | number, icon: React.ReactNode, color: string, warning?: boolean }) {
    const colorStyles: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    return (
        <div className={`p-6 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${warning ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
            </div>
        </div>
    );
}
