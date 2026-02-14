'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, ShoppingBag, Truck } from 'lucide-react';
import { PageEmptyState } from '@/components/dashboard/page-states';

const salesModules = [
    {
        title: 'Teklifler',
        description: 'Açık teklifleri takip edin ve siparişe dönüştürün.',
        href: '/sales/quotations',
        icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
        kpiLabel: 'Açık Teklif',
        kpiValue: '12',
    },
    {
        title: 'Siparişler',
        description: 'Onaylı siparişlerin durumunu yönetin.',
        href: '/sales/orders',
        icon: <ShoppingBag className="w-5 h-5 text-emerald-600" />,
        kpiLabel: 'Aktif Sipariş',
        kpiValue: '8',
    },
    {
        title: 'Teslimatlar',
        description: 'Planlanan teslimatları zamanında organize edin.',
        href: '/sales/deliveries',
        icon: <Truck className="w-5 h-5 text-amber-600" />,
        kpiLabel: 'Bugünkü Sevkiyat',
        kpiValue: '5',
    },
    {
        title: 'Faturalar',
        description: 'Fatura kesim ve tahsilat akışını kontrol edin.',
        href: '/sales/invoices',
        icon: <FileText className="w-5 h-5 text-violet-600" />,
        kpiLabel: 'Bekleyen Fatura',
        kpiValue: '3',
    },
];

export default function SalesPage() {
    const hasModules = salesModules.length > 0;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Satışlar</h1>
                    <p className="text-sm text-slate-500">Tekliften faturaya tüm satış modüllerine hızlı erişim.</p>
                </div>
            </div>

            {!hasModules ? (
                <PageEmptyState
                    title="Satış modülü bulunamadı"
                    description="Alt modüller tanımlandığında burada KPI ve hızlı aksiyon kartları görüntülenecek."
                />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {salesModules.map((module) => (
                            <div key={module.title} className="bg-white rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{module.kpiLabel}</span>
                                    {module.icon}
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{module.kpiValue}</p>
                                <p className="text-xs text-slate-500 mt-1">Gerçek zamanlı satış paneli entegrasyonu bekleniyor.</p>
                            </div>
                        ))}
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        {salesModules.map((module) => (
                            <article key={module.href} className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
                                        <p className="text-sm text-slate-500 mt-1">{module.description}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50">{module.icon}</div>
                                </div>
                                <Link
                                    href={module.href}
                                    className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Modüle git
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </article>
                        ))}
                    </section>
                </>
            )}
        </div>
    );
}
