
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Globe, CreditCard, FileText } from 'lucide-react';

export default function CustomerOverviewTab({ customer }: { customer: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Temel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-medium text-slate-500">Müşteri Kodu</label>
                            <div className="text-sm font-mono mt-1">{customer.bpNumber}</div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">Ticari Ünvan</label>
                            <div className="text-sm font-medium mt-1">{customer.name1}</div>
                            {customer.name2 && <div className="text-xs text-slate-400">{customer.name2}</div>}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">Vergi Dairesi / No</label>
                            <div className="text-sm mt-1">{customer.taxOffice || '-'} / {customer.taxNumber || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">Sektör</label>
                            <div className="text-sm mt-1">{customer.industry || 'Belirtilmemiş'}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Adres Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customer.addresses?.map((addr: any, idx: number) => (
                            <div key={addr.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="mt-1">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                        {addr.city} / {addr.country}
                                        {idx === 0 && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 rounded">Varsayılan</span>}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1">{addr.addressLine1}</div>
                                    {addr.addressLine2 && <div className="text-sm text-slate-600">{addr.addressLine2}</div>}
                                    <div className="text-xs text-slate-500 mt-2 flex gap-4">
                                        {addr.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {addr.phone}</span>}
                                        {addr.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {addr.email}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column - Status & Sales Info */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Satış Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Bölge</span>
                            <span className="text-sm font-medium">{customer.customerDetails?.salesDistrict || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Fiyat Listesi</span>
                            <span className="text-sm font-medium">{customer.customerDetails?.priceList || 'Standart'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Ödeme Vadesi</span>
                            <span className="text-sm font-medium">{customer.customerDetails?.paymentTerm || 'Peşin'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <span className="text-sm text-slate-500">Teslim Şekli</span>
                            <span className="text-sm font-medium">{customer.customerDetails?.incoterms || 'EXW'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-100">Finansal Durum</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-xs text-slate-400">Kredi Limiti</span>
                            <div className="text-xl font-bold mt-1">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(customer.customerDetails?.creditLimit || 0)}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400">Risk Sınıfı</span>
                            <div className="mt-1">
                                <span className={`text-xs px-2 py-1 rounded font-medium ${customer.customerDetails?.riskClass === 'A' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                    }`}>
                                    {customer.customerDetails?.riskClass || 'Belirsiz'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
