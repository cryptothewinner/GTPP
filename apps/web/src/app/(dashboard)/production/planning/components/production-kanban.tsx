'use client';

import React, { useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAllProductionOrders, useUpdateProductionOrder } from '@/hooks/use-production-orders';
import { Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLUMNS = [
    { id: 'DRAFT', title: 'Taslak', color: 'bg-slate-100 border-slate-200' },
    { id: 'PLANNED', title: 'Planlandı', color: 'bg-blue-50 border-blue-200' },
    { id: 'IN_PROGRESS', title: 'Devam Ediyor', color: 'bg-amber-50 border-amber-200' },
    { id: 'COMPLETED', title: 'Tamamlandı', color: 'bg-emerald-50 border-emerald-200' },
];

export function ProductionKanban({ onEdit }: { onEdit: (id: string) => void }) {
    const { data: orders, isLoading } = useAllProductionOrders();
    const updateMutation = useUpdateProductionOrder();
    const { toast } = useToast();

    // Internal state for optimistic updates could be added, but for now rely on mutation success/invalidate
    // Though for dnd, optimistic is better.
    // Let's keep it simple: server update triggers refresh.

    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const itemsByStatus = useMemo(() => {
        const groups: Record<string, any[]> = {
            DRAFT: [],
            PLANNED: [],
            IN_PROGRESS: [],
            COMPLETED: [],
        };
        if (orders) {
            orders.forEach((order: any) => {
                if (groups[order.status]) {
                    groups[order.status].push(order);
                }
            });
        }
        return groups;
    }, [orders]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the order
        const order = orders.find((o: any) => o.id === activeId);
        if (!order) return;

        // Determine new status
        // If dropped on a column container (id is status)
        let newStatus = overId;

        // If dropped on another card item, find its status
        if (!STATUS_COLUMNS.find(c => c.id === newStatus)) {
            const overOrder = orders.find((o: any) => o.id === overId);
            if (overOrder) {
                newStatus = overOrder.status;
            } else {
                return; // Can't determine
            }
        }

        if (order.status !== newStatus) {
            try {
                await updateMutation.mutateAsync({
                    id: activeId,
                    data: { status: newStatus },
                });
                toast({ title: 'Durum Güncellendi', description: `Sipariş durumu ${newStatus} olarak değiştirildi.` });
            } catch (error) {
                toast({ title: 'Hata', description: 'Durum güncellenemedi.', variant: 'destructive' });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Kanban verileri yükleniyor...</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[650px] gap-4 overflow-x-auto pb-4">
                {STATUS_COLUMNS.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        headerColor={column.color}
                        items={itemsByStatus[column.id] || []}
                        onEdit={onEdit}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeId ? (
                    <KanbanCard order={orders.find((o: any) => o.id === activeId)} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({ id, title, headerColor, items, onEdit }: any) {
    const { setNodeRef } = useSortable({
        id: id,
        data: {
            type: 'Column',
        },
    });

    return (
        <div ref={setNodeRef} className="flex flex-col w-80 min-w-[320px] bg-slate-50 rounded-lg border border-slate-200 h-full">
            <div className={`p-3 border-b flex items-center justify-between rounded-t-lg ${headerColor} bg-opacity-50`}>
                <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
                <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-200">
                    {items.length}
                </Badge>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-2">
                <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((order: any) => (
                        <SortableKanbanCard key={order.id} order={order} onEdit={onEdit} />
                    ))}
                </SortableContext>
                {items.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                        Boş
                    </div>
                )}
            </div>
        </div>
    );
}

function SortableKanbanCard({ order, onEdit }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: order.id,
        data: {
            type: 'Card',
            order,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <KanbanCard order={order} onClick={() => onEdit(order.id)} />
        </div>
    );
}

function KanbanCard({ order, onClick, isOverlay }: any) {
    return (
        <Card
            className={`cursor-pointer hover:shadow-md transition-all border-slate-200 bg-white ${isOverlay ? 'shadow-xl rotate-2 cursor-grabbing' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {order.orderNumber}
                    </span>
                    {order.isLate && <AlertCircle className="w-4 h-4 text-amber-500" />}
                </div>
                <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2">
                    {order.product?.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{Number(order.plannedQuantity).toLocaleString('tr-TR')} Adet</span>
                    <span>{new Date(order.plannedStart).toLocaleDateString('tr-TR')}</span>
                </div>
                {/* 
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                     Progress bar or users avatars could go here
                </div> 
                */}
            </CardContent>
        </Card>
    );
}
