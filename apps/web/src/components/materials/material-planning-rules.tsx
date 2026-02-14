'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { UseFormReturn } from 'react-hook-form';

interface Props {
    form: UseFormReturn<any>;
}

export function MaterialPlanningRules({ form }: Props) {
    const { register, watch, setValue } = form;
    const uom = watch('unitOfMeasure');

    return (
        <div className="space-y-8">
            {/* MRP Kuralları */}
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-lightning-blue rounded-full"></span>
                    Stok & Planlama Kuralları (MRP)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Minimum Stok Seviyesi</label>
                        <div className="flex items-center gap-2">
                            <Input type="number" {...register('minStockLevel', { valueAsNumber: true })} className="bg-white" />
                            <span className="text-xs text-slate-500 font-bold">{uom}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Stok bu seviyenin altına düştüğünde uyarı verilir.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Güvenlik Stoğu</label>
                        <div className="flex items-center gap-2">
                            <Input type="number" {...register('safetyStock', { valueAsNumber: true })} className="bg-white" />
                            <span className="text-xs text-slate-500 font-bold">{uom}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Acil durumlar için her zaman elde tutulması gereken miktar.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Maksimum Stok Seviyesi</label>
                        <div className="flex items-center gap-2">
                            <Input type="number" {...register('maxStockLevel', { valueAsNumber: true })} className="bg-white" />
                            <span className="text-xs text-slate-500 font-bold">{uom}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Depo kapasitesini aşmamak için üst limit.</p>
                    </div>
                </div>
            </section>

            <Separator />

            {/* Kalite & Süreç Kuralları */}
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Kalite & Süreç Kuralları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-900">Girişte Kalite Kontrol</label>
                            <p className="text-xs text-slate-500">Mal kabulü yapıldığında otomatik olarak "Karantina" stokuna al.</p>
                        </div>
                        <Switch onCheckedChange={(val) => setValue('qualityControl', val)} checked={watch('qualityControl')} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-900">Otomatik Parti Oluşturma</label>
                            <p className="text-xs text-slate-500">Giriş işlemlerinde otomatik olarak parti numarası ata.</p>
                        </div>
                        <Switch onCheckedChange={(val) => setValue('autoBatch', val)} checked={watch('autoBatch')} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-900">Sipariş Onayı Zorunlu</label>
                            <p className="text-xs text-slate-500">Bu malzeme içeren siparişler yönetici onayı gerektirir.</p>
                        </div>
                        <Switch onCheckedChange={(val) => setValue('orderApproval', val)} checked={watch('orderApproval')} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-900">Negatif Stok İzni</label>
                            <p className="text-xs text-slate-500">Stok yetersiz olsa bile düşüme izin ver (Önerilmez).</p>
                        </div>
                        <Switch onCheckedChange={(val) => setValue('allowNegativeStock', val)} checked={watch('allowNegativeStock')} />
                    </div>
                </div>
            </section>
        </div>
    );
}
