
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CustomerSalesTab({ customerId }: { customerId: string }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Satış Geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-500 text-sm">
                        Bu müşteriye ait henüz bir satış kaydı bulunmamaktadır.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
