'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateProductionPlan } from '@/hooks/use-production-structure';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
    name: z.string().min(2, 'Plan adı en az 2 karakter olmalıdır.'),
    code: z.string().min(2, 'Plan kodu en az 2 karakter olmalıdır.'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Geçersiz tarih' }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Geçersiz tarih' }),
});

export function CreatePlanDialog() {
    const [open, setOpen] = useState(false);
    const createPlan = useCreateProductionPlan();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            startDate: new Date().toISOString().split('T')[0], // Today
            endDate: new Date().toISOString().split('T')[0],
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createPlan.mutate(values, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Plan Oluştur
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Üretim Planı</DialogTitle>
                    <DialogDescription>
                        Haftalık veya aylık üretim planı oluşturun.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan Kodu</FormLabel>
                                    <FormControl>
                                        <Input placeholder="PLN-2026-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan Adı</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Şubat Ayı Üretim Planı" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Başlangıç</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bitiş</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createPlan.isPending}>
                                {createPlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Oluştur
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
