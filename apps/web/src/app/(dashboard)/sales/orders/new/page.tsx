'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useCreateSalesOrder, useSalesOrgList } from '@/hooks/use-sales-orders';
import { usePlantList } from '@/hooks/use-purchase-orders';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

interface OrderFormData {
    customerId: string;
    salesOrgId: string;
    customerRef: string;
    requestedDeliveryDate: string;
    currency: string;
    items: {
        materialId: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        plantId: string;
    }[];
}

function useCustomerList() {
    return useQuery({
        queryKey: ['business-partners', 'customers'],
        queryFn: () => apiClient.get<any>('/business-partners?role=CUSTOMER&pageSize=200'),
        staleTime: 60 * 1000,
    });
}

function useMaterialSelectList() {
    return useQuery({
        queryKey: ['materials', 'all'],
        queryFn: () => apiClient.get<any>('/materials?pageSize=500'),
        staleTime: 60 * 1000,
    });
}

export default function NewSalesOrderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const createMutation = useCreateSalesOrder();
    const { data: customersData } = useCustomerList();
    const { data: materialsData } = useMaterialSelectList();
    const { data: salesOrgs } = useSalesOrgList();
    const { data: plantsData } = usePlantList();

    const customers = customersData?.data || customersData || [];
    const materials = materialsData?.data || materialsData || [];
    const plants = plantsData || []; // Assuming array from hook

    const form = useForm<OrderFormData>({
        defaultValues: {
            customerId: '',
            salesOrgId: '',
            customerRef: '',
            requestedDeliveryDate: '',
            currency: 'TRY',
            items: [{ materialId: '', quantity: 1, unit: 'Adet', unitPrice: 0, plantId: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

    const watchedItems = form.watch('items');
    const totalNet = watchedItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const totalTax = totalNet * 0.20;
    const totalGross = totalNet + totalTax;

    const onSubmit = async (data: OrderFormData) => {
        if (!data.customerId) {
            toast({ title: 'Hata', description: 'Lütfen bir müşteri seçin.', variant: 'destructive' });
            return;
        }
        if (!data.salesOrgId) {
            toast({ title: 'Hata', description: 'Lütfen bir satış organizasyonu seçin.', variant: 'destructive' });
            return;
        }
        if (data.items.length === 0 || !data.items[0].materialId) {
            toast({ title: 'Hata', description: 'En az bir kalem ekleyin.', variant: 'destructive' });
            return;
        }
        try {
            const result = await createMutation.mutateAsync(data);
            toast({ title: 'Başarılı', description: 'Sipariş oluşturuldu.' });
            router.push(`/sales/orders/${result.id}`);
        } catch {
            toast({ title: 'Hata', description: 'Oluşturma sırasında bir sorun oluştu.', variant: 'destructive' });
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-screen bg-slate-50">
            <header className="bg-white border-b border-lightning-border p-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Yeni Satış Siparişi</h1>
                        <p className="text-sm text-slate-500">Müşteriye yeni bir sipariş oluşturun</p>
                    </div>
                </div>
                <Button type="submit" className="bg-lightning-blue hover:bg-blue-600" disabled={createMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? 'Kaydediliyor...' : 'Oluştur'}
                </Button>
            </header>

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                {/* Header Info */}
                <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Sipariş Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Müşteri *</Label>
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
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Satış Org. *</Label>
                            <Controller
                                control={form.control}
                                name="salesOrgId"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder="Satış Org. seçin" /></SelectTrigger>
                                        <SelectContent>
                                            {(Array.isArray(salesOrgs) ? salesOrgs : []).map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Müşteri Sipariş No.</Label>
                            <Input className="mt-1" {...form.register('customerRef')} placeholder="Opsiyonel" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">İstenen Teslimat Tarihi</Label>
                            <Input type="date" className="mt-1" {...form.register('requestedDeliveryDate')} />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Para Birimi</Label>
                            <Input className="mt-1" {...form.register('currency')} />
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
                            onClick={() => append({ materialId: '', quantity: 1, unit: 'Adet', unitPrice: 0, plantId: '' })}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Kalem Ekle
                        </Button>
                    </div>

                    {fields.length > 0 && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                                <div className="col-span-3">Malzeme</div>
                                <div className="col-span-2">Üretim Yeri</div>
                                <div className="col-span-2">Miktar</div>
                                <div className="col-span-1">Birim</div>
                                <div className="col-span-2">Birim Fiyat</div>
                                <div className="col-span-2 text-right">Tutar</div>
                            </div>

                            {fields.map((field, index) => {
                                const qty = form.watch(`items.${index}.quantity`) || 0;
                                const price = form.watch(`items.${index}.unitPrice`) || 0;
                                const lineTotal = qty * price;

                                return (
                                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-md p-2 border border-slate-100">
                                        <div className="col-span-3">
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
                                            <Controller
                                                control={form.control}
                                                name={`items.${index}.plantId`}
                                                render={({ field: f }) => (
                                                    <Select value={f.value} onValueChange={f.onChange}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Üretim Yeri" /></SelectTrigger>
                                                        <SelectContent>
                                                            {(Array.isArray(plants) ? plants : []).map((p: any) => (
                                                                <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
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
                                        <div className="col-span-1 text-right text-sm font-medium text-slate-700">
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
