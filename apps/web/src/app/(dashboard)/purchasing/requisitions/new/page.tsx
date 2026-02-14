'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreatePurchaseRequisition } from '@/hooks/use-purchase-requisitions';

interface PRFormData {
    requestedBy: string;
    notes: string;
    items: {
        materialName: string;
        quantity: number;
        unit: string;
        deliveryDate?: string;
    }[];
}

export default function NewPurchaseRequisitionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const createMutation = useCreatePurchaseRequisition();

    const form = useForm<PRFormData>({
        defaultValues: {
            requestedBy: '',
            notes: '',
            items: [{ materialName: '', quantity: 1, unit: 'ADET', deliveryDate: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

    const onSubmit = async (data: PRFormData) => {
        try {
            const result = await createMutation.mutateAsync({
                requestedBy: data.requestedBy || undefined,
                notes: data.notes || undefined,
                items: data.items.map((item) => ({
                    materialName: item.materialName,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    deliveryDate: item.deliveryDate || undefined,
                })),
            });

            toast({ title: 'Başarılı', description: 'Satınalma talebi oluşturuldu.' });
            router.push(`/purchasing/requisitions/${result.id}`);
        } catch {
            toast({ title: 'Hata', description: 'Talep oluşturulamadı.', variant: 'destructive' });
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
            <header className="bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push('/purchasing/requisitions')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Geri
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Yeni Satınalma Talebi</h1>
                        <p className="text-xs text-slate-500">Talep başlığı ve kalemlerini girin</p>
                    </div>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
            </header>

            <div className="p-6 space-y-6 max-w-6xl w-full mx-auto">
                <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-700">Başlık Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Talep Eden</Label>
                            <Input className="mt-1" placeholder="Örn: Satınalma Ekibi" {...form.register('requestedBy')} />
                        </div>
                        <div>
                            <Label>Notlar</Label>
                            <Textarea className="mt-1" rows={2} placeholder="Açıklama" {...form.register('notes')} />
                        </div>
                    </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700">Talep Kalemleri</h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ materialName: '', quantity: 1, unit: 'ADET', deliveryDate: '' })}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Kalem Ekle
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded p-3">
                                <div className="md:col-span-5">
                                    <Label>Malzeme / Hizmet *</Label>
                                    <Input
                                        className="mt-1"
                                        placeholder="Malzeme adı"
                                        {...form.register(`items.${index}.materialName`, { required: true })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Miktar *</Label>
                                    <Input
                                        className="mt-1"
                                        type="number"
                                        min={0.0001}
                                        step="0.0001"
                                        {...form.register(`items.${index}.quantity`, { required: true, valueAsNumber: true })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Birim *</Label>
                                    <Input className="mt-1" {...form.register(`items.${index}.unit`, { required: true })} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Teslim</Label>
                                    <Input className="mt-1" type="date" {...form.register(`items.${index}.deliveryDate`)} />
                                </div>
                                <div className="md:col-span-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-rose-600 hover:text-rose-700"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </form>
    );
}
