'use client';

import React, { useState } from 'react';
import {
    useEquipment,
    useCreateEquipment,
    useUpdateEquipmentStatus,
    useAddCapability,
    useRemoveCapability,
    useWorkCenters,
    type Equipment,
    type EquipmentCapability,
} from '@/hooks/use-plant-hierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Wrench, X, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    IDLE: { label: 'Bosta', color: 'bg-green-100 text-green-800' },
    RUNNING: { label: 'Calisiyor', color: 'bg-blue-100 text-blue-800' },
    DOWN: { label: 'Arizali', color: 'bg-red-100 text-red-800' },
    SETUP: { label: 'Kurulum', color: 'bg-orange-100 text-orange-800' },
    CLEANING: { label: 'Temizlik', color: 'bg-yellow-100 text-yellow-800' },
    CALIBRATION_DUE: { label: 'Kalibrasyon Bekleniyor', color: 'bg-purple-100 text-purple-800' },
    DECOMMISSIONED: { label: 'Kullanim Disi', color: 'bg-slate-100 text-slate-800' },
};

function EquipmentRow({ eq }: { eq: Equipment }) {
    const [expanded, setExpanded] = useState(false);
    const removeCapability = useRemoveCapability();
    const statusConf = STATUS_CONFIG[eq.status] || STATUS_CONFIG.IDLE;

    return (
        <>
            <TableRow className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <TableCell className="font-mono">{eq.code}</TableCell>
                <TableCell className="font-medium">{eq.name}</TableCell>
                <TableCell>{eq.workCenter?.name || '-'}</TableCell>
                <TableCell>{eq.serialNumber || '-'}</TableCell>
                <TableCell>{[eq.manufacturer, eq.model].filter(Boolean).join(' ') || '-'}</TableCell>
                <TableCell>
                    <Badge className={statusConf.color}>{statusConf.label}</Badge>
                </TableCell>
                <TableCell>{eq.lastCalibration ? new Date(eq.lastCalibration).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{eq.nextCalibration ? new Date(eq.nextCalibration).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{eq.capabilities?.length || 0}</TableCell>
                <TableCell>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </TableCell>
            </TableRow>
            {expanded && eq.capabilities && eq.capabilities.length > 0 && (
                <TableRow>
                    <TableCell colSpan={10} className="bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Yetenekler</div>
                        <div className="flex flex-wrap gap-2">
                            {eq.capabilities.map((cap) => (
                                <Badge key={cap.id} variant="outline" className="text-xs gap-1 pl-2">
                                    <Wrench className="h-3 w-3" />
                                    {cap.processType} ({Number(cap.minCapacity)}-{Number(cap.maxCapacity)} {cap.unit})
                                    <button
                                        className="ml-1 hover:text-red-600"
                                        onClick={(e) => { e.stopPropagation(); removeCapability.mutate(cap.id); }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

export function EquipmentList() {
    const { data: equipment, isLoading } = useEquipment();
    const { data: workCenters } = useWorkCenters();
    const createMutation = useCreateEquipment();
    const addCapability = useAddCapability();
    const { toast } = useToast();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '', name: '', workCenterId: '', serialNumber: '', model: '', manufacturer: '',
        status: 'IDLE', lastCalibration: '', nextCalibration: '', installDate: '',
    });
    const [capForm, setCapForm] = useState({ processType: '', minCapacity: 0, maxCapacity: 0, unit: 'Kg' });
    const [pendingCaps, setPendingCaps] = useState<Array<{ processType: string; minCapacity: number; maxCapacity: number; unit: string }>>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data: any = {
                code: formData.code,
                name: formData.name,
                workCenterId: formData.workCenterId,
                serialNumber: formData.serialNumber || undefined,
                model: formData.model || undefined,
                manufacturer: formData.manufacturer || undefined,
                status: formData.status || undefined,
                lastCalibration: formData.lastCalibration || undefined,
                nextCalibration: formData.nextCalibration || undefined,
                installDate: formData.installDate || undefined,
            };
            const created = await createMutation.mutateAsync(data);

            // Add pending capabilities
            for (const cap of pendingCaps) {
                await addCapability.mutateAsync({ equipmentId: (created as any).id, data: cap });
            }

            toast({ title: 'Basarili', description: 'Ekipman basariyla eklendi.' });
            setSheetOpen(false);
            setFormData({ code: '', name: '', workCenterId: '', serialNumber: '', model: '', manufacturer: '', status: 'IDLE', lastCalibration: '', nextCalibration: '', installDate: '' });
            setPendingCaps([]);
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message || 'Bir hata olustu.', variant: 'destructive' });
        }
    };

    const addPendingCap = () => {
        if (!capForm.processType) return;
        setPendingCaps([...pendingCaps, { ...capForm }]);
        setCapForm({ processType: '', minCapacity: 0, maxCapacity: 0, unit: 'Kg' });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Ekipmanlar</CardTitle>
                    <Button onClick={() => setSheetOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Yeni Ekipman
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kod</TableHead>
                                <TableHead>Ad</TableHead>
                                <TableHead>Is Merkezi</TableHead>
                                <TableHead>Seri No</TableHead>
                                <TableHead>Marka/Model</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Son Kalibrasyon</TableHead>
                                <TableHead>Sonraki Kalibrasyon</TableHead>
                                <TableHead>Yetenekler</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {equipment?.map((eq) => (
                                <EquipmentRow key={eq.id} eq={eq} />
                            ))}
                            {(!equipment || equipment.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                                        Henuz ekipman tanimlanmamis.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Yeni Ekipman</SheetTitle>
                        <SheetDescription>Bir is merkezine fiziksel makine/ekipman ekleyin.</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kod *</Label>
                                <Input required placeholder="EQ-MIX-001" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Ad *</Label>
                                <Input required placeholder="Mikser A" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Is Merkezi *</Label>
                            <Select value={formData.workCenterId} onValueChange={(v) => setFormData({ ...formData, workCenterId: v })}>
                                <SelectTrigger><SelectValue placeholder="Bir is merkezi secin" /></SelectTrigger>
                                <SelectContent>
                                    {workCenters?.map((wc) => (
                                        <SelectItem key={wc.id} value={wc.id}>{wc.name} ({wc.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Uretici</Label>
                                <Input placeholder="Marka" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Model</Label>
                                <Input placeholder="Model no" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Seri Numarasi</Label>
                            <Input placeholder="SN-123456" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Son Kalibrasyon</Label>
                                <Input type="date" value={formData.lastCalibration} onChange={(e) => setFormData({ ...formData, lastCalibration: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Sonraki Kalibrasyon</Label>
                                <Input type="date" value={formData.nextCalibration} onChange={(e) => setFormData({ ...formData, nextCalibration: e.target.value })} />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Yetenekler</Label>
                            {pendingCaps.map((cap, i) => (
                                <Badge key={i} variant="outline" className="mr-2 gap-1">
                                    <Wrench className="h-3 w-3" /> {cap.processType} ({cap.minCapacity}-{cap.maxCapacity} {cap.unit})
                                    <button type="button" onClick={() => setPendingCaps(pendingCaps.filter((_, j) => j !== i))}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            <div className="grid grid-cols-4 gap-2">
                                <Input placeholder="Tip (MIXING)" value={capForm.processType} onChange={(e) => setCapForm({ ...capForm, processType: e.target.value })} />
                                <Input type="number" placeholder="Min" value={capForm.minCapacity || ''} onChange={(e) => setCapForm({ ...capForm, minCapacity: Number(e.target.value) })} />
                                <Input type="number" placeholder="Max" value={capForm.maxCapacity || ''} onChange={(e) => setCapForm({ ...capForm, maxCapacity: Number(e.target.value) })} />
                                <Button type="button" variant="outline" size="sm" onClick={addPendingCap}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
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
