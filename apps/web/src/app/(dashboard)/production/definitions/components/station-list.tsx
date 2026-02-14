'use client';

import React from 'react';
import { useWorkStations, useUpdateStationStatus } from '@/hooks/use-production-structure';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Activity, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function StationList() {
    const { data: stations, isLoading } = useWorkStations();
    const updateStatus = useUpdateStationStatus();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'MAINTENANCE': return 'bg-red-100 text-red-800 hover:bg-red-100';
            case 'CLEANING': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            case 'VALIDATION_PENDING': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            default: return 'bg-slate-100 text-slate-800 hover:bg-slate-100';
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Üretim İstasyonları</CardTitle>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Yeni İstasyon Ekle
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kod</TableHead>
                            <TableHead>İstasyon Adı</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Temiz Oda</TableHead>
                            <TableHead>Kapasite (Gün)</TableHead>
                            <TableHead>Hız (Saat)</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stations?.map((station) => (
                            <TableRow key={station.id}>
                                <TableCell className="font-mono">{station.code}</TableCell>
                                <TableCell className="font-medium">{station.name}</TableCell>
                                <TableCell>{station.type}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{station.cleanroomGrade}</Badge>
                                </TableCell>
                                <TableCell>{station.dailyCapacity}</TableCell>
                                <TableCell>{station.hourlyRate}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(station.status)}>{station.status}</Badge>
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
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    Henüz istasyon tanımlanmamış.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
