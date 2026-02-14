'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react';
import { useProductList } from '@/hooks/use-products';
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/components/dashboard/page-states';

export default function ProductsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all');

    const { data, isLoading, isFetching, isError, refetch } = useProductList({
        page: 1,
        pageSize: 250,
        search: search.trim() || undefined,
        filters: statusFilter === 'all' ? undefined : { isActive: statusFilter === 'active' },
    });

    const products = (data?.data ?? []) as Array<Record<string, any>>;

    const filteredRows = useMemo(() => {
        return products.filter((product) => {
            if (statusFilter === 'all') return true;
            return statusFilter === 'active' ? !!product.isActive : !product.isActive;
        });
    }, [products, statusFilter]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ürün Listesi</h1>
                    <p className="text-sm text-slate-500">Gerçek ürün kataloğunu filtreleyin ve ürün detaylarına gidin.</p>
                </div>
            </div>

            <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ürün adı, kodu veya kategori ara"
                        className="w-full h-10 rounded-md border border-slate-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'passive')}
                        className="h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">Aktif</option>
                        <option value="passive">Pasif</option>
                    </select>
                    <button
                        onClick={() => refetch()}
                        className="h-10 px-3 rounded-md border border-slate-300 text-sm font-medium inline-flex items-center gap-2 hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Yenile
                    </button>
                </div>
            </section>

            {isLoading ? (
                <PageLoadingState title="Ürün listesi yükleniyor..." />
            ) : isError ? (
                <PageErrorState
                    title="Ürünler alınamadı"
                    description="Servise erişirken bir hata oluştu. Bağlantınızı kontrol edip tekrar deneyin."
                    actionLabel="Tekrar Dene"
                    onAction={() => refetch()}
                />
            ) : filteredRows.length === 0 ? (
                <PageEmptyState
                    title="Ürün bulunamadı"
                    description="Arama ve filtre kriterlerine uygun bir ürün yok. Farklı bir arama deneyin."
                    actionLabel="Filtreleri Temizle"
                    onAction={() => {
                        setSearch('');
                        setStatusFilter('all');
                    }}
                />
            ) : (
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold">Kod</th>
                                    <th className="text-left px-4 py-3 font-semibold">Ürün</th>
                                    <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                                    <th className="text-left px-4 py-3 font-semibold">Stok</th>
                                    <th className="text-left px-4 py-3 font-semibold">Durum</th>
                                    <th className="text-right px-4 py-3 font-semibold">Detay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((product) => (
                                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                                        <td className="px-4 py-3 font-medium text-blue-700">{product.code ?? '—'}</td>
                                        <td className="px-4 py-3">{product.name ?? '—'}</td>
                                        <td className="px-4 py-3">{product.category ?? '—'}</td>
                                        <td className="px-4 py-3">{Number(product.currentStock ?? 0).toLocaleString('tr-TR')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {product.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/materials/products/${product.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                                                Detaya git
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
