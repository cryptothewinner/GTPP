'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Trash2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useSalesQuotationDetail, useUpdateSalesQuotation, useDeleteSalesQuotation, useConvertQuotationToOrder } from '@/hooks/use-sales-quotations';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

interface QuotationFormData {
    customerId: string;
    salesOrgId: string;
    validFrom: string;
    validTo: string;
    status: string;
    currency: string;
    notes: string;
    items: {
        materialId: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        notes: string;
    }[];
}

const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    SENT: 'Gönderildi',
    ACCEPTED: 'Kabul Edildi',
    REJECTED: 'Reddedildi',
    EXPIRED: 'Süresi Doldu',
    CONVERTED: 'Siparişe Dönüştü',
};

const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-200 text-slate-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-rose-100 text-rose-700',
    EXPIRED: 'bg-amber-100 text-amber-700',
    CONVERTED: 'bg-purple-100 text-purple-700',
};

function useCustomerList() {
    return useQuery({
        queryKey: ['business-partners', 'customers'],
        queryFn: () => apiClient.get<any>('/business-partners?role=CUSTOMER&pageSize=200'),
        staleTime: 60 * 1000,
    });
}

function useMaterialList() {
    return useQuery({
        queryKey: ['materials', 'all'],
        queryFn: () => apiClient.get<any>('/materials?pageSize=500'),
        staleTime: 60 * 1000,
    });
}

