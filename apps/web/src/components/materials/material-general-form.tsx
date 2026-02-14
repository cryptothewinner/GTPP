'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    form: UseFormReturn<any>;
}

export function MaterialGeneralForm({ form }: Props) {
    const { register, setValue, watch, formState: { errors } } = form;

    // We can use watch to show disabled values that are not edited but displayed
    const code = watch('code');
    const type = watch('type');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol Kolon */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Malzeme Kodu</label>
                        <Input value={code} disabled className="bg-slate-100 font-mono" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Malzeme Adı</label>
                        <Input {...register('name', { required: 'Malzeme adı zorunludur' })} />
                        {errors.name && <span className="text-xs text-red-500">{errors.name.message as string}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Malzeme Türü</label>
                        <Select value={type} disabled>
                            <SelectTrigger className="bg-slate-100">
                                <SelectValue placeholder="Tür seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RAW_MATERIAL">Hammadde</SelectItem>
                                <SelectItem value="PACKAGING">Ambalaj</SelectItem>
                                <SelectItem value="SEMI_FINISHED">Yarı Mamul</SelectItem>
                                <SelectItem value="FINISHED_PRODUCT">Bitmiş Ürün</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Sağ Kolon */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Temel Ölçü Birimi</label>
                            <Select onValueChange={(val) => setValue('unitOfMeasure', val)} defaultValue={watch('unitOfMeasure')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Birim" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADET">ADET</SelectItem>
                                    <SelectItem value="KG">KG</SelectItem>
                                    <SelectItem value="LT">LT</SelectItem>
                                    <SelectItem value="M">M</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Durum</label>
                            <Select onValueChange={(val) => setValue('isActive', val === 'active')} defaultValue={watch('isActive') ? 'active' : 'passive'}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="passive">Pasif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Marka</label>
                        <Input {...register('brand')} placeholder="Marka giriniz..." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Kategori</label>
                        <Input {...register('category')} placeholder="Kategori giriniz..." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Barkod (EAN/GTIN)</label>
                        <Input {...register('barcode')} placeholder="Barkod giriniz..." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Açıklama / Notlar</label>
                        <Input {...register('notes')} className="h-20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
