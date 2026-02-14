'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useGLAccounts } from '@/hooks/use-gl-accounts';
import { useCreateJournalEntry } from '@/hooks/use-create-journal-entry';

const lineSchema = z.object({
    glAccountId: z.string().min(1, 'Hesap seçimi zorunludur'),
    description: z.string().optional(),
    costCenterId: z.string().optional(),
    debit: z.coerce.number().min(0, 'Borç negatif olamaz').default(0),
    credit: z.coerce.number().min(0, 'Alacak negatif olamaz').default(0),
}).superRefine((line, ctx) => {
    if (line.debit > 0 && line.credit > 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Aynı satırda hem borç hem alacak girilemez',
            path: ['debit'],
        });
    }
    if (line.debit <= 0 && line.credit <= 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Borç veya alacak alanlarından biri girilmelidir',
            path: ['debit'],
        });
    }
});

const formSchema = z.object({
    headerText: z.string().min(1, 'Belge başlığı zorunludur'),
    reference: z.string().min(1, 'Referans zorunludur'),
    postingDate: z.string().min(1, 'Kayıt tarihi zorunludur'),
    currency: z.string().min(1, 'Para birimi zorunludur'),
    items: z.array(lineSchema).min(2, 'En az iki satır olmalıdır'),
}).superRefine((data, ctx) => {
    const totalDebit = data.items.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = data.items.reduce((sum, line) => sum + Number(line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Toplam borç ve alacak eşit olmalıdır',
            path: ['items'],
        });
    }
});

export default function NewJournalEntryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { data: glAccounts } = useGLAccounts();
    const createMutation = useCreateJournalEntry();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            headerText: '',
            reference: '',
            postingDate: new Date().toISOString().split('T')[0],
            currency: 'TRY',
            items: [
                { glAccountId: '', description: '', costCenterId: '', debit: 0, credit: 0 },
                { glAccountId: '', description: '', costCenterId: '', debit: 0, credit: 0 },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const watchedItems = form.watch('items');
    const totals = useMemo(() => {
        const totalDebit = (watchedItems || []).reduce((sum, line) => sum + Number(line.debit || 0), 0);
        const totalCredit = (watchedItems || []).reduce((sum, line) => sum + Number(line.credit || 0), 0);
        return { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) <= 0.01 };
    }, [watchedItems]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const payload = {
            headerText: values.headerText,
            reference: values.reference,
            postingDate: values.postingDate,
            currency: values.currency,
            items: values.items.map((line) => ({
                glAccountId: line.glAccountId,
                postingType: line.debit > 0 ? 'DEBIT' as const : 'CREDIT' as const,
                amount: line.debit > 0 ? Number(line.debit) : Number(line.credit),
                costCenterId: line.costCenterId || undefined,
                description: line.description || undefined,
            })),
        };

        try {
            const result = await createMutation.mutateAsync(payload);
            toast({ title: 'Başarılı', description: 'Yevmiye kaydı oluşturuldu.' });
            router.push(result?.id ? '/finance/journal-entries' : '/finance/journal-entries');
        } catch {
            toast({
                title: 'Hata',
                description: 'Kayıt oluşturulurken bir hata oluştu.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <header className="bg-white border-b border-lightning-border p-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => router.push('/finance/journal-entries')}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Yeni Yevmiye Fişi</h1>
                        <p className="text-sm text-slate-500">Muhasebe fişi oluşturun</p>
                    </div>
                </div>
                <Button type="button" className="bg-lightning-blue hover:bg-blue-600" onClick={form.handleSubmit(onSubmit)} disabled={createMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
            </header>

            <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Belge Bilgileri</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="headerText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Belge Başlığı</FormLabel>
                                            <FormControl><Input {...field} placeholder="Açıklama" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="reference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Referans</FormLabel>
                                            <FormControl><Input {...field} placeholder="REF-..." /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="postingDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kayıt Tarihi</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Para Birimi</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">Fiş Satırları</h2>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => append({ glAccountId: '', description: '', costCenterId: '', debit: 0, credit: 0 })}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Satır Ekle
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start border border-slate-200 rounded-md p-3 bg-slate-50">
                                        <div className="col-span-12 md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.glAccountId`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>Hesap</FormLabel>
                                                        <Select value={f.value} onValueChange={f.onChange}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue placeholder="Hesap seçin" /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {(glAccounts || []).map((account) => (
                                                                    <SelectItem key={account.id} value={account.id}>
                                                                        {account.accountNumber} - {account.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-12 md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.debit`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>Borç</FormLabel>
                                                        <FormControl><Input type="number" step="0.01" {...f} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-12 md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.credit`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>Alacak</FormLabel>
                                                        <FormControl><Input type="number" step="0.01" {...f} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-12 md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.costCenterId`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>Masraf Merkezi</FormLabel>
                                                        <FormControl><Input {...f} placeholder="Opsiyonel" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-12 md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.description`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>Satır Açıklaması</FormLabel>
                                                        <FormControl><Input {...f} placeholder="Opsiyonel" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-12 md:col-span-1 flex md:justify-end pt-0 md:pt-7">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                disabled={fields.length <= 2}
                                                className="text-rose-500 hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {form.formState.errors.items?.message && (
                                <p className="text-sm text-rose-600 mt-3">{String(form.formState.errors.items.message)}</p>
                            )}

                            <div className="mt-6 pt-4 border-t border-lightning-border flex justify-end">
                                <div className="w-80 space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Toplam Borç</span>
                                        <span className="font-medium">{totals.totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Toplam Alacak</span>
                                        <span className="font-medium">{totals.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className={`flex items-center justify-between text-sm font-semibold pt-2 border-t ${totals.balanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        <span>Durum</span>
                                        <span>{totals.balanced ? 'Dengede' : 'Dengesiz'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
