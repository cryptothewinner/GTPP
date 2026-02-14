'use client';

import { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import {
    ArrowLeftRight,
    RefreshCw,
    Download,
    Plus,
    Calendar,
    ArrowDownCircle,
    ArrowUpCircle,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useStockMovementList, useStockMovementSummary, useCreateStockMovement } from '@/hooks/use-stock-movements';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function MetricCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
    return (
        <div className="bg-white p-4 border border-lightning-border rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    );
}

const movementTypeLabels: Record<string, string> = {
    INBOUND: 'GİRİŞ',
    OUTBOUND: 'ÇIKIŞ',
    PRODUCTION_IN: 'ÜR. GİRİŞ',
    PRODUCTION_OUT: 'ÜR. ÇIKIŞ',
    ADJUSTMENT: 'DÜZELTME',
    TRANSFER: 'TRANSFER',
    RETURN: 'İADE',
    WASTE: 'FİRE',
};

const movementTypeBadge: Record<string, string> = {
    INBOUND: 'bg-emerald-100 text-emerald-700',
    OUTBOUND: 'bg-rose-100 text-rose-700',
    PRODUCTION_IN: 'bg-blue-100 text-blue-700',
    PRODUCTION_OUT: 'bg-indigo-100 text-indigo-700',
    ADJUSTMENT: 'bg-amber-100 text-amber-700',
    TRANSFER: 'bg-slate-100 text-slate-700',
    RETURN: 'bg-teal-100 text-teal-700',
    WASTE: 'bg-red-100 text-red-700',
};

const isInbound = (type: string) => ['INBOUND', 'PRODUCTION_IN', 'RETURN'].includes(type);

export default function StockMovementsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { toast } = useToast();
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState<Record<string, any>>({ type: 'INBOUND', unit: 'Kg', quantity: 0 });

    const { data: listResult, refetch, isFetching } = useStockMovementList({ page: 1, pageSize: 500, search, type: typeFilter });
    const { data: summaryResult } = useStockMovementSummary();
    const createMovement = useCreateStockMovement();

    const { data: materialsResult } = useQuery({
        queryKey: ['materials', 'list', { page: 1, pageSize: 500 }],
        queryFn: () => apiClient.get<any>('/materials?page=1&pageSize=500'),
        staleTime: 60 * 1000,
    });

    const { data: batchesResult } = useQuery({
        queryKey: ['material-batches', 'list', { page: 1, pageSize: 500 }],
        queryFn: () => apiClient.get<any>('/material-batches?page=1&pageSize=500'),
        enabled: !!form.materialId,
        staleTime: 30 * 1000,
    });

    const rows: any[] = listResult?.data ?? [];
    const summary = summaryResult?.data;
    const materials: any[] = materialsResult?.data ?? [];
    const batches: any[] = (batchesResult?.data ?? []).filter((b: any) => b.materialId === form.materialId);

    const colDefs: ColDef[] = useMemo(() => [
        { field: 'movementNumber', headerName: 'HAREKET NO', width: 180, pinned: 'left', cellStyle: { fontWeight: 600, color: '#1e293b' } },
        {
            field: 'createdAt', headerName: 'TARİH', width: 160,
            valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
        },
        {
            field: 'type', headerName: 'TİP', width: 120,
            cellRenderer: (p: any) => (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${movementTypeBadge[p.value] ?? 'bg-slate-100 text-slate-600'}`}>
                    {movementTypeLabels[p.value] ?? p.value}
                </span>
            ),
        },
        {
            headerName: 'MALZEME/ÜRÜN', flex: 1, minWidth: 200,
            valueGetter: (p: any) => p.data?.material?.name ?? p.data?.product?.name ?? '—',
        },
        {
            field: 'quantity', headerName: 'MİKTAR', width: 130,
            cellRenderer: (p: any) => {
                const inb = isInbound(p.data?.type);
                return (
                    <span className={`font-bold ${inb ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {inb ? '+' : '-'}{Number(p.value).toLocaleString('tr-TR')} {p.data?.unit}
                    </span>
                );
            },
        },
        { field: 'previousStock', headerName: 'ÖNCEKİ STOK', width: 120, valueFormatter: (p: any) => p.value != null ? Number(p.value).toLocaleString('tr-TR') : '—', cellStyle: { color: '#94a3b8', fontWeight: 400 } },
        { field: 'newStock', headerName: 'YENİ STOK', width: 120, valueFormatter: (p: any) => p.value != null ? Number(p.value).toLocaleString('tr-TR') : '—', cellStyle: { fontWeight: 700, color: '#1e293b' } },
        { field: 'unitPrice', headerName: 'BİRİM FİYAT', width: 120, valueFormatter: (p: any) => p.value != null ? `₺ ${Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '—' },
        { field: 'totalValue', headerName: 'TOPLAM DEĞER', width: 130, valueFormatter: (p: any) => p.value != null ? `₺ ${Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '—', cellStyle: { fontWeight: 700, color: '#1e293b' } },
        { field: 'referenceType', headerName: 'REFERANS', width: 120, valueFormatter: (p: any) => [p.value, p.data?.referenceId].filter(Boolean).join(' #') || '—' },
        { field: 'description', headerName: 'AÇIKLAMA', flex: 1, minWidth: 160 },
        { field: 'performedBy', headerName: 'İŞLEMİ YAPAN', width: 140 },
    ], []);

    const handleCreate = async () => {
        try {
            await createMovement.mutateAsync(form);
            setCreateOpen(false);
            setForm({ type: 'INBOUND', unit: 'Kg', quantity: 0 });
            toast({ title: 'Kaydedildi', description: 'Stok hareketi oluşturuldu.' });
        } catch {
            toast({ title: 'Hata', description: 'Hareket oluşturulamadı.', variant: 'destructive' });
        }
    };

    const setField = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-700 rounded-md text-white shadow-sm">
                            <ArrowLeftRight className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Envanter</p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Stok Hareketleri</h1>
                            <p className="text-sm text-slate-500">Tüm mal giriş-çıkış hareketlerini ve stok değişikliklerini takip edin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
                            className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
                            <Download className="w-4 h-4 mr-2" />
                            Dışa Aktar
                        </Button>
                        <Button size="sm" className="bg-lightning-blue hover:bg-lightning-blue-dark text-white h-[32px] px-4 font-bold"
                            onClick={() => setCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Yeni Hareket
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard label="Toplam Hareket" value={summary?.totalMovements ?? '—'} icon={<ArrowLeftRight className="w-4 h-4 text-blue-500" />} />
                    <MetricCard label="Bugünkü Hareket" value={summary?.todayMovements ?? 0} icon={<Calendar className="w-4 h-4 text-purple-500" />} />
                    <MetricCard label="Giriş Değeri" value={`₺ ${(summary?.totalInboundValue ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} icon={<ArrowDownCircle className="w-4 h-4 text-emerald-500" />} />
                    <MetricCard label="Çıkış Değeri" value={`₺ ${(summary?.totalOutboundValue ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} icon={<ArrowUpCircle className="w-4 h-4 text-rose-500" />} />
                </div>

                {/* Filtre Bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        placeholder="Hareket no, açıklama veya referans ara..."
                        className="border border-lightning-border rounded px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-1 focus:ring-lightning-blue"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="border border-lightning-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue bg-white"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">Tüm Tipler</option>
                        {Object.entries(movementTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>

                {/* Grid */}
                <div className="bg-white rounded border border-lightning-border shadow-sm overflow-hidden" style={{ height: '520px' }}>
                    {mounted && (
                        <AgGridReact
                            theme={themeQuartz}
                            rowData={rows}
                            columnDefs={colDefs}
                            defaultColDef={{ sortable: true, resizable: true, filter: true }}
                            getRowId={(p) => p.data.id}
                        />
                    )}
                </div>
            </div>

            {/* Create Sheet */}
            <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col rounded-l-3xl overflow-hidden">
                    <SheetHeader className="bg-slate-900 text-white px-6 py-5 shrink-0">
                        <SheetTitle className="text-white text-lg font-bold">Yeni Stok Hareketi</SheetTitle>
                        <SheetDescription className="text-slate-400 text-sm">Mal giriş veya çıkış hareketi kaydedin</SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Hareket Tipi *</label>
                                <select className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue bg-white"
                                    value={form.type} onChange={(e) => setField('type', e.target.value)}>
                                    {Object.entries(movementTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Malzeme</label>
                                <select className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue bg-white"
                                    value={form.materialId ?? ''} onChange={(e) => setField('materialId', e.target.value || undefined)}>
                                    <option value="">Seçiniz...</option>
                                    {materials.map((m: any) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                                </select>
                            </div>
                            {batches.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Parti (opsiyonel)</label>
                                    <select className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue bg-white"
                                        value={form.materialBatchId ?? ''} onChange={(e) => setField('materialBatchId', e.target.value || undefined)}>
                                        <option value="">Tümü</option>
                                        {batches.map((b: any) => <option key={b.id} value={b.id}>{b.batchNumber} ({Number(b.remainingQuantity).toLocaleString('tr-TR')})</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Miktar *</label>
                                    <input type="number" className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue"
                                        value={form.quantity} onChange={(e) => setField('quantity', Number(e.target.value))} min={0} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Birim</label>
                                    <select className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue bg-white"
                                        value={form.unit} onChange={(e) => setField('unit', e.target.value)}>
                                        {['Kg', 'g', 'mg', 'Lt', 'Adet', 'ml'].map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Birim Fiyat (₺)</label>
                                <input type="number" className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue"
                                    value={form.unitPrice ?? ''} onChange={(e) => setField('unitPrice', e.target.value ? Number(e.target.value) : undefined)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Referans (PO No, Sipariş vb.)</label>
                                <input type="text" className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue"
                                    value={form.referenceId ?? ''} onChange={(e) => setField('referenceId', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Açıklama</label>
                                <textarea rows={3} className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue resize-none"
                                    value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} />
                            </div>
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-lightning-border bg-white">
                        <Button className="w-full bg-lightning-blue hover:bg-lightning-blue-dark text-white font-bold"
                            onClick={handleCreate} disabled={createMovement.isPending || !form.materialId || !form.quantity}>
                            {createMovement.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Kaydet
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
