
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CustomerFinanceTab({ customer }: { customer: any }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Finansal Bilgiler</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-500">Vergi Dairesi</label>
                            <div className="text-sm">{customer.taxOffice || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">Vergi No</label>
                            <div className="text-sm font-mono">{customer.taxNumber || '-'}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
