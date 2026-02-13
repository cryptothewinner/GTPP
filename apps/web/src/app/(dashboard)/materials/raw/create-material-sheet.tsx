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
import { useCreateMaterial } from '@/hooks/use-materials';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateMaterialSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
    name: z.string().min(2, 'Malzeme adı en az 2 karakter olmalıdır'),
    code: z.string().optional(),
    type: z.enum(['RAW_MATERIAL', 'PACKAGING', 'SEMI_FINISHED', 'FINISHED_PRODUCT']),
    unitOfMeasure: z.string().default('Kg'),
    unitPrice: z.coerce.number().min(0).optional(),
    minStockLevel: z.coerce.number().min(0).optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
});

export function CreateMaterialSheet({ open, onOpenChange }: CreateMaterialSheetProps) {
    const { toast } = useToast();
    const createMaterial = useCreateMaterial();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            type: 'RAW_MATERIAL',
            unitOfMeasure: 'Kg',
            unitPrice: 0,
            minStockLevel: 0,
            category: '',
            notes: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        createMaterial.mutate(values, {
            onSuccess: () => {
                toast({
                    title: 'Başarılı',
                    description: 'Yeni malzeme oluşturuldu.',
                });
                onOpenChange(false);
                form.reset();
            },
            onError: (error: any) => {
                toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: error?.response?.data?.message || 'Malzeme oluşturulurken bir hata oluştu.',
                });
                console.error(error);
            },
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Yeni Malzeme Kartı</SheetTitle>
                    <SheetDescription>
                        Envantere yeni bir malzeme tanımı ekleyin.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Malzeme Adı</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: Sitrik Asit" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Malzeme Türü</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="RAW_MATERIAL">Hammadde</SelectItem>
                                                <SelectItem value="PACKAGING">Ambalaj</SelectItem>
                                                <SelectItem value="SEMI_FINISHED">Yarı Mamul</SelectItem>
                                                <SelectItem value="FINISHED_PRODUCT">Bitmiş Ürün</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kod (Opsiyonel)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Otomatik" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="unitOfMeasure"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Birim</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Kg, Adet, Lt" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="unitPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Birim Fiyat</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="minStockLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min. Stok</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kategori</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Gıda Takviyesi, Şişe vb." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <SheetFooter className="mt-6">
                                <Button type="submit" disabled={createMaterial.isPending} className="w-full">
                                    {createMaterial.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
