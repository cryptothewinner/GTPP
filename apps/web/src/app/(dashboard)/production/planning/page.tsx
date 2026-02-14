'use client';

import React, { useState, useCallback } from 'react';
import {
    Factory,
    Database,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    Download,
    Plus,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useProductionOrderDetail, useUpdateProductionOrder } from '@/hooks/use-production-orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormEngine } from '@/components/form-engine/form-engine';
import { useToast } from '@/hooks/use-toast';
import { PlanningTabs } from './components/planning-tabs';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Taslak', className: 'bg-slate-400' },
    PLANNED: { label: 'Planlandı', className: 'bg-blue-500' },
    IN_PROGRESS: { label: 'Devam Ediyor', className: 'bg-amber-500' },
    COMPLETED: { label: 'Tamamlandı', className: 'bg-emerald-500' },
    CANCELLED: { label: 'İptal', className: 'bg-rose-500' },
};

export default function ProductionPlanningPage() {
    // --- State ---
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Hooks ---
    const { toast } = useToast();
    const updateMutation = useUpdateProductionOrder();

    // Summary Data
    const { data: summaryResult, refetch, isFetching } = useQuery({
        queryKey: ['production-orders-summary'],
        queryFn: () => apiClient.get<any>('/production-orders/summary'),
    });

    const summary = summaryResult?.data;
    const byStatus = summary?.byStatus ?? {};

    // Detail Data for Sheet
    const { data: detailResponse, isLoading: isLoadingDetail, error: detailError } =
        useProductionOrderDetail(sheetOpen ? selectedId : null);
    const detail = detailResponse?.data;

    // --- Handlers ---
    const handleSheetSubmit = useCallback(
        async (formData: Record<string, any>) => {
            if (!selectedId) return;
            try {
                await updateMutation.mutateAsync({ id: selectedId, data: formData });
                toast({ title: 'Başarılı', description: 'Üretim emri başarıyla güncellendi.' });
                setSheetOpen(false);
                refetch();
                // Note: We might want to refresh the grid too, but since WorkOrderList is decoupled, 
                // we rely on row updates or manual refresh for now.
            } catch (error: any) {
                toast({
                    title: 'Hata',
                    description: error.message || 'Güncelleme sırasında bir hata oluştu.',
                    variant: 'destructive',
                });
            }
        },
        [selectedId, updateMutation, toast, refetch],
    );

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-[#f88962] rounded-md text-white shadow-sm">
                            <Factory className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Üretim</p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Üretim Planlama</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Dışa Aktar
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-[32px] px-4 font-bold rounded shadow-sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Yeni Üretim Emri
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard
                        label="PLANLANAN"
                        value={byStatus?.PLANNED ?? 0}
                        icon={<Clock className="w-4 h-4 text-blue-500" />}
                    />
                    <MetricCard
                        label="DEVAM EDEN"
                        value={byStatus?.IN_PROGRESS ?? 0}
                        icon={<Database className="w-4 h-4 text-amber-500" />}
                    />
                    <MetricCard
                        label="TAMAMLANAN"
                        value={byStatus?.COMPLETED ?? 0}
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    />
                    <MetricCard
                        label="İPTAL EDİLEN"
                        value={byStatus?.CANCELLED ?? 0}
                        icon={<XCircle className="w-4 h-4 text-rose-500" />}
                    />
                    <MetricCard
                        label="GECİKMİŞ"
                        value={summary?.overdueCount ?? 0}
                        icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                        warning={(summary?.overdueCount ?? 0) > 0}
                    />
                </div>

                {/* Main Content (Tabs) */}
                <div className="bg-white rounded border border-slate-200 shadow-sm min-h-[600px] flex flex-col p-4">
                    <PlanningTabs
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onEdit={(id) => { setSelectedId(id); setSheetOpen(true); }}
                    />
                </div>

                {/* Edit Sheet */}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col p-0 border-none rounded-l-3xl shadow-2xl">
                        <div className="bg-slate-900 text-white p-8 flex-shrink-0 relative overflow-hidden">
                            <div className="relative z-10">
                                <SheetHeader>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="p-2 bg-orange-500/20 rounded-xl">
                                            <Factory className="w-6 h-6 text-orange-400" />
                                        </div>
                                        <SheetTitle className="text-2xl font-black text-white">
                                            {isLoadingDetail ? 'Yükleniyor...' : detail?.orderNumber || 'Üretim Emri Düzenle'}
                                        </SheetTitle>
                                        {detail?.status && (
                                            <Badge className={`text-white ${STATUS_MAP[detail.status]?.className ?? 'bg-gray-400'}`}>
                                                {STATUS_MAP[detail.status]?.label ?? detail.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <SheetDescription className="text-slate-400 font-medium">
                                        {detail ? (detail.product?.name ?? 'Seçili üretim emrini düzenleyin') : 'Seçili üretim emrinin detaylarını güncelleyin.'}
                                    </SheetDescription>
                                </SheetHeader>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
                        </div>

                        <ScrollArea className="flex-1 px-8 py-8 bg-white">
                            {isLoadingDetail ? (
                                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-slate-500 font-medium animate-pulse">Üretim emri verileri getiriliyor...</p>
                                </div>
                            ) : detailError ? (
                                <div className="text-center py-24 space-y-4">
                                    <p className="text-rose-500 font-bold">Veri Yükleme Hatası</p>
                                    <p className="text-slate-500 text-sm">{(detailError as any).message}</p>
                                </div>
                            ) : detail ? (
                                <FormEngine
                                    entitySlug="production-order-card"
                                    initialData={detail}
                                    onSubmit={handleSheetSubmit}
                                    isSubmitting={updateMutation.isPending}
                                    onCancel={() => setSheetOpen(false)}
                                    className="pb-12"
                                />
                            ) : (
                                <div className="text-center py-24">
                                    <p className="text-slate-400 italic">Üretim emri bulunamadı veya ID geçersiz.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, trend, positive, warning, danger }: any) {
    return (
        <div className="bg-white p-4 border border-slate-200 rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="flex items-end justify-between">
                <h3 className={`text-2xl font-bold ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : 'text-slate-800'}`}>
                    {value}
                </h3>
            </div>
            {trend && (
                <p className={`text-[11px] mt-2 font-medium ${positive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {trend}
                </p>
            )}
        </div>
    );
}
