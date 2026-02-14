'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useCreateCustomer } from '@/hooks/use-customers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerFormData {
    bpNumber: string;
    name1: string;
    taxOffice: string;
    taxNumber: string;
    email: string;
    phone: string;
    city: string;
    district: string;
    addressLine1: string;
    salesDistrict: string;
}

export default function NewCustomerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const createMutation = useCreateCustomer();

    const form = useForm<CustomerFormData>({
        defaultValues: {
            bpNumber: '',
            name1: '',
            taxOffice: '',
            taxNumber: '',
            email: '',
            phone: '',
            city: '',
            district: '',
            addressLine1: '',
            salesDistrict: 'Marmara',
        },
    });

    const onSubmit = async (data: CustomerFormData) => {
        if (!data.bpNumber || !data.name1) {
            toast({ title: 'Hata', description: 'Müşteri Kodu ve Ünvan zorunludur.', variant: 'destructive' });
            return;
        }

        try {
            // Transform flat form data to nested API structure
            const apiPayload = {
                bpNumber: data.bpNumber,
                name1: data.name1,
                category: 'ORGANIZATION',
                roles: ['CUSTOMER'],
                taxOffice: data.taxOffice,
                taxNumber: data.taxNumber,
                isActive: true, // Default active
                addresses: [
                    {
                        type: 'HEADQUARTER',
                        city: data.city,
                        district: data.district,
                        addressLine1: data.addressLine1,
                        email: data.email,
                        phone: data.phone,
                        isDefault: true,
                        country: 'TR'
                    }
                ],
                customerDetails: {
                    salesDistrict: data.salesDistrict,
                    priceList: 'Standard', // Default
                    paymentTerm: 'Net 30',
                    riskClass: 'B'
                }
            };

            await createMutation.mutateAsync(apiPayload);
            toast({ title: 'Başarılı', description: 'Müşteri başarıyla oluşturuldu.' });
            router.push('/customers');
        } catch (error) {
            console.error(error);
            toast({ title: 'Hata', description: 'Müşteri oluşturulurken bir hata oluştu.', variant: 'destructive' });
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Yeni Müşteri Kartı</h1>
                        <p className="text-sm text-slate-500">Sisteme yeni bir müşteri tanımlayın</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" type="button" onClick={() => router.back()}>İptal</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </header>

            <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">

                {/* Identity Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            Kimlik Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bpNumber">Müşteri Kodu (BP Number) *</Label>
                            <Input id="bpNumber" {...form.register('bpNumber')} placeholder="Örn: C-2026-00X" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name1">Ticari Ünvan *</Label>
                            <Input id="name1" {...form.register('name1')} placeholder="Örn: ABC Kimya San. Tic. A.Ş." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                            <Input id="taxOffice" {...form.register('taxOffice')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxNumber">Vergi Numarası</Label>
                            <Input id="taxNumber" {...form.register('taxNumber')} />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Address Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="w-4 h-4 text-orange-600" />
                            İletişim & Adres
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-1"><Mail className="w-3 h-3" /> E-posta</Label>
                            <Input id="email" type="email" {...form.register('email')} placeholder="info@company.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</Label>
                            <Input id="phone" {...form.register('phone')} placeholder="+90 212 ..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Şehir</Label>
                            <Input id="city" {...form.register('city')} placeholder="Istanbul" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="district">İlçe</Label>
                            <Input id="district" {...form.register('district')} placeholder="Kadikoy" />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="addressLine1">Açık Adres</Label>
                            <Input id="addressLine1" {...form.register('addressLine1')} />
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Satış Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="salesDistrict">Satış Bölgesi</Label>
                            <Input id="salesDistrict" {...form.register('salesDistrict')} />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </form>
    );
}
