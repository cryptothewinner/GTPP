'use client';

import React from 'react';
import { useWorkStations } from '@/hooks/use-production-structure';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function StationList() {
    const { data: stations, isLoading } = useWorkStations();

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>İş Merkezleri</CardTitle>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Yeni İş Merkezi Ekle
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kod</TableHead>
                            <TableHead>İş Merkezi</TableHead>
                            <TableHead>Hiyerarşi Adımı</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Verimlilik (%)</TableHead>
                            <TableHead>Saatlik Maliyet</TableHead>
                            <TableHead>Ekipman</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stations?.map((station) => (
                            <TableRow key={station.id}>
                                <TableCell className="font-mono">{station.code}</TableCell>
                                <TableCell className="font-medium">{station.name}</TableCell>
                                <TableCell>{station.plantStep?.name || '-'}</TableCell>
                                <TableCell>{station.plantStep?.type || '-'}</TableCell>
                                <TableCell>{Number(station.efficiency || 0)}</TableCell>
                                <TableCell>{Number(station.hourlyCost || 0)}</TableCell>
                                <TableCell>{station._count?.equipment || 0}</TableCell>
                                <TableCell>
                                    <Badge className={station.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-slate-100 text-slate-800 hover:bg-slate-100'}>
                                        {station.isActive ? 'ACTIVE' : 'PASSIVE'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!stations || stations.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                    Henüz iş merkezi tanımlanmamış.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
