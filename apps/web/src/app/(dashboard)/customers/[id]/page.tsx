
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomer, useCustomerMetrics } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MoreVertical, Phone, Mail, MapPin, Building, CreditCard, Activity, ShoppingCart, FileText, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Tabs
import CustomerOverviewTab from './_tabs/overview';
import CustomerActivitiesTab from './_tabs/activities';
import CustomerSalesMasterTab from './_tabs/sales-master';
import CustomerSalesDocumentsTab from './_tabs/sales-documents';
import CustomerFinanceTab from './_tabs/finance';
import CustomerNotesWidget from './_components/notes-widget';

const TABS = [
    { id: 'overview', label: 'Genel Bakış', icon: Building },
    { id: 'sales-master', label: 'Satış Verileri', icon: Users }, // New
    { id: 'sales-docs', label: 'Satış Belgeleri', icon: ShoppingCart }, // Renamed
    { id: 'activities', label: 'Aktiviteler & CRM', icon: Activity },
    { id: 'finance', label: 'Finans', icon: CreditCard },
];

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [activeTab, setActiveTab] = useState('overview');

    const { data: customer, isLoading } = useCustomer(id);
    const { data: metrics } = useCustomerMetrics(id);

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-4" /><Skeleton className="h-64 w-full" /></div>;
    }

    if (!customer) return <div>Müşteri bulunamadı.</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <CustomerOverviewTab customer={customer} />;
            case 'sales-master': return <CustomerSalesMasterTab customer={customer} />;
            case 'sales-docs': return <CustomerSalesDocumentsTab customerId={id} />;
            case 'activities': return <CustomerActivitiesTab customerId={id} />;
            case 'finance': return <CustomerFinanceTab customer={customer} />;
            default: return <div className="p-8 text-center text-slate-500">Bu modül henüz yapım aşamasında.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col">
            {/* Value Header */}
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </Button>
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-blue-200 shadow-md">
                                {customer.name1.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{customer.name1}</h1>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="font-mono bg-slate-100 px-1.5 rounded">{customer.bpNumber}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {customer.addresses?.[0]?.city || 'Şehir Yok'}</span>
                                    <span>•</span>
                                    <span className={customer.isActive ? 'text-emerald-600 font-medium' : 'text-rose-600'}>
                                        {customer.isActive ? 'Aktif Müşteri' : 'Pasif'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="gap-2" onClick={() => setActiveTab('activities')}>
                                <Phone className="w-4 h-4" />
                                Hızlı İletişim
                            </Button>
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <Edit className="w-4 h-4" />
                                Düzenle
                            </Button>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-4 gap-4 py-3 border-t border-slate-100">
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Toplam Sipariş</span>
                            <div className="text-lg font-bold text-slate-800">{metrics?.totalOrders || 0}</div>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Toplam Ciro (YTD)</span>
                            <div className="text-lg font-bold text-emerald-600">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(metrics?.totalRevenue || 0)}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Açık Bakiye</span>
                            <div className="text-lg font-bold text-slate-800">Assign Service</div>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Son Aktivite</span>
                            <div className="text-sm font-medium text-slate-800 mt-1">Bugün, 14:30</div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center px-6 gap-6 overflow-x-auto no-scrollbar border-t border-slate-100">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl w-full mx-auto">
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Notes */}
                <div className="w-80 border-l bg-white hidden xl:block shadow-sm z-10">
                    <CustomerNotesWidget customerId={id} initialNotes={customer.notes} />
                </div>
            </div>
        </div>
    );
}
