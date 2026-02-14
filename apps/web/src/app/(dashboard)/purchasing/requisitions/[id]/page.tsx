'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, CircleX, Lock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller, useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import {
    useConvertPurchaseRequisitionToPo,
    usePurchaseRequisitionDetail,
    useUpdatePurchaseRequisitionStatus,
    type PurchaseRequisitionStatus,
} from '@/hooks/use-purchase-requisitions';
import { useCustomers } from '@/hooks/use-customers';
import {
    useCompanyCodeList,
    usePlantList,
    usePurchasingGroupList,
    usePurchasingOrgList,
} from '@/hooks/use-purchase-orders';

const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    APPROVED: 'Onaylandı',
    CLOSED: 'Kapalı',
    CANCELLED: 'İptal',
};

const statusColors: Record<string, string> = {
    DRAFT: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
};

const transitionMap: Record<PurchaseRequisitionStatus, PurchaseRequisitionStatus[]> = {
    DRAFT: ['APPROVED', 'CANCELLED'],
    APPROVED: ['CLOSED', 'CANCELLED'],
    CLOSED: [],
    CANCELLED: [],
};

interface ConvertFormData {
    supplierId: string;
    companyCodeId: string;
    purchOrgId: string;
    purchGroupId: string;
    plantId: string;
}

export default function PurchaseRequisitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;

    const { data: requisition, isLoading } = usePurchaseRequisitionDetail(id);
    const statusMutation = useUpdatePurchaseRequisitionStatus();
    const convertMutation = useConvertPurchaseRequisitionToPo();

    const { data: suppliersData } = useCustomers({ role: 'SUPPLIER', pageSize: 100 });
    const { data: purchOrgs } = usePurchasingOrgList();
    const { data: purchGroups } = usePurchasingGroupList();
    const { data: companyCodes } = useCompanyCodeList();
    const { data: plants } = usePlantList();
    const suppliers = suppliersData?.data || [];

    const convertForm = useForm<ConvertFormData>({
        defaultValues: {
            supplierId: '',
            companyCodeId: '',
            purchOrgId: '',
            purchGroupId: '',
            plantId: '',
        },
    });

    if (isLoading || !requisition) {
        return <div className="p-6 text-sm text-slate-500">Yükleniyor...</div>;
    }

    const status = (requisition.status in transitionMap ? requisition.status : 'DRAFT') as PurchaseRequisitionStatus;
    const allowedTransitions = transitionMap[status] || [];

    const handleTransition = async (nextStatus: PurchaseRequisitionStatus) => {
        if (!allowedTransitions.includes(nextStatus)) {
            toast({ title: 'Geçersiz durum geçişi', variant: 'destructive' });
            return;
        }
        try {
            await statusMutation.mutateAsync({ id, status: nextStatus });
            toast({ title: 'Başarılı', description: `Durum ${statusLabels[nextStatus]} olarak güncellendi.` });
        } catch {
            toast({ title: 'Hata', description: 'Durum güncellenemedi.', variant: 'destructive' });
        }
    };

    const onConvert = async (data: ConvertFormData) => {
        try {
            const result = await convertMutation.mutateAsync({
                id,
                payload: {
                    supplierId: data.supplierId,
                    companyCodeId: data.companyCodeId,
                    purchOrgId: data.purchOrgId,
                    purchGroupId: data.purchGroupId || undefined,
                    plantId: data.plantId,
                },
            });

            toast({ title: 'PO taslağı oluşturuldu', description: 'Yeni sipariş ekranına yönlendiriliyorsunuz.' });
            router.push(`/purchasing/orders/${result.id}`);
        } catch {
            toast({ title: 'Hata', description: 'PR -> PO dönüşümü başarısız.', variant: 'destructive' });
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
            <header className="bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.push('/purchasing/requisitions')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Geri
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">{requisition.prNumber}</h1>
                        <p className="text-xs text-slate-500">Satınalma talebi detayı</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                        {statusLabels[status] || status}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {allowedTransitions.includes('APPROVED') && (
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleTransition('APPROVED')}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Onayla
                        </Button>
                    )}
                    {allowedTransitions.includes('CLOSED') && (
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleTransition('CLOSED')}>
                            <Lock className="w-4 h-4 mr-2" /> Kapat
                        </Button>
                    )}
                    {allowedTransitions.includes('CANCELLED') && (
                        <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleTransition('CANCELLED')}>
                            <CircleX className="w-4 h-4 mr-2" /> İptal Et
                        </Button>
                    )}
                </div>
            </header>

            <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
                <section className="bg-white border border-slate-200 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Başlık</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="text-slate-500">Talep Eden:</span> {requisition.requestedBy || '-'}</div>
                        <div><span className="text-slate-500">Talep Tarihi:</span> {new Date(requisition.requestDate).toLocaleDateString('tr-TR')}</div>
                        <div><span className="text-slate-500">Kalem:</span> {requisition.items?.length || 0}</div>
                    </div>
                    {requisition.notes && <p className="mt-3 text-sm text-slate-600">{requisition.notes}</p>}
                </section>

                <section className="bg-white border border-slate-200 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Talep Kalemleri</h2>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-slate-500">
                                    <th className="py-2">Malzeme/Hizmet</th>
                                    <th className="py-2">Miktar</th>
                                    <th className="py-2">Birim</th>
                                    <th className="py-2">Teslim Tarihi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requisition.items?.map((item) => (
                                    <tr key={item.id} className="border-b last:border-none">
                                        <td className="py-2">{item.material?.code ? `${item.material.code} - ` : ''}{item.materialName}</td>
                                        <td className="py-2">{Number(item.quantity).toLocaleString('tr-TR')}</td>
                                        <td className="py-2">{item.unit}</td>
                                        <td className="py-2">{item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('tr-TR') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {status === 'APPROVED' && (
                    <section className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-700">PR → PO Dönüşümü</h2>
                            <span className="text-xs text-slate-500">Talep kalemlerinden PO taslağı üret</span>
                        </div>
                        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={convertForm.handleSubmit(onConvert)}>
                            <div>
                                <Label>Tedarikçi *</Label>
                                <Controller
                                    control={convertForm.control}
                                    name="supplierId"
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((s: any) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name1}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div>
                                <Label>Şirket Kodu *</Label>
                                <Controller
                                    control={convertForm.control}
                                    name="companyCodeId"
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                {companyCodes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div>
                                <Label>Satınalma Org. *</Label>
                                <Controller
                                    control={convertForm.control}
                                    name="purchOrgId"
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                {purchOrgs?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div>
                                <Label>Satınalma Grubu</Label>
                                <Controller
                                    control={convertForm.control}
                                    name="purchGroupId"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                {purchGroups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.code} - {g.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div>
                                <Label>Plant *</Label>
                                <Controller
                                    control={convertForm.control}
                                    name="plantId"
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                {plants?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={convertMutation.isPending}>
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    {convertMutation.isPending ? 'Oluşturuluyor...' : 'PO Taslağı Oluştur'}
                                </Button>
                            </div>
                        </form>
                    </section>
                )}
            </div>
        </div>
    );
}
