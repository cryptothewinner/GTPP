'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlantStepTree } from './components/plant-step-tree';
import { WorkCenterList } from './components/work-center-list';
import { EquipmentList } from './components/equipment-list';
import { ProcessDefinitionList } from './components/process-definition-list';
import { SiteList } from './components/site-list';
import { StationList } from './components/station-list';

export default function ProductionDefinitionsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Uretim Tanimlamalari</h1>
                <p className="text-muted-foreground">
                    Tesis hiyerarsisi, is merkezleri, ekipmanlar ve surec tanimlarini yonetin.
                </p>
            </div>

            <Tabs defaultValue="plant-hierarchy" className="space-y-4">
                <TabsList className="flex-wrap">
                    <TabsTrigger value="plant-hierarchy">Tesis Hiyerarsisi</TabsTrigger>
                    <TabsTrigger value="work-centers">Is Merkezleri</TabsTrigger>
                    <TabsTrigger value="equipment">Ekipmanlar</TabsTrigger>
                    <TabsTrigger value="process-defs">Surec Tanimlari</TabsTrigger>
                    <TabsTrigger value="sites" className="text-muted-foreground">Tesisler (Eski)</TabsTrigger>
                    <TabsTrigger value="stations" className="text-muted-foreground">Istasyonlar (Eski)</TabsTrigger>
                </TabsList>

                <TabsContent value="plant-hierarchy" className="space-y-4">
                    <PlantStepTree />
                </TabsContent>

                <TabsContent value="work-centers" className="space-y-4">
                    <WorkCenterList />
                </TabsContent>

                <TabsContent value="equipment" className="space-y-4">
                    <EquipmentList />
                </TabsContent>

                <TabsContent value="process-defs" className="space-y-4">
                    <ProcessDefinitionList />
                </TabsContent>

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
