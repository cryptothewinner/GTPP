'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Props {
    form: UseFormReturn<any>;
}

export function MaterialAccountingForm({ form }: Props) {
    const { register, setValue, watch, formState: { errors } } = form;

    return (
        <div className="space-y-8">
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Muhasebe Entegrasyonu
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Değerleme Sınıfı</label>
                        <Select onValueChange={(val) => setValue('valuationClass', val)} defaultValue={watch('valuationClass')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3000">3000 - Hammadde</SelectItem>
                                <SelectItem value="7920">7920 - Bitmiş Ürün</SelectItem>
                                <SelectItem value="3030">3030 - Yarı Mamul</SelectItem>
                                <SelectItem value="3040">3040 - Ambalaj Malzemesi</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-slate-500">Defteri kebir hesaplarını belirler.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Fiyat Kontrolü</label>
                        <Select defaultValue="V" disabled>
                            <SelectTrigger className="bg-slate-50">
                                <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="S">Standart Fiyat</SelectItem>
                                <SelectItem value="V">Hareketli Ortalama Fiyat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            <Separator />

            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Maliyetleme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Birim Fiyat (Tahmini)</label>
                        <div className="relative">
                            <Input type="number" step="0.01" {...register('unitPrice', { valueAsNumber: true })} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">TRY</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