export default function SalesQuotationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;

    const { data: quotation, isLoading } = useSalesQuotationDetail(id);
    const updateMutation = useUpdateSalesQuotation();
    const deleteMutation = useDeleteSalesQuotation();
    const convertMutation = useConvertQuotationToOrder();
    const { data: customersData } = useCustomerList();
    const { data: materialsData } = useMaterialList();

    const customers = customersData?.data || customersData || [];
    const materials = materialsData?.data || materialsData || [];

    const form = useForm<QuotationFormData>({
        defaultValues: {
            customerId: '',
            salesOrgId: '',
            validFrom: '',
            validTo: '',
            status: 'DRAFT',
            currency: 'TRY',
            notes: '',
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

    useEffect(() => {
        if (quotation) {
            form.reset({
                customerId: quotation.customerId,
                salesOrgId: quotation.salesOrgId || '',
                validFrom: quotation.validFrom ? new Date(quotation.validFrom).toISOString().split('T')[0] : '',
                validTo: quotation.validTo ? new Date(quotation.validTo).toISOString().split('T')[0] : '',
                status: quotation.status,
                currency: quotation.currency,
                notes: quotation.notes || '',
                items: quotation.items?.map(item => ({
                    materialId: item.materialId,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    unitPrice: Number(item.unitPrice),
                    notes: item.notes || '',
                })) || [],
            });
        }
    }, [quotation, form]);

    const watchedItems = form.watch('items');
    const totalNet = watchedItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const totalTax = totalNet * 0.20;
    const totalGross = totalNet + totalTax;

    const onSubmit = async (data: QuotationFormData) => {
        try {
            await updateMutation.mutateAsync({ id, data });
            toast({ title: 'Başarılı', description: 'Teklif güncellendi.' });
        } catch {
            toast({ title: 'Hata', description: 'Güncelleme sırasında bir sorun oluştu.', variant: 'destructive' });
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bu teklifi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast({ title: 'Başarılı', description: 'Teklif silindi.' });
            router.push('/sales/quotations');
        } catch {
            toast({ title: 'Hata', description: 'Silme sırasında bir sorun oluştu.', variant: 'destructive' });
        }
    };

    const handleConvert = async () => {
        if (!confirm('Bu teklifi siparişe dönüştürmek istediğinize emin misiniz?')) return;
        try {
            const order = await convertMutation.mutateAsync({ id });
            toast({ title: 'Başarılı', description: 'Teklif siparişe dönüştürüldü.' });
            router.push(`/sales/orders/${order.id}`);
        } catch {
            toast({ title: 'Hata', description: 'Dönüştürme sırasında bir sorun oluştu.', variant: 'destructive' });
        }
    };

    if (isLoading) return <div className="p-6">Yükleniyor...</div>;
    if (!quotation) return <div className="p-6">Teklif bulunamadı</div>;

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
                            <h1 className="text-xl font-bold text-slate-800">{quotation.quoteNumber}</h1>
                            <span className={`text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-sm ${statusColors[quotation.status] || ''}`}>
                                {statusLabels[quotation.status] || quotation.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{quotation.customer?.name1}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" /> Sil
                    </Button>
                    {quotation.status === 'ACCEPTED' && (
                        <Button
                            type="button"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleConvert}
                            disabled={convertMutation.isPending}
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            {convertMutation.isPending ? 'Dönüştürülüyor...' : 'Siparişe Dönüştür'}
                        </Button>
                    )}
                    <Button type="submit" className="bg-lightning-blue hover:bg-blue-600" disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                {/* Header Info */}
                <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Teklif Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Müşteri</Label>
                            <Controller
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder="Müşteri seçin" /></SelectTrigger>
                                        <SelectContent>
                                            {(Array.isArray(customers) ? customers : []).map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name1} ({c.bpNumber})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Geçerlilik Başlangıç</Label>
                            <Input type="date" className="mt-1" {...form.register('validFrom')} />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Geçerlilik Bitiş</Label>
                            <Input type="date" className="mt-1" {...form.register('validTo')} />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Durum</Label>
                            <Controller
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusLabels).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Para Birimi</Label>
                            <Input className="mt-1" {...form.register('currency')} />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Notlar</Label>
                            <Textarea className="mt-1" rows={1} {...form.register('notes')} />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Kalemler</h2>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => append({ materialId: '', quantity: 1, unit: 'Adet', unitPrice: 0, notes: '' })}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Kalem Ekle
                        </Button>
                    </div>

                    {fields.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">Henüz kalem eklenmemiş.</p>
                    )}

                    {fields.length > 0 && (
                        <div className="space-y-3">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                                <div className="col-span-4">Malzeme</div>
                                <div className="col-span-2">Miktar</div>
                                <div className="col-span-1">Birim</div>
                                <div className="col-span-2">Birim Fiyat</div>
                                <div className="col-span-2 text-right">Tutar</div>
                                <div className="col-span-1"></div>
                            </div>

                            {fields.map((field, index) => {
                                const qty = form.watch(`items.${index}.quantity`) || 0;
                                const price = form.watch(`items.${index}.unitPrice`) || 0;
                                const lineTotal = qty * price;

                                return (
                                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-md p-2 border border-slate-100">
                                        <div className="col-span-4">
                                            <Controller
                                                control={form.control}
                                                name={`items.${index}.materialId`}
                                                render={({ field: f }) => (
                                                    <Select value={f.value} onValueChange={f.onChange}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Malzeme seçin" /></SelectTrigger>
                                                        <SelectContent>
                                                            {(Array.isArray(materials) ? materials : []).map((m: any) => (
                                                                <SelectItem key={m.id} value={m.id}>{m.code} - {m.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="h-8 text-xs"
                                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Input className="h-8 text-xs" {...form.register(`items.${index}.unit`)} />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="h-8 text-xs"
                                                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                            />
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-medium text-slate-700">
                                            {lineTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:bg-rose-50" onClick={() => remove(index)}>
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Totals */}
                    {fields.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-lightning-border">
                            <div className="flex justify-end">
                                <div className="w-64 space-y-1">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Net Tutar:</span>
                                        <span className="font-medium">{totalNet.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>KDV (%20):</span>
                                        <span className="font-medium">{totalTax.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold text-slate-800 pt-1 border-t">
                                        <span>Toplam:</span>
                                        <span>{totalGross.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
