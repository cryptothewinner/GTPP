'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, ToolbarProps, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAllProductionOrders } from '@/hooks/use-production-orders';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const locales = {
    'tr-TR': tr,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const STATUS_COLORS: Record<string, string> = {
    DRAFT: '#cbd5e1',      // slate-300
    PLANNED: '#3b82f6',    // blue-500
    IN_PROGRESS: '#f59e0b',// amber-500
    COMPLETED: '#10b981',  // emerald-500
    CANCELLED: '#f43f5e',  // rose-500
};

interface ProductionCalendarProps {
    onEdit: (id: string) => void;
}

const CustomToolbar = ({ label, onNavigate, onView, view }: ToolbarProps) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => onNavigate('PREV')} className="h-8 w-8 bg-white hover:bg-slate-100">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')} className="h-8 bg-white hover:bg-slate-100 font-medium text-xs">
                        Bugün
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onNavigate('NEXT')} className="h-8 w-8 bg-white hover:bg-slate-100">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                    <span className="text-lg font-bold text-slate-700 capitalize">{label}</span>
                </div>
            </div>

            <div className="flex items-center bg-white rounded-md border border-slate-200 p-1 shadow-sm">
                {[
                    { id: 'month', label: 'Ay' },
                    { id: 'week', label: 'Hafta' },
                    { id: 'day', label: 'Gün' },
                    { id: 'agenda', label: 'Ajanda' }
                ].map((v) => (
                    <button
                        key={v.id}
                        onClick={() => onView(v.id as any)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-sm transition-all",
                            view === v.id
                                ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export function ProductionCalendar({ onEdit }: ProductionCalendarProps) {
    const { data: orders, isLoading } = useAllProductionOrders();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const handleNavigate = useCallback((newDate: Date) => setDate(newDate), []);
    const handleViewChange = useCallback((newView: View) => setView(newView), []);

    const events = useMemo(() => {
        if (!orders || !Array.isArray(orders)) return [];
        return orders.map((order: any) => {
            const start = new Date(order.plannedStart);
            const end = new Date(order.plannedEnd);
            // Determine if allDay based on time (00:00)
            const hasTime = (start.getHours() !== 0 || start.getMinutes() !== 0) || (end.getHours() !== 0 || end.getMinutes() !== 0);

            return {
                id: order.id,
                title: `${order.orderNumber} - ${order.product?.name}`,
                start,
                end,
                allDay: !hasTime,
                resource: order,
            };
        });
    }, [orders]);

    const eventPropGetter = (event: any) => {
        const backgroundColor = STATUS_COLORS[event.resource.status] || '#3b82f6';
        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                border: 'none',
                color: event.resource.status === 'DRAFT' ? '#475569' : 'white',
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 5px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            },
        };
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Takvim verileri yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-white p-4 rounded-md shadow-sm border border-slate-200 flex flex-col">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', flex: 1 }}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}

                // Controlled State
                view={view}
                date={date}
                onView={handleViewChange}
                onNavigate={handleNavigate}

                culture="tr-TR"
                messages={{
                    date: 'Tarih',
                    time: 'Zaman',
                    event: 'Olay',
                    allDay: 'Tüm Gün',
                    week: 'Hafta',
                    work_week: 'Çalışma Haftası',
                    day: 'Gün',
                    month: 'Ay',
                    previous: 'Geri',
                    next: 'İleri',
                    today: 'Bugün',
                    agenda: 'Ajanda',
                    noEventsInRange: 'Bu aralıkta etkinlik yok.',
                    showMore: (total) => `+${total} daha fazla`,
                }}
                eventPropGetter={eventPropGetter}
                onSelectEvent={(event: any) => onEdit(event.id)}
                components={{
                    toolbar: CustomToolbar,
                }}
            />
        </div>
    );
}
