'use client';

import React from 'react';
import { useProductionSites, useCreateSite } from '@/hooks/use-production-structure';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Factory } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

export function SiteList() {
    const { data: sites, isLoading } = useProductionSites();
    // In a real app, we would select Organization first. 
    // Assuming single organization context or fetches all for demo.

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Üretim Tesisleri (Fabrikalar)</CardTitle>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Tesis Ekle
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tesis Adı</TableHead>
                            <TableHead>Adres</TableHead>
                            <TableHead>Lisans No</TableHead>
                            <TableHead>İstasyon Sayısı</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sites?.map((site) => (
                            <TableRow key={site.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Factory className="h-4 w-4 text-slate-500" />
                                    {site.name}
                                </TableCell>
                                <TableCell>{site.address || '-'}</TableCell>
                                <TableCell>{site.licenseNumber || '-'}</TableCell>
                                <TableCell>{site.workStations?.length || 0}</TableCell>
                            </TableRow>
                        ))}
                        {(!sites || sites.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    Henüz tesis tanımlanmamış.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
