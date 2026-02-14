'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteList } from './components/site-list';
import { StationList } from './components/station-list';

export default function ProductionDefinitionsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Üretim Tanımlamaları</h1>
                <p className="text-muted-foreground">
                    Fabrika, üretim sahası ve istasyon tanımlamalarını yönetin.
                </p>
            </div>

            <Tabs defaultValue="stations" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sites">Üretim Tesisleri</TabsTrigger>
                    <TabsTrigger value="stations">İstasyonlar</TabsTrigger>
                </TabsList>
                <TabsContent value="sites" className="space-y-4">
                    <SiteList />
                </TabsContent>
                <TabsContent value="stations" className="space-y-4">
                    <StationList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
