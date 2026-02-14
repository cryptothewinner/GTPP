'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderList } from './work-order-list';
import { ProductionCalendar } from './production-calendar';
import { ProductionKanban } from './production-kanban';
import { LayoutList, CalendarRange, KanbanSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function PlanningTabs({ searchTerm, onSearchChange, onEdit }: { searchTerm: string; onSearchChange: (val: string) => void; onEdit: (id: string) => void }) {
    return (
        <Tabs defaultValue="list" className="w-full text-slate-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <TabsList className="grid w-full sm:w-[400px] grid-cols-3 bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger
                        value="list"
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    >
                        <LayoutList className="h-4 w-4" /> Liste
                    </TabsTrigger>
                    <TabsTrigger
                        value="calendar"
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    >
                        <CalendarRange className="h-4 w-4" /> Takvim
                    </TabsTrigger>
                    <TabsTrigger
                        value="kanban"
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    >
                        <KanbanSquare className="h-4 w-4" /> Kanban
                    </TabsTrigger>
                </TabsList>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="İş emri ara..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-white border-slate-200"
                    />
                </div>
            </div>

            <TabsContent value="list" className="mt-0 outline-none">
                <WorkOrderList searchTerm={searchTerm} onEdit={onEdit} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0 h-[650px]">
                <ProductionCalendar onEdit={onEdit} />
            </TabsContent>

            <TabsContent value="kanban" className="mt-0 h-[650px]">
                <ProductionKanban onEdit={onEdit} />
            </TabsContent>
        </Tabs>
    );
}
