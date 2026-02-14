'use client';

import React from 'react';
import { useProductionPlans } from '@/hooks/use-production-structure';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { CreatePlanDialog } from './create-plan-dialog';

export function PlanList() {
    const { data: plans, isLoading } = useProductionPlans();

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-800';
            case 'APPROVED': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Üretim Planları</CardTitle>
                <CreatePlanDialog />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kod</TableHead>
                            <TableHead>Plan Adı</TableHead>
                            <TableHead>Başlangıç</TableHead>
                            <TableHead>Bitiş</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Emir Sayısı</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans?.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-mono">{plan.code}</TableCell>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    {plan.name}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(plan.startDate), 'dd MMM yyyy', { locale: tr })}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(plan.endDate), 'dd MMM yyyy', { locale: tr })}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                                </TableCell>
                                <TableCell>{plan._count?.productionOrders || 0}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Detay</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!plans || plans.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    Henüz üretim planı oluşturulmamış.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
