'use client';

import React from 'react';
import { PlanList } from './components/plan-list';

export default function ProductionPlansPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Üretim Planları</h1>
                <p className="text-muted-foreground">
                    Haftalık veya aylık üretim planlarını oluşturun ve takip edin.
                </p>
            </div>

            <PlanList />
        </div>
    );
}
