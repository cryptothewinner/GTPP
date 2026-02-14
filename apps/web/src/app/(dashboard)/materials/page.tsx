'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { MaterialDataGrid } from '@/components/materials/material-data-grid';

export default function MaterialsPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Page Header */}
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-lightning-blue rounded-md text-white shadow-sm">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Master Data</p>
                        <h1 className="text-2xl font-bold text-slate-800 leading-tight">Malzeme Yönetimi</h1>
                        <p className="text-sm text-slate-500">
                            Tüm hammadde, yarı mamul ve bitmiş ürünlerin listesi ve yönetimi
                        </p>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <MaterialDataGrid />
                </div>
            </div>
        </div>
    );
}
