'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrderDetail, usePlantList } from '@/hooks/use-purchase-orders';
import { useCreateMaterialDocument } from '@/hooks/use-material-documents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReceiveFormData {
    documentDate: string;
    postingDate: string;
    reference: string;
    headerText: string;
    items: {
        poItemId: string;
        materialId: string;
        materialName: string;
        plantId: string;
        plantCode: string; // Display only
        orderedQty: number;
        openQty: number;
        receivedQty: number; // Input
        unit: string;
        storageLocId: string;
        batchNumber: string;
        isSelected: boolean;
    }[];
}

export default function GoodsReceiptPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;

    const { data: order, isLoading } = usePurchaseOrderDetail(id);
    const createMutation = useCreateMaterialDocument();

    // We might need storage locations for the plant. 
    // For now assuming Plant is fixed from PO Item, but Storage Loc can be selected if we had a list.
    // Since we don't have a simple hook for storage locs by plant yet, we'll let user type or just pick default.
    // Actually, let's just use text input for Storage Loc for now or fetch if possible.
    // `usePlantList` gives plants, but not detailed storage locs unless we fetch details.

    const form = useForm<ReceiveFormData>({
        defaultValues: {
            documentDate: new Date().toISOString().split('T')[0],
            postingDate: new Date().toISOString().split('T')[0],
            reference: '',
            headerText: '',
            items: [],
        },
    });

    const { fields } = useFieldArray({ control: form.control, name: 'items' });

    useEffect(() => {
        if (order) {
            form.reset({
                documentDate: new Date().toISOString().split('T')[0],
                postingDate: new Date().toISOString().split('T')[0],
                reference: order.poNumber,
                headerText: '',
                items: order.items?.map(item => {
                    const ordered = Number(item.quantity);
                    const received = Number(item.receivedQuantity);
                    const open = Math.max(0, ordered - received);

                    return {
                        poItemId: item.id,
                        materialId: item.materialId,
                        materialName: item.material?.name || item.materialId, // Assuming api returns material include
                        plantId: item.plantId || '',
                        plantCode: item.plant?.code || '',
                        orderedQty: ordered,
                        openQty: open,
                        receivedQty: open, // Default to receiving remaining
                        unit: item.unit,
                        storageLocId: item.storageLocId || '',
                        batchNumber: '',
                        isSelected: open > 0, // Default select if open
                    };
                }) || [],
            });
        }
    }, [order, form]);

    const onSubmit = async (data: ReceiveFormData) => {
        const selectedItems = data.items.filter(i => i.isSelected && i.receivedQty > 0);

        if (selectedItems.length === 0) {
            toast({ title: 'Hata', description: 'Lütfen teslim alınacak en az bir kalem seçin.', variant: 'destructive' });
            return;
        }

        try {
            await createMutation.mutateAsync({
                movementType: 'GR_PURCHASE_ORDER',
                purchaseOrderId: id,
                documentDate: data.documentDate,
                postingDate: data.postingDate,
                reference: data.reference,
                headerText: data.headerText,
                items: selectedItems.map(item => ({
                    materialId: item.materialId,
                    quantity: item.receivedQty,
                    unit: item.unit,
                    plantId: item.plantId,
                    storageLocId: item.storageLocId || undefined,
                    batchNumber: item.batchNumber || undefined,
                    refItemId: item.poItemId,
                })),
            });

            toast({ title: 'Başarılı', description: 'Mal girişi kaydedildi.' });
            router.push(`/purchasing/orders/${id}`);
        } catch (error) {
            console.error(error);
            toast({ title: 'Hata', description: 'Kayıt sırasında bir hata oluştu.', variant: 'destructive' });
        }
    };

    if (isLoading) return <div className="p-6">Yükleniyor...</div>;
    if (!order) return <div className="p-6">Sipariş bulunamadı</div>;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Mal Girişi (MIGO)</h1>
                        <p className="text-sm text-slate-500">{order.poNumber} - {order.supplier?.name1}</p>
                    </div>
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? 'Kaydediliyor...' : 'Mal Girişini Kaydet'}
                </Button>
            </header>

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Belge Başlığı</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Belge Tarihi</Label>
                            <Input type="date" className="mt-1" {...form.register('documentDate')} />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Kayıt Tarihi</Label>
                            <Input type="date" className="mt-1" {...form.register('postingDate')} />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Referans (İrsaliye No)</Label>
                            <Input className="mt-1" {...form.register('reference')} />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Başlık Notu</Label>
                            <Input className="mt-1" {...form.register('headerText')} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Kalemler</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <CheckSquare className="w-4 h-4" />
                                    </th>
                                    <th className="px-4 py-3">Malzeme</th>
                                    <th className="px-4 py-3">Üretim Yeri</th>
                                    <th className="px-4 py-3">Açık Miktar</th>
                                    <th className="px-4 py-3 w-32">Teslim Alınan</th>
                                    <th className="px-4 py-3 w-20">Birim</th>
                                    <th className="px-4 py-3 w-32">Depo Yeri</th>
                                    <th className="px-4 py-3 w-32">Parti No</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field, index) => (
                                    <tr key={field.id} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                {...form.register(`items.${index}.isSelected`)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {field.materialName}
                                        </td>
                                        <td className="px-4 py-3">
                                            {field.plantCode}
                                        </td>
                                        <td className="px-4 py-3">
                                            {Number(field.openQty).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="h-8 w-28"
                                                {...form.register(`items.${index}.receivedQty`, { valueAsNumber: true })}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {field.unit}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                className="h-8 w-28"
                                                placeholder="Depo"
                                                {...form.register(`items.${index}.storageLocId`)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                className="h-8 w-28"
                                                placeholder="Parti"
                                                {...form.register(`items.${index}.batchNumber`)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </form>
    );
}
