'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMaterialCheck } from '@/hooks/use-production-orders';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MaterialCheckDialogProps {
    orderId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProceed?: () => void;
}

export function MaterialCheckDialog({ orderId, open, onOpenChange, onProceed }: MaterialCheckDialogProps) {
    const { data: response, isLoading, error } = useMaterialCheck(open ? orderId : null);
    const result = response;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-xl">Malzeme Kontrolü</span>
                        {result && (
                            <Badge variant={result.isAvailable ? 'default' : 'destructive'} className={result.isAvailable ? 'bg-emerald-500' : ''}>
                                {result.orderNumber}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Bu üretim emri için gerekli hammadde stok durumu kontrol ediliyor.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-slate-500">Stoklar kontrol ediliyor...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-8 text-rose-500">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>Bir hata oluştu. Lütfen tekrar deneyin.</p>
                        </div>
                    ) : result ? (
                        <div className="space-y-6">
                            {/* Status Banner */}
                            <div className={`flex items-center gap-4 p-4 rounded-lg border ${result.isAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                                }`}>
                                {result.isAvailable ? (
                                    <div className="p-2 bg-emerald-100 rounded-full">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-rose-100 rounded-full">
                                        <XCircle className="h-6 w-6 text-rose-600" />
                                    </div>
                                )}
                                <div>
                                    <h4 className={`font-semibold ${result.isAvailable ? 'text-emerald-900' : 'text-rose-900'}`}>
                                        {result.isAvailable ? 'Üretime Başlanabilir' : 'Yetersiz Stok'}
                                    </h4>
                                    <p className={`text-sm ${result.isAvailable ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {result.isAvailable
                                            ? 'Gerekli tüm malzemeler stokta mevcut.'
                                            : `${result.missingItems.length} kalem malzemede eksik var.`}
                                    </p>
                                </div>
                            </div>

                            {/* Missing Items List */}
                            {!result.isAvailable && (
                                <div className="border rounded-md">
                                    <div className="bg-slate-50 px-4 py-2 border-b text-xs font-semibold text-slate-500 uppercase">
                                        Eksik Malzemeler
                                    </div>
                                    <ScrollArea className="h-[200px]">
                                        <div className="divide-y">
                                            {result.missingItems.map((item) => (
                                                <div key={item.materialId} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                                                    <div>
                                                        <div className="font-medium text-slate-800">{item.materialName}</div>
                                                        <div className="text-xs text-slate-500">Kod: {item.materialCode}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-rose-600">
                                                            -{item.missing.toLocaleString('tr-TR')} {item.unit}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            Mevcut: {item.available.toLocaleString('tr-TR')} / Gerekli: {item.required.toLocaleString('tr-TR')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Vazgeç
                    </Button>
                    <Button
                        onClick={() => {
                            onProceed?.();
                            onOpenChange(false);
                        }}
                        disabled={!result?.isAvailable}
                        className={result?.isAvailable ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                        {result?.isAvailable ? 'Üretimi Başlat' : 'Eksikleri Tamamla'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
