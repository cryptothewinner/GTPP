'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import {
    ShoppingBag,
    RefreshCw,
    Plus,
    Loader2,
    TrendingUp,
    BarChart3,
    Tag,
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
import { useProductList, useProductDetail, useUpdateProduct, useCreateProduct, useProductSummary } from '@/hooks/use-products';

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

const fmt = (n: number) => `₺ ${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InventoryProductsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { toast } = useToast();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<Record<string, any>>({});

    const { data: listResult, refetch, isFetching } = useProductList({ page: 1, pageSize: 500 });
    const { data: summaryResult } = useProductSummary();
    const { data: detailResult } = useProductDetail(selectedId);
    const updateProduct = useUpdateProduct();
    const createProduct = useCreateProduct();

    const rows: any[] = listResult?.data ?? [];
    const summary = summaryResult?.data;
    const detail = detailResult && 'data' in detailResult ? detailResult.data : detailResult;

    const [editForm, setEditForm] = useState<Record<string, any>>({});
    useEffect(() => {
        if (detail) setEditForm({ ...detail });
    }, [detail]);

    const totalStockValue = useMemo(() => {
        return rows.reduce((s, r) => s + (Number(r.currentStock) * Number(r.salePrice)), 0);
    }, [rows]);

    const colDefs: ColDef[] = useMemo(() => [
        {
            field: 'code', headerName: 'ÜRÜN KODU', width: 130, pinned: 'left',
            cellStyle: { fontWeight: 600, color: '#0176D3' },
        },
        { field: 'name', headerName: 'ÜRÜN ADI', flex: 1, minWidth: 250 },
        {
            field: 'category', headerName: 'KATEGORİ', width: 140,
            cellRenderer: (p: any) => p.value
                ? <Badge variant="outline" className="text-[10px]">{p.value}</Badge>
                : <span className="text-slate-400">—</span>,
        },
        {
            field: 'currentStock', headerName: 'MEVCUT STOK', width: 130,
            cellStyle: (p: any) => ({ fontWeight: 700, color: Number(p.value) <= 0 ? '#dc2626' : '#1e293b' }),
            valueFormatter: (p: any) => `${Number(p.value).toLocaleString('tr-TR')}`,
        },
        { field: 'unitOfMeasure', headerName: 'BİRİM', width: 80 },
        { field: 'costPrice', headerName: 'MALİYET', width: 130, valueFormatter: (p: any) => fmt(Number(p.value)) },
        { field: 'salePrice', headerName: 'SATIŞ FİYATI', width: 130, valueFormatter: (p: any) => fmt(Number(p.value)) },
        {
            field: 'profitMargin', headerName: 'KAR MARJI', width: 110,
            cellStyle: (p: any) => ({ fontWeight: 600, color: Number(p.value) >= 0 ? '#059669' : '#dc2626' }),
            valueFormatter: (p: any) => p.value != null ? `%${Number(p.value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '—',
        },
        { field: 'batchSize', headerName: 'PARTİ BÜYÜKLÜĞÜ', width: 140, valueFormatter: (p: any) => Number(p.value).toLocaleString('tr-TR') },
        { field: 'barcode', headerName: 'BARKOD', width: 130 },
        {
            field: 'isActive', headerName: 'DURUM', width: 90,
            cellRenderer: (p: any) => (
                <Badge className={p.value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                    {p.value ? 'AKTİF' : 'PASİF'}
                </Badge>
            ),
        },
    ], []);

    const handleSave = useCallback(async () => {
        if (!selectedId) return;
        try {
            await updateProduct.mutateAsync({ id: selectedId, data: editForm });
            toast({ title: 'Kaydedildi', description: 'Ürün güncellendi.' });
        } catch {
            toast({ title: 'Hata', description: 'Güncelleme başarısız.', variant: 'destructive' });
        }
    }, [selectedId, editForm, updateProduct, toast]);

    const handleCreate = useCallback(async () => {
        try {
            await createProduct.mutateAsync(createForm);
            setCreateOpen(false);
            setCreateForm({});
            toast({ title: 'Oluşturuldu', description: 'Ürün eklendi.' });
        } catch {
            toast({ title: 'Hata', description: 'Ürün oluşturulamadı.', variant: 'destructive' });
        }
    }, [createForm, createProduct, toast]);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-purple-600 rounded-md text-white shadow-sm">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Envanter</p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Ürün Stokları</h1>
                            <p className="text-sm text-slate-500">Üretilen ürünlerin stok durumunu ve maliyet analizini takip edin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
                            className="bg-white border-lightning-border text-slate-700 hover:bg-slate-50 h-[32px] px-3 font-semibold">
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                        <Button size="sm" className="bg-lightning-blue hover:bg-lightning-blue-dark text-white h-[32px] px-4 font-bold"
                            onClick={() => setCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Yeni Ürün Ekle
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard label="Toplam Ürün" value={summary?.totalProducts ?? '—'} icon={<ShoppingBag className="w-4 h-4 text-purple-500" />} />
                    <MetricCard
                        label="Ort. Kar Marjı"
                        value={summary?.avgProfitMargin != null ? `%${Number(summary.avgProfitMargin).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '—'}
                        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                    />
                    <MetricCard label="Kategori Sayısı" value={summary?.byCategory?.length ?? '—'} icon={<Tag className="w-4 h-4 text-blue-500" />} />
                    <MetricCard label="Toplam Stok Değeri" value={`₺ ${totalStockValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} icon={<BarChart3 className="w-4 h-4 text-amber-500" />} />
                </div>

                <div className="bg-white rounded border border-lightning-border shadow-sm overflow-hidden" style={{ height: '520px' }}>
                    {mounted && (
                        <AgGridReact
                            theme={themeQuartz}
                            rowData={rows}
                            columnDefs={colDefs}
                            rowSelection="single"
                            onRowClicked={(e) => setSelectedId(e.data?.id ?? null)}
                            defaultColDef={{ sortable: true, resizable: true, filter: true }}
                            getRowId={(p) => p.data.id}
                            overlayLoadingTemplate='<span class="ag-overlay-loading-center">Yükleniyor...</span>'
                            overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Ürün bulunamadı</span>'
                        />
                    )}
                </div>
            </div>

            {/* Detail Sheet */}
            <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
                <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col rounded-l-3xl overflow-hidden">
                    <SheetHeader className="bg-slate-900 text-white px-6 py-5 shrink-0">
                        <SheetTitle className="text-white text-lg font-bold">{detail?.name ?? 'Ürün Detayı'}</SheetTitle>
                        <SheetDescription className="text-slate-400 text-sm">{detail?.code}</SheetDescription>
                        <Badge className={`w-fit mt-1 ${detail?.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                            {detail?.isActive ? 'AKTİF' : 'PASİF'}
                        </Badge>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-4">
                            {[
                                ['ad', 'Ürün Adı', 'text'],
                                ['category', 'Kategori', 'text'],
                                ['unitOfMeasure', 'Birim', 'text'],
                                ['costPrice', 'Maliyet Fiyatı', 'number'],
                                ['salePrice', 'Satış Fiyatı', 'number'],
                                ['profitMargin', 'Kar Marjı (%)', 'number'],
                                ['batchSize', 'Parti Büyüklüğü', 'number'],
                                ['barcode', 'Barkod', 'text'],
                                ['description', 'Açıklama', 'text'],
                            ].map(([key, label, type]) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
                                    <input
                                        type={type}
                                        className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue"
                                        value={editForm[key] ?? ''}
                                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                                    />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-lightning-border bg-white">
                        <Button className="w-full bg-lightning-blue hover:bg-lightning-blue-dark text-white font-bold"
                            onClick={handleSave} disabled={updateProduct.isPending}>
                            {updateProduct.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Kaydet
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Create Sheet */}
            <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col rounded-l-3xl overflow-hidden">
                    <SheetHeader className="bg-slate-900 text-white px-6 py-5 shrink-0">
                        <SheetTitle className="text-white text-lg font-bold">Yeni Ürün Ekle</SheetTitle>
                        <SheetDescription className="text-slate-400 text-sm">Ürün bilgilerini doldurun</SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-4">
                            {[
                                ['code', 'Ürün Kodu', 'text'],
                                ['name', 'Ürün Adı', 'text'],
                                ['category', 'Kategori', 'text'],
                                ['unitOfMeasure', 'Birim', 'text'],
                                ['costPrice', 'Maliyet Fiyatı', 'number'],
                                ['salePrice', 'Satış Fiyatı', 'number'],
                                ['batchSize', 'Parti Büyüklüğü', 'number'],
                                ['barcode', 'Barkod', 'text'],
                                ['description', 'Açıklama', 'text'],
                            ].map(([key, label, type]) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
                                    <input
                                        type={type}
                                        className="w-full border border-lightning-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lightning-blue"
                                        value={createForm[key] ?? ''}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                                    />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-lightning-border bg-white">
                        <Button className="w-full bg-lightning-blue hover:bg-lightning-blue-dark text-white font-bold"
                            onClick={handleCreate} disabled={createProduct.isPending}>
                            {createProduct.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Oluştur
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
