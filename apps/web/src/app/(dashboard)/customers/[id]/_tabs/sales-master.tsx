
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Truck, Wallet } from 'lucide-react';

function getFunctionName(code: string) {
    const map: Record<string, string> = {
        'AG': 'Sipariş Veren', // Sold-to
        'RE': 'Fatura Alıcısı', // Bill-to
        'WE': 'Malı Teslim Alan', // Ship-to
        'RG': 'Ödeyen', // Payer
    };
    return map[code] || code;
}

export default function CustomerSalesMasterTab({ customer }: { customer: any }) {
    return (
        <div className="space-y-6">
            {/* Partner Functions Placeholder - to be implemented next */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Muhatap İşlevleri (Partner Functions)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border text-sm overflow-hidden">
                        <div className="bg-slate-50 border-b flex px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider">
                            <div className="w-32">İşlev</div>
                            <div className="flex-1">Muhatap</div>
                            <div className="w-24">Varsayılan</div>
                        </div>
                        {/* Dynamic Partner Functions */}
                        {customer.partnerFunctions && customer.partnerFunctions.length > 0 ? (
                            customer.partnerFunctions.map((pf: any) => (
                                <div key={pf.id} className="flex px-4 py-3 border-b last:border-0 items-center hover:bg-slate-50/50">
                                    <div className="w-32 font-medium">
                                        {getFunctionName(pf.functionCode)}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-medium text-slate-900">{pf.targetBP?.name1 || 'Bilinmiyor'}</span>
                                        <span className="text-xs text-slate-500">{pf.targetBP?.bpNumber}</span>
                                    </div>
                                    <div className="w-24">
                                        {pf.isDefault ? (
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Evet</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500">Hayır</Badge>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-slate-500">
                                Tanımlı işlev yok.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Truck className="w-4 h-4 text-orange-600" />
                            Sevkiyat Kuralları
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Teslimat Önceliği</span>
                            <span className="text-sm font-medium">02 - Normal</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Sevkiyat Koşulu</span>
                            <span className="text-sm font-medium">01 - Standart</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Teslimat Şubesi</span>
                            <span className="text-sm font-medium">1000 - İstanbul Merkez</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-purple-600" />
                            Finansal Kurallar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Fiyat Listesi</span>
                            <span className="text-sm font-medium">{customer.customerDetails?.priceList}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Ödeme Koşulları</span>
                            <span className="text-sm font-medium">Z030 - 30 Gün Net</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Vergi Sınıflandırması</span>
                            <span className="text-sm font-medium">1 - Tam KDV</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
