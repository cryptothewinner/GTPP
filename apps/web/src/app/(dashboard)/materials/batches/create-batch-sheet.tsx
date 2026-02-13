import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateMaterialBatch } from '@/hooks/use-material-batches';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface CreateMaterialBatchSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
    materialId: z.string().min(1, 'Malzeme seçimi zorunludur'),
    batchNumber: z.string().min(3, 'Parti numarası en az 3 karakter olmalıdır'),
    supplierLotNo: z.string().optional(),
    quantity: z.coerce.number().min(0, 'Miktar 0 dan büyük olmalıdır'),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().optional(),
    storageLocation: z.string().optional(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'QUARANTINE', 'EXPIRED', 'CONSUMED']).default('AVAILABLE'),
});

export function CreateMaterialBatchSheet({ open, onOpenChange }: CreateMaterialBatchSheetProps) {
    const { toast } = useToast();
    const createBatch = useCreateMaterialBatch();

    // Fetch materials for the dropdown
    const { data: materialsObj } = useQuery({
        queryKey: ['materials', 'list'],
        queryFn: () => apiClient.get<any>('/materials?pageSize=1000'), // Temporary: fetch all for dropdown
    });
    const materials = materialsObj?.data || [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            batchNumber: '',
            supplierLotNo: '',
            quantity: 0,
            manufacturingDate: '',
            expiryDate: '',
            storageLocation: '',
            status: 'AVAILABLE',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        createBatch.mutate(values, {
            onSuccess: () => {
                toast({
                    title: 'Başarılı',
                    description: 'Yeni malzeme partisi oluşturuldu.',
                });
                onOpenChange(false);
                form.reset();
            },
            onError: (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: 'Parti oluşturulurken bir hata oluştu.',
                });
                console.error(error);
            },
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Yeni Malzeme Partisi</SheetTitle>
                    <SheetDescription>
                        Stok girişi yapmak için yeni bir parti oluşturun.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="materialId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Malzeme</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Malzeme seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {materials.map((m: any) => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.code} - {m.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="batchNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parti Numarası</FormLabel>
                                        <FormControl>
                                            <Input placeholder="MB-..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="supplierLotNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tedarikçi Lot No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opsiyonel" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Miktar</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Durum</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="AVAILABLE">Kullanılabilir</SelectItem>
                                                    <SelectItem value="QUARANTINE">Karantina</SelectItem>
                                                    <SelectItem value="RESERVED">Rezerve</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="manufacturingDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Üretim Tarihi</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Son Kullanma Tarihi</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="storageLocation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Depo Konumu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Raf/Koridor vb." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <SheetFooter className="mt-6">
                                <Button type="submit" disabled={createBatch.isPending} className="w-full">
                                    {createBatch.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Oluştur
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
