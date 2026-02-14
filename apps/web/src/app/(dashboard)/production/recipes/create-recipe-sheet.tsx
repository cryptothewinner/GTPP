'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCreateRecipe } from '@/hooks/use-recipes';
import { apiClient } from '@/lib/api-client';
import { BookOpen, Loader2, Plus, Trash2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const recipeItemSchema = z.object({
    materialId: z.string().min(1, 'Malzeme seçimi zorunludur'),
    quantity: z.coerce.number().positive('Miktar 0\'dan büyük olmalıdır'),
    unit: z.string().min(1, 'Birim zorunludur'),
    wastagePercent: z.coerce.number().min(0).max(100).default(0),
    notes: z.string().optional(),
});

const formSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(1, 'Reçete adı zorunludur'),
    productId: z.string().min(1, 'Ürün seçimi zorunludur'),
    batchSize: z.coerce.number().positive('Parti büyüklüğü 0\'dan büyük olmalıdır'),
    batchUnit: z.string().min(1, 'Parti birimi zorunludur'),
    version: z.string().optional().default('1'),
    instructions: z.string().optional(),
    items: z.array(recipeItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CreateRecipeSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Batch unit options                                                 */
/* ------------------------------------------------------------------ */

const BATCH_UNITS = ['Kg', 'g', 'mg', 'Lt', 'mL', 'Adet', 'Tablet', 'Kapsül', 'Kutu'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CreateRecipeSheet({ open, onOpenChange, onSuccess }: CreateRecipeSheetProps) {
    const { toast } = useToast();
    const createRecipe = useCreateRecipe();

    /* ---------- data for dropdowns ---------- */
    const { data: productsData } = useQuery({
        queryKey: ['products', 'dropdown'],
        queryFn: () => apiClient.get<any>('/products?pageSize=500'),
        enabled: open,
    });
    const products: any[] = (productsData as any)?.data ?? [];

    const { data: materialsData } = useQuery({
        queryKey: ['materials', 'dropdown'],
        queryFn: () => apiClient.get<any>('/materials?pageSize=500'),
        enabled: open,
    });
    const materials: any[] = (materialsData as any)?.data ?? [];

    /* ---------- form ---------- */
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: '',
            name: '',
            productId: '',
            batchSize: 1,
            batchUnit: 'Kg',
            version: '1',
            instructions: '',
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    function handleMaterialSelect(index: number, materialId: string) {
        const mat = materials.find(m => m.id === materialId);
        form.setValue(`items.${index}.materialId`, materialId);
        if (mat?.unitOfMeasure) {
            form.setValue(`items.${index}.unit`, mat.unitOfMeasure);
        }
    }

    function addItemRow() {
        append({ materialId: '', quantity: 0, unit: '', wastagePercent: 0, notes: '' });
    }

    async function onSubmit(values: FormValues) {
        try {
            const payload: Record<string, any> = {
                name: values.name,
                productId: values.productId,
                batchSize: values.batchSize,
                batchUnit: values.batchUnit,
                version: values.version || '1',
                instructions: values.instructions || undefined,
                items: values.items.map(item => ({
                    materialId: item.materialId,
                    quantity: item.quantity,
                    unit: item.unit,
                    wastagePercent: item.wastagePercent ?? 0,
                    notes: item.notes || undefined,
                })),
            };
            if (values.code?.trim()) {
                payload.code = values.code.trim();
            }

            await createRecipe.mutateAsync(payload);
            toast({ title: 'Başarılı', description: 'Yeni reçete oluşturuldu.' });
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message || 'Reçete oluşturulurken hata oluştu.',
                variant: 'destructive',
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Render                                                              */
    /* ------------------------------------------------------------------ */

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0 border-none rounded-l-3xl shadow-2xl">
                {/* Dark header */}
                <div className="bg-slate-900 text-white p-8 flex-shrink-0 relative overflow-hidden">
                    <div className="relative z-10">
                        <SheetHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-2 bg-[#38b2ac]/20 rounded-xl">
                                    <BookOpen className="w-6 h-6 text-[#38b2ac]" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-black text-white">Yeni Reçete</SheetTitle>
                                    <SheetDescription className="text-slate-400 font-medium mt-0.5">
                                        Ürün formülasyonu ve malzeme listesini tanımlayın
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#38b2ac]/20 blur-3xl rounded-full -mr-20 -mt-20" />
                </div>

                {/* Form */}
                <ScrollArea className="flex-1 bg-white">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} id="create-recipe-form">
                            <div className="p-6 space-y-5">
                                {/* Basic info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-slate-600">
                                                    Reçete Kodu
                                                    <span className="text-slate-400 font-normal ml-1">(opsiyonel)</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="REC-001 (boş bırakılırsa otomatik)"
                                                        className="h-9 text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="version"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-slate-600">Versiyon</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1" className="h-9 text-sm" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Reçete Adı *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="örn: Kurkumin Kapsül 90'lık"
                                                    className="h-9 text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="productId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Ürün *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue placeholder="Ürün seçin..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.map((p: any) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.code} — {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="batchSize"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-slate-600">Parti Büyüklüğü *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        className="h-9 text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="batchUnit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-slate-600">Parti Birimi *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Birim seçin" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {BATCH_UNITS.map(u => (
                                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="instructions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">
                                                Üretim Talimatları
                                                <span className="text-slate-400 font-normal ml-1">(opsiyonel)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Üretim adımları ve özel talimatlar..."
                                                    className="text-sm resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                {/* Items section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-bold text-slate-700">İçindekiler Tablosu</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addItemRow}
                                            className="h-7 text-xs border-dashed border-[#38b2ac] text-[#38b2ac] hover:bg-[#38b2ac]/5"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Malzeme Ekle
                                        </Button>
                                    </div>

                                    {fields.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                                            <p className="text-sm text-slate-400">Henüz malzeme eklenmedi</p>
                                            <p className="text-xs text-slate-300 mt-1">Yukarıdaki butona tıklayarak malzeme ekleyin</p>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-2 py-2 text-left text-slate-500 font-bold w-8">#</th>
                                                        <th className="px-2 py-2 text-left text-slate-500 font-bold">MALZEME</th>
                                                        <th className="px-2 py-2 text-left text-slate-500 font-bold w-20">MİKTAR</th>
                                                        <th className="px-2 py-2 text-left text-slate-500 font-bold w-20">BİRİM</th>
                                                        <th className="px-2 py-2 text-left text-slate-500 font-bold w-16">FİRE %</th>
                                                        <th className="px-2 py-2 w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {fields.map((field, index) => (
                                                        <tr key={field.id} className="hover:bg-slate-50">
                                                            <td className="px-2 py-1.5 text-slate-400">{index + 1}</td>
                                                            <td className="px-2 py-1.5">
                                                                <Controller
                                                                    control={form.control}
                                                                    name={`items.${index}.materialId`}
                                                                    render={({ field: f }) => (
                                                                        <Select
                                                                            value={f.value}
                                                                            onValueChange={(val) => handleMaterialSelect(index, val)}
                                                                        >
                                                                            <SelectTrigger className="h-7 text-xs border-slate-200">
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
                                                                    )}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-1.5">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="h-7 text-xs border-slate-200"
                                                                    {...form.register(`items.${index}.quantity`)}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-1.5">
                                                                <Input
                                                                    placeholder="Birim"
                                                                    className="h-7 text-xs border-slate-200"
                                                                    {...form.register(`items.${index}.unit`)}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-1.5">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="h-7 text-xs border-slate-200"
                                                                    {...form.register(`items.${index}.wastagePercent`)}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => remove(index)}
                                                                    className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                {/* Footer */}
                <div className="border-t border-slate-200 p-4 bg-white flex-shrink-0">
                    <SheetFooter className="flex flex-row gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { form.reset(); onOpenChange(false); }}
                            className="border-lightning-border text-slate-600 h-9"
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            form="create-recipe-form"
                            size="sm"
                            className="bg-[#38b2ac] hover:bg-[#2c9a94] text-white h-9 px-6 font-bold"
                            disabled={createRecipe.isPending}
                        >
                            {createRecipe.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                            Reçete Oluştur
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
}
