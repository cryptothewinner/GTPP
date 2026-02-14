'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    useRecipeDetail,
    useAddRecipeItem,
    useRemoveRecipeItem,
    useRecalculateCost,
    useUpdateRecipe,
} from '@/hooks/use-recipes';
import { apiClient } from '@/lib/api-client';
import {
    BookOpen,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    CheckCircle,
    ClipboardList,
    DollarSign,
    FlaskConical,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecipeDetailSheetProps {
    recipeId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRefresh?: () => void;
}

type TabKey = 'formulation' | 'production' | 'cost';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RecipeDetailSheet({ recipeId, open, onOpenChange, onRefresh }: RecipeDetailSheetProps) {
    const { toast } = useToast();

    /* ---------- data ---------- */
    const { data: recipeResponse, isLoading } = useRecipeDetail(open ? recipeId : null);
    const raw = recipeResponse as any;
    const recipe = raw ? ('data' in raw ? raw.data : raw) : null;
    const items: any[] = recipe?.items ?? [];

    /* ---------- tabs ---------- */
    const [activeTab, setActiveTab] = useState<TabKey>('formulation');

    /* ---------- add item dialog ---------- */
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        materialId: '',
        quantity: '',
        unit: '',
        wastagePercent: '0',
        notes: '',
    });

    /* ---------- delete confirm ---------- */
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

    /* ---------- edit production info ---------- */
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Record<string, any>>({});

    /* ---------- mutations ---------- */
    const addItem = useAddRecipeItem();
    const removeItem = useRemoveRecipeItem();
    const recalculate = useRecalculateCost();
    const updateRecipe = useUpdateRecipe();

    /* ---------- materials for dropdown ---------- */
    const { data: materialsData } = useQuery({
        queryKey: ['materials', 'dropdown'],
        queryFn: () => apiClient.get<any>('/materials?pageSize=500'),
        enabled: addItemOpen,
    });
    const materials: any[] = (materialsData as any)?.data ?? [];

    /* ---------- handlers ---------- */
    function handleMaterialSelect(materialId: string) {
        const mat = materials.find(m => m.id === materialId);
        setAddForm(f => ({
            ...f,
            materialId,
            unit: mat?.unitOfMeasure ?? f.unit,
        }));
    }

    async function handleAddItem() {
        if (!recipeId || !addForm.materialId || !addForm.quantity) {
            toast({ title: 'Hata', description: 'Malzeme ve miktar zorunludur.', variant: 'destructive' });
            return;
        }
        try {
            await addItem.mutateAsync({
                recipeId,
                data: {
                    materialId: addForm.materialId,
                    quantity: Number(addForm.quantity),
                    unit: addForm.unit,
                    wastagePercent: Number(addForm.wastagePercent) || 0,
                    notes: addForm.notes || undefined,
                },
            });
            toast({ title: 'Başarılı', description: 'Malzeme reçeteye eklendi.' });
            setAddItemOpen(false);
            setAddForm({ materialId: '', quantity: '', unit: '', wastagePercent: '0', notes: '' });
        } catch {
            toast({ title: 'Hata', description: 'Malzeme eklenirken hata oluştu.', variant: 'destructive' });
        }
    }

    async function handleDeleteItem() {
        if (!recipeId || !deleteItemId) return;
        try {
            await removeItem.mutateAsync({ recipeId, itemId: deleteItemId });
            toast({ title: 'Başarılı', description: 'Malzeme reçeteden silindi.' });
            setDeleteItemId(null);
        } catch {
            toast({ title: 'Hata', description: 'Silme sırasında hata oluştu.', variant: 'destructive' });
        }
    }

    async function handleRecalculate() {
        if (!recipeId) return;
        try {
            await recalculate.mutateAsync(recipeId);
            toast({ title: 'Başarılı', description: 'Maliyet yeniden hesaplandı.' });
        } catch {
            toast({ title: 'Hata', description: 'Hesaplama sırasında hata oluştu.', variant: 'destructive' });
        }
    }

    function handleStartEdit() {
        setEditForm({
            instructions: recipe?.instructions ?? '',
            batchSize: recipe?.batchSize ?? '',
            batchUnit: recipe?.batchUnit ?? '',
            version: recipe?.version ?? '',
            currency: recipe?.currency ?? 'TRY',
            approvedBy: recipe?.approvedBy ?? '',
        });
        setEditMode(true);
    }

    async function handleSaveEdit() {
        if (!recipeId) return;
        try {
            await updateRecipe.mutateAsync({ id: recipeId, data: editForm });
            toast({ title: 'Başarılı', description: 'Reçete bilgileri güncellendi.' });
            setEditMode(false);
            onRefresh?.();
        } catch {
            toast({ title: 'Hata', description: 'Güncelleme sırasında hata oluştu.', variant: 'destructive' });
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Tab content: Formulation                                           */
    /* ------------------------------------------------------------------ */

    function FormulationTab() {
        const totalCost = Number(recipe?.totalCost) || 0;
        const batchSize = Number(recipe?.batchSize) || 1;

        return (
            <div className="space-y-4">
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parti Büyüklüğü</div>
                        <div className="text-lg font-bold text-slate-800">
                            {Number(recipe?.batchSize ?? 0).toLocaleString('tr-TR')}
                            <span className="text-sm font-normal text-slate-500 ml-1">{recipe?.batchUnit}</span>
                        </div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Toplam Maliyet</div>
                        <div className="text-lg font-bold text-emerald-700">
                            ₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Toplam Malzeme</div>
                        <div className="text-lg font-bold text-blue-700">{items.length} kalem</div>
                    </div>
                </div>

                {/* Items table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2.5 font-bold text-slate-500 w-8">#</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500">İÇERİK (HAMMADDE)</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500 text-right">BİRİM FİYAT</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500 text-right">MİKTAR</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500 text-center">BİRİM</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500 text-center">FİRE %</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500 text-right">SATIR MALİYETİ</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500">STOK</th>
                                <th className="px-3 py-2.5 font-bold text-slate-500 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-3 py-8 text-center text-slate-400 italic">
                                        Henüz malzeme eklenmemiş
                                    </td>
                                </tr>
                            ) : (
                                items.map((item: any, idx: number) => {
                                    const stock = Number(item.material?.currentStock) || 0;
                                    const minStock = Number(item.material?.minStockLevel) || 0;
                                    const stockOk = stock > minStock;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 group">
                                            <td className="px-3 py-2.5 text-slate-400 font-medium">{idx + 1}</td>
                                            <td className="px-3 py-2.5 font-semibold text-slate-800">
                                                {item.material?.name ?? '—'}
                                                {item.notes && (
                                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{item.notes}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-slate-600">
                                                {item.unitCost != null
                                                    ? `₺${Number(item.unitCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                                                    : item.material?.unitPrice != null
                                                    ? `₺${Number(item.material.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                                                {Number(item.quantity).toLocaleString('tr-TR')}
                                            </td>
                                            <td className="px-3 py-2.5 text-center text-slate-500">{item.unit}</td>
                                            <td className="px-3 py-2.5 text-center text-slate-500">
                                                {item.wastagePercent != null ? `%${item.wastagePercent}` : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                                                {item.totalCost != null
                                                    ? `₺${Number(item.totalCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`font-medium ${stockOk ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {stock.toLocaleString('tr-TR')} {item.material?.unitOfMeasure}
                                                    {stockOk ? ' ✓' : ' ⚠'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setDeleteItemId(item.id)}
                                                        className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {items.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-100 border-t-2 border-slate-200">
                                    <td colSpan={6} className="px-3 py-2.5 font-bold text-slate-700 text-right">TOPLAM MALİYET</td>
                                    <td className="px-3 py-2.5 font-black text-slate-900 text-right">
                                        ₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Add button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="border-dashed border-[#38b2ac] text-[#38b2ac] hover:bg-[#38b2ac]/5 hover:text-[#38b2ac]"
                    onClick={() => setAddItemOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Malzeme Ekle
                </Button>
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Tab content: Production Info                                       */
    /* ------------------------------------------------------------------ */

    function ProductionTab() {
        if (editMode) {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Parti Büyüklüğü</Label>
                            <Input
                                type="number"
                                value={editForm.batchSize}
                                onChange={e => setEditForm(f => ({ ...f, batchSize: e.target.value }))}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Parti Birimi</Label>
                            <Input
                                value={editForm.batchUnit}
                                onChange={e => setEditForm(f => ({ ...f, batchUnit: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder="Kg, Lt, Adet..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Versiyon</Label>
                            <Input
                                value={editForm.version}
                                onChange={e => setEditForm(f => ({ ...f, version: e.target.value }))}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Para Birimi</Label>
                            <Input
                                value={editForm.currency}
                                onChange={e => setEditForm(f => ({ ...f, currency: e.target.value }))}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs text-slate-500">Onaylayan</Label>
                            <Input
                                value={editForm.approvedBy}
                                onChange={e => setEditForm(f => ({ ...f, approvedBy: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder="Onaylayan kişi adı"
                            />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs text-slate-500">Üretim Talimatları</Label>
                            <Textarea
                                value={editForm.instructions}
                                onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))}
                                rows={5}
                                className="text-sm resize-none"
                                placeholder="Üretim adımları ve özel talimatlar..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-[#38b2ac] hover:bg-[#2c9a94] text-white"
                            onClick={handleSaveEdit}
                            disabled={updateRecipe.isPending}
                        >
                            {updateRecipe.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditMode(false)}
                        >
                            İptal
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEdit}
                        className="border-lightning-border text-slate-600 h-8"
                    >
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Düzenle
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Parti Büyüklüğü" value={`${Number(recipe?.batchSize ?? 0).toLocaleString('tr-TR')} ${recipe?.batchUnit ?? ''}`} />
                    <InfoRow label="Versiyon" value={recipe?.version ? `v${recipe.version}` : '—'} />
                    <InfoRow label="Para Birimi" value={recipe?.currency ?? '—'} />
                    <InfoRow label="Durum" value={
                        <Badge className={`text-[10px] font-bold rounded-sm border-none ${recipe?.isActive ? 'bg-emerald-500' : 'bg-slate-300 text-slate-600'}`}>
                            {recipe?.isActive ? 'AKTİF' : 'PASİF'}
                        </Badge>
                    } />
                    <InfoRow
                        label="Onaylayan"
                        value={recipe?.approvedBy
                            ? <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />{recipe.approvedBy}</span>
                            : <span className="text-amber-600">Bekliyor</span>}
                    />
                    <InfoRow
                        label="Onay Tarihi"
                        value={recipe?.approvedAt ? new Date(recipe.approvedAt).toLocaleDateString('tr-TR') : '—'}
                    />
                </div>

                {recipe?.instructions && (
                    <>
                        <Separator />
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <ClipboardList className="w-3.5 h-3.5" />
                                Üretim Talimatları
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {recipe.instructions}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Tab content: Cost Analysis                                         */
    /* ------------------------------------------------------------------ */

    function CostTab() {
        const totalCost = Number(recipe?.totalCost) || 0;
        const batchSize = Number(recipe?.batchSize) || 1;
        const unitCost = totalCost / batchSize;

        return (
            <div className="space-y-4">
                {/* Key cost figures */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Toplam Maliyet</div>
                        <div className="text-2xl font-black text-emerald-700">
                            ₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-emerald-600/70 mt-1">{recipe?.batchSize} {recipe?.batchUnit} parti</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Birim Başına Maliyet</div>
                        <div className="text-2xl font-black text-blue-700">
                            ₺{unitCost.toLocaleString('tr-TR', { minimumFractionDigits: 4 })}
                        </div>
                        <div className="text-xs text-blue-600/70 mt-1">1 {recipe?.batchUnit} başına</div>
                    </div>
                </div>

                {/* Cost breakdown */}
                {items.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            Malzeme Maliyet Dağılımı
                        </div>
                        <div className="space-y-2">
                            {items
                                .filter(item => item.totalCost != null)
                                .sort((a, b) => Number(b.totalCost) - Number(a.totalCost))
                                .map((item: any) => {
                                    const cost = Number(item.totalCost) || 0;
                                    const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                                    return (
                                        <div key={item.id} className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-slate-700 truncate max-w-[60%]">
                                                    {item.material?.name ?? '—'}
                                                </span>
                                                <span className="font-bold text-slate-800">
                                                    ₺{cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    <span className="text-slate-400 font-normal ml-1">({pct.toFixed(1)}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#38b2ac] rounded-full transition-all"
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                <Separator />

                <Button
                    variant="outline"
                    size="sm"
                    className="border-lightning-border text-slate-600 h-8"
                    onClick={handleRecalculate}
                    disabled={recalculate.isPending}
                >
                    {recalculate.isPending
                        ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                    Maliyeti Yeniden Hesapla
                </Button>
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Render                                                              */
    /* ------------------------------------------------------------------ */

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-4xl overflow-hidden flex flex-col p-0 border-none rounded-l-3xl shadow-2xl">
                    {/* Dark header */}
                    <div className="bg-slate-900 text-white p-8 flex-shrink-0 relative overflow-hidden">
                        <div className="relative z-10">
                            <SheetHeader>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-[#38b2ac]/20 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-[#38b2ac]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <SheetTitle className="text-2xl font-black text-white truncate">
                                            {isLoading ? 'Yükleniyor...' : recipe?.code ?? 'Reçete Detayı'}
                                        </SheetTitle>
                                        <SheetDescription className="text-slate-400 font-medium mt-0.5">
                                            {recipe?.name ?? ''}
                                        </SheetDescription>
                                    </div>
                                    {recipe && (
                                        <Badge
                                            className={`flex-shrink-0 border-none font-bold ${recipe.isActive ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-600'}`}
                                        >
                                            {recipe.isActive ? 'AKTİF' : 'PASİF'}
                                        </Badge>
                                    )}
                                </div>
                                {recipe?.product && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500">Ürün:</span>
                                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 bg-slate-800">
                                            {recipe.product.name}
                                        </Badge>
                                        {recipe.version && (
                                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 bg-slate-800">
                                                v{recipe.version}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </SheetHeader>
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#38b2ac]/20 blur-3xl rounded-full -mr-20 -mt-20" />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
                        {([
                            { key: 'formulation', label: 'Formülasyon', icon: <FlaskConical className="w-3.5 h-3.5" /> },
                            { key: 'production', label: 'Üretim Bilgileri', icon: <ClipboardList className="w-3.5 h-3.5" /> },
                            { key: 'cost', label: 'Maliyet Analizi', icon: <DollarSign className="w-3.5 h-3.5" /> },
                        ] as { key: TabKey; label: string; icon: React.ReactNode }[]).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                                    activeTab === tab.key
                                        ? 'border-[#38b2ac] text-[#38b2ac]'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1 bg-white">
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-[#38b2ac]" />
                                    <p className="text-slate-500 font-medium animate-pulse">Reçete verileri getiriliyor...</p>
                                </div>
                            ) : !recipe ? (
                                <div className="text-center py-24">
                                    <p className="text-slate-400 italic">Reçete bulunamadı.</p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'formulation' && <FormulationTab />}
                                    {activeTab === 'production' && <ProductionTab />}
                                    {activeTab === 'cost' && <CostTab />}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Add Item Dialog */}
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Malzeme Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600">Malzeme</Label>
                            <Select value={addForm.materialId} onValueChange={handleMaterialSelect}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Malzeme seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {materials.map((m: any) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.code} — {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">Miktar</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={addForm.quantity}
                                    onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">Birim</Label>
                                <Input
                                    placeholder="Kg, mg, adet..."
                                    value={addForm.unit}
                                    onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                                    className="h-9"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600">Fire Oranı (%)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={addForm.wastagePercent}
                                onChange={e => setAddForm(f => ({ ...f, wastagePercent: e.target.value }))}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600">Notlar (opsiyonel)</Label>
                            <Input
                                placeholder="Ek notlar..."
                                value={addForm.notes}
                                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                                className="h-9"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setAddItemOpen(false)}>İptal</Button>
                        <Button
                            size="sm"
                            className="bg-[#38b2ac] hover:bg-[#2c9a94] text-white"
                            onClick={handleAddItem}
                            disabled={addItem.isPending}
                        >
                            {addItem.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                            Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteItemId} onOpenChange={(o) => !o && setDeleteItemId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Malzemeyi Sil</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 py-2">
                        Bu malzemeyi reçeteden silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeleteItemId(null)}>İptal</Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDeleteItem}
                            disabled={removeItem.isPending}
                        >
                            {removeItem.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  InfoRow                                                            */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
            <div className="text-sm font-semibold text-slate-800">{value}</div>
        </div>
    );
}
