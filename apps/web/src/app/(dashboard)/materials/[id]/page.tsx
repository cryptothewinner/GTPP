'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaterialDetail, useUpdateMaterial } from '@/hooks/use-materials';
import { MaterialGeneralForm } from '@/components/materials/material-general-form';
import { MaterialPlanningRules } from '@/components/materials/material-planning-rules';
import { MaterialStockView } from '@/components/materials/material-stock-view';
import { MaterialAccountingForm } from '@/components/materials/material-accounting-form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

export default function MaterialDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;

    const { data: material, isLoading } = useMaterialDetail(id);
    const updateMutation = useUpdateMaterial();

    const detail = material && 'data' in material ? material.data : material;

    const form = useForm({
        defaultValues: {
            name: '',
            code: '',
            type: '',
            unitOfMeasure: '',
            isActive: true,
            barcode: '',
            notes: '',
            minStockLevel: 0,
            maxStockLevel: 0,
            safetyStock: 0,
            qualityControl: false,
            autoBatch: true,
            orderApproval: false,
            allowNegativeStock: false,
            valuationClass: '',
            unitPrice: 0,
        }
    });

    // Reset form when data loads
    useEffect(() => {
        if (detail) {
            form.reset({
                name: detail.name,
                code: detail.code,
                type: detail.type,
                unitOfMeasure: detail.unitOfMeasure,
                isActive: detail.isActive,
                barcode: detail.barcode,
                notes: detail.notes,
                minStockLevel: Number(detail.minStockLevel || 0),
                maxStockLevel: Number(detail.maxStockLevel || 0),
                safetyStock: Number(detail.safetyStock || 0),
                qualityControl: detail.qualityControl ?? false,
                autoBatch: detail.autoBatch ?? true,
                orderApproval: detail.orderApproval ?? false,
                allowNegativeStock: detail.allowNegativeStock ?? false,
                valuationClass: detail.valuationClass,
                unitPrice: Number(detail.unitPrice || 0),
            });
        }
    }, [detail, form]);

    const onSubmit = async (data: any) => {
        try {
            await updateMutation.mutateAsync({ id, data });
            toast({
                title: "Başarılı",
                description: "Malzeme bilgileri güncellendi.",
                variant: "default"
            });
        } catch (error) {
            toast({
                title: "Hata",
                description: "Güncelleme sırasında bir sorun oluştu.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) return <div className="p-6">Yükleniyor...</div>;
    if (!detail) return <div className="p-6">Malzeme bulunamadı</div>;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-lightning-border p-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-800">{detail.code}</h1>
                            <span className="text-sm text-slate-500">{detail.type}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{detail.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">Sil</Button>
                    <Button type="submit" className="bg-lightning-blue hover:bg-blue-600" disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </header>

            {/* Content Tabs */}
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="bg-white border border-lightning-border p-1 w-full justify-start h-auto rounded-lg shadow-sm mb-6">
                        <TabsTrigger value="general" className="px-6 py-2.5 data-[state=active]:bg-lightning-blue data-[state=active]:text-white">Genel Bilgiler</TabsTrigger>
                        <TabsTrigger value="stock" className="px-6 py-2.5 data-[state=active]:bg-lightning-blue data-[state=active]:text-white">Stok Yönetimi</TabsTrigger>
                        <TabsTrigger value="planning" className="px-6 py-2.5 data-[state=active]:bg-lightning-blue data-[state=active]:text-white">Planlama & Kurallar</TabsTrigger>
                        <TabsTrigger value="accounting" className="px-6 py-2.5 data-[state=active]:bg-lightning-blue data-[state=active]:text-white">Muhasebe</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                        <MaterialGeneralForm form={form} />
                    </TabsContent>

                    <TabsContent value="stock" className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                        <MaterialStockView material={detail} />
                    </TabsContent>

                    <TabsContent value="planning" className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                        <MaterialPlanningRules form={form} />
                    </TabsContent>

                    <TabsContent value="accounting" className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                        <MaterialAccountingForm form={form} />
                    </TabsContent>
                </Tabs>
            </div>
        </form>
    );
}
