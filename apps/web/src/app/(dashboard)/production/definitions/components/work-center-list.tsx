'use client';

import React, { useState } from 'react';
import { useWorkCenters, useCreateWorkCenter, usePlantSteps, type WorkCenter } from '@/hooks/use-plant-hierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Cog } from 'lucide-react';

export function WorkCenterList() {
    const { data: workCenters, isLoading } = useWorkCenters();
    const { data: plantSteps } = usePlantSteps();
    const createMutation = useCreateWorkCenter();
    const { toast } = useToast();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        plantStepId: '',
        efficiency: 100,
        hourlyCost: 0,
        capacityType: 'TIME_BASED',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMutation.mutateAsync({
                code: formData.code,
                name: formData.name,
                plantStepId: formData.plantStepId,
                efficiency: formData.efficiency,
                hourlyCost: formData.hourlyCost,
                capacityType: formData.capacityType as WorkCenter['capacityType'],
                notes: formData.notes || undefined,
            });
            toast({ title: 'Basarili', description: 'Is merkezi basariyla eklendi.' });
            setSheetOpen(false);
            setFormData({ code: '', name: '', plantStepId: '', efficiency: 100, hourlyCost: 0, capacityType: 'TIME_BASED', notes: '' });
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message || 'Bir hata olustu.', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Is Merkezleri</CardTitle>
                    <Button onClick={() => setSheetOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Yeni Is Merkezi
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kod</TableHead>
                                <TableHead>Ad</TableHead>
                                <TableHead>Tesis Alani</TableHead>
                                <TableHead>Verimlilik (%)</TableHead>
                                <TableHead>Saatlik Maliyet</TableHead>
                                <TableHead>Kapasite Tipi</TableHead>
                                <TableHead>Ekipman</TableHead>
                                <TableHead>Durum</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workCenters?.map((wc) => (
                                <TableRow key={wc.id}>
                                    <TableCell className="font-mono">{wc.code}</TableCell>
                                    <TableCell className="font-medium">{wc.name}</TableCell>
                                    <TableCell>{wc.plantStep?.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={Number(wc.efficiency) >= 80 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}>
                                            %{Number(wc.efficiency).toFixed(0)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{Number(wc.hourlyCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {wc.capacityType === 'TIME_BASED' ? 'Zamana Dayali' : 'Birime Dayali'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{wc._count?.equipment || 0}</TableCell>
                                    <TableCell>
                                        <Badge className={wc.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                                            {wc.isActive ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!workCenters || workCenters.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        Henuz is merkezi tanimlanmamis.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Yeni Is Merkezi</SheetTitle>
                        <SheetDescription>Kapasite planlama yapmak icin bir is merkezi olusturun.</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="space-y-2">
                            <Label>Kod *</Label>
                            <Input required placeholder="Orn: WC-GRAN-01" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Ad *</Label>
                            <Input required placeholder="Orn: Granulasyon Hatti 1" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tesis Alani *</Label>
                            <Select value={formData.plantStepId} onValueChange={(v) => setFormData({ ...formData, plantStepId: v })}>
                                <SelectTrigger><SelectValue placeholder="Bir tesis adimi secin" /></SelectTrigger>
                                <SelectContent>
                                    {plantSteps?.map((ps) => (
                                        <SelectItem key={ps.id} value={ps.id}>{ps.name} ({ps.type})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Verimlilik (%)</Label>
                                <Input type="number" min={0} max={100} value={formData.efficiency} onChange={(e) => setFormData({ ...formData, efficiency: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Saatlik Maliyet (TL)</Label>
                                <Input type="number" min={0} step="0.01" value={formData.hourlyCost} onChange={(e) => setFormData({ ...formData, hourlyCost: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Kapasite Tipi</Label>
                            <Select value={formData.capacityType} onValueChange={(v) => setFormData({ ...formData, capacityType: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TIME_BASED">Zamana Dayali</SelectItem>
                                    <SelectItem value="UNIT_BASED">Birime Dayali</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notlar</Label>
                            <Input placeholder="Opsiyonel notlar" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kaydet
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Iptal</Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    );
}
