'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { PageErrorState, PageLoadingState } from '@/components/dashboard/page-states';
import { useProductDetail } from '@/hooks/use-products';

export default function ProductDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id ?? null;
    const { data, isLoading, isError, refetch } = useProductDetail(id);

    const product = data && 'data' in data ? data.data : null;

    return (
        <div className="p-6 space-y-6">
            <Link href="/materials/products" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ürün listesine dön
            </Link>

            {isLoading ? (
                <PageLoadingState title="Ürün detayı yükleniyor..." />
            ) : isError || !product ? (
                <PageErrorState
                    title="Ürün detayı alınamadı"
                    description="Seçilen ürün kaydına erişilemiyor. Lütfen tekrar deneyin."
                    actionLabel="Tekrar Dene"
                    onAction={() => refetch()}
                />
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                            <p className="text-sm text-slate-500">Kod: {product.code ?? '—'}</p>
                        </div>
                    </div>

                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div><dt className="text-xs uppercase text-slate-500">Kategori</dt><dd className="font-medium">{product.category ?? '—'}</dd></div>
                        <div><dt className="text-xs uppercase text-slate-500">Stok</dt><dd className="font-medium">{Number(product.currentStock ?? 0).toLocaleString('tr-TR')}</dd></div>
                        <div><dt className="text-xs uppercase text-slate-500">Birim</dt><dd className="font-medium">{product.unitOfMeasure ?? '—'}</dd></div>
                        <div><dt className="text-xs uppercase text-slate-500">Maliyet</dt><dd className="font-medium">{Number(product.costPrice ?? 0).toLocaleString('tr-TR')}</dd></div>
                        <div><dt className="text-xs uppercase text-slate-500">Satış Fiyatı</dt><dd className="font-medium">{Number(product.salePrice ?? 0).toLocaleString('tr-TR')}</dd></div>
                        <div><dt className="text-xs uppercase text-slate-500">Durum</dt><dd className="font-medium">{product.isActive ? 'Aktif' : 'Pasif'}</dd></div>
                    </dl>
                </div>
            )}
        </div>
    );
}
