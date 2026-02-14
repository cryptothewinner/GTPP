'use client';

import React, { useState } from 'react';
import {
    useProcessDefinitions,
    useProcessDefinition,
    useCreateProcessDefinition,
    useApproveProcessDefinition,
    useCreateNewVersion,
    useCreateProcessStep,
    useDeleteProcessStep,
    useCreateInstruction,
    useDeleteInstruction,
    type ProcessDefinition,
    type ProcessStep,
    type Instruction,
} from '@/hooks/use-process-definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
    Plus, Loader2, CheckCircle2, Copy, ChevronRight,
    FileText, ClipboardCheck, MessageSquare, Trash2, ListOrdered,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Taslak', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'Onaylanmis', color: 'bg-green-100 text-green-800' },
    OBSOLETE: { label: 'Gecersiz', color: 'bg-slate-100 text-slate-800' },
};

const INSTR_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    CHECK: { label: 'Kontrol', icon: ClipboardCheck, color: 'text-blue-600' },
    INPUT: { label: 'Giris', icon: FileText, color: 'text-green-600' },
    CONFIRMATION: { label: 'Onay', icon: CheckCircle2, color: 'text-orange-600' },
};

export function ProcessDefinitionList() {
    const { data: definitions, isLoading } = useProcessDefinitions();
    const createMutation = useCreateProcessDefinition();
    const approveMutation = useApproveProcessDefinition();
    const newVersionMutation = useCreateNewVersion();
    const { toast } = useToast();

    const [createOpen, setCreateOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ code: '', name: '', productId: '', notes: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMutation.mutateAsync(formData);
            toast({ title: 'Basarili', description: 'Surec tanimi olusturuldu.' });
            setCreateOpen(false);
            setFormData({ code: '', name: '', productId: '', notes: '' });
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message || 'Bir hata olustu.', variant: 'destructive' });
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync({ id, userId: 'system' });
            toast({ title: 'Basarili', description: 'Surec tanimi onaylandi.' });
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message || 'Onaylama hatasi.', variant: 'destructive' });
        }
    };

    const handleNewVersion = async (id: string) => {
        try {
            await newVersionMutation.mutateAsync(id);
            toast({ title: 'Basarili', description: 'Yeni versiyon olusturuldu.' });
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message || 'Versiyon hatasi.', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Surec Tanimlari (BOP)</CardTitle>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Yeni Surec Tanimi
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kod</TableHead>
                                <TableHead>Ad</TableHead>
                                <TableHead>Urun</TableHead>
                                <TableHead>Versiyon</TableHead>
                                <TableHead>Adim Sayisi</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Onaylayan</TableHead>
                                <TableHead className="text-right">Islemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {definitions?.map((def) => {
                                const sc = STATUS_CONFIG[def.status] || STATUS_CONFIG.DRAFT;
                                return (
                                    <TableRow key={def.id} className="cursor-pointer" onClick={() => setDetailId(def.id)}>
                                        <TableCell className="font-mono">{def.code}</TableCell>
                                        <TableCell className="font-medium">{def.name}</TableCell>
                                        <TableCell>{def.product?.name || '-'}</TableCell>
                                        <TableCell><Badge variant="outline">v{def.version}</Badge></TableCell>
                                        <TableCell>{def._count?.steps || 0}</TableCell>
                                        <TableCell><Badge className={sc.color}>{sc.label}</Badge></TableCell>
                                        <TableCell>{def.approvedBy || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                                                {def.status === 'DRAFT' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleApprove(def.id)}>
                                                        <CheckCircle2 className="h-4 w-4 mr-1" /> Onayla
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleNewVersion(def.id)}>
                                                    <Copy className="h-4 w-4 mr-1" /> Kopyala
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {(!definitions || definitions.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        Henuz surec tanimi olusturulmamis.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Sheet */}
            <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Yeni Surec Tanimi</SheetTitle>
                        <SheetDescription>Bir urun icin yeni bir uretim surec tanimi olusturun.</SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleCreate} className="space-y-4 mt-6">
                        <div className="space-y-2">
                            <Label>Kod *</Label>
                            <Input required placeholder="PD-TABLET-001" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Ad *</Label>
                            <Input required placeholder="Tablet Uretim Sureci" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Urun ID *</Label>
                            <Input required placeholder="Urun ID girin" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Notlar</Label>
                            <Input placeholder="Opsiyonel notlar" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Olustur
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Iptal</Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Detail Sheet */}
            <ProcessDefinitionDetailSheet id={detailId} onClose={() => setDetailId(null)} />
        </>
    );
}

// ─── Detail Sheet ──────────────────────────────────────────────

function ProcessDefinitionDetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
    const { data: def, isLoading } = useProcessDefinition(id);
    const createStep = useCreateProcessStep();
    const deleteStep = useDeleteProcessStep();
    const createInstr = useCreateInstruction();
    const deleteInstr = useDeleteInstruction();
    const { toast } = useToast();

    const [stepForm, setStepForm] = useState({ name: '', sequence: 10, description: '', requiredCapability: '', setupTimeMinutes: 0, runTimeSecondsPerUnit: 0 });
    const [instrForm, setInstrForm] = useState({ text: '', type: 'CHECK', stepId: '' });

    const handleAddStep = async () => {
        if (!id || !stepForm.name) return;
        try {
            await createStep.mutateAsync({
                defId: id,
                data: {
                    name: stepForm.name,
                    sequence: stepForm.sequence,
                    description: stepForm.description || undefined,
                    requiredCapability: stepForm.requiredCapability || undefined,
                    setupTimeMinutes: stepForm.setupTimeMinutes,
                    runTimeSecondsPerUnit: stepForm.runTimeSecondsPerUnit,
                },
            });
            setStepForm({ name: '', sequence: (def?.steps?.length || 0) * 10 + 10, description: '', requiredCapability: '', setupTimeMinutes: 0, runTimeSecondsPerUnit: 0 });
            toast({ title: 'Basarili', description: 'Adim eklendi.' });
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message, variant: 'destructive' });
        }
    };

    const handleAddInstruction = async (stepId: string) => {
        if (!instrForm.text) return;
        try {
            await createInstr.mutateAsync({
                stepId,
                data: { text: instrForm.text, type: instrForm.type as Instruction['type'] },
            });
            setInstrForm({ text: '', type: 'CHECK', stepId: '' });
            toast({ title: 'Basarili', description: 'Talimat eklendi.' });
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message, variant: 'destructive' });
        }
    };

    return (
        <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : def ? (
                    <>
                        <div className="bg-slate-900 text-white p-6">
                            <SheetHeader>
                                <div className="flex items-center gap-3">
                                    <SheetTitle className="text-xl font-bold text-white">{def.name}</SheetTitle>
                                    <Badge variant="outline" className="text-white border-white/30">v{def.version}</Badge>
                                    <Badge className={STATUS_CONFIG[def.status]?.color || ''}>
                                        {STATUS_CONFIG[def.status]?.label}
                                    </Badge>
                                </div>
                                <div className="flex gap-4 text-sm text-slate-300 mt-2">
                                    <span>Kod: {def.code}</span>
                                    <span>Urun: {def.product?.name}</span>
                                    <span>{def.steps?.length || 0} adim</span>
                                </div>
                            </SheetHeader>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6">
                                {/* Steps */}
                                {def.steps?.map((step, idx) => (
                                    <div key={step.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm">{step.name}</h4>
                                                    {step.description && <p className="text-xs text-slate-500">{step.description}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                {step.requiredCapability && (
                                                    <Badge variant="outline" className="text-[10px]">{step.requiredCapability}</Badge>
                                                )}
                                                {step.setupTimeMinutes > 0 && <span>Kurulum: {step.setupTimeMinutes}dk</span>}
                                                {step.runTimeSecondsPerUnit > 0 && <span>Calisma: {step.runTimeSecondsPerUnit}sn/birim</span>}
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteStep.mutate(step.id)}>
                                                    <Trash2 className="h-3 w-3 text-red-400" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Instructions */}
                                        {step.instructions && step.instructions.length > 0 && (
                                            <div className="ml-11 space-y-1">
                                                {step.instructions.map((instr) => {
                                                    const ic = INSTR_TYPE_CONFIG[instr.type] || INSTR_TYPE_CONFIG.CHECK;
                                                    const InstrIcon = ic.icon;
                                                    return (
                                                        <div key={instr.id} className="flex items-center gap-2 text-sm py-1 group">
                                                            <InstrIcon className={`h-3.5 w-3.5 ${ic.color}`} />
                                                            <span className={instr.mandatory ? 'font-medium' : 'text-slate-500'}>{instr.text}</span>
                                                            <Badge variant="outline" className="text-[9px] px-1">{ic.label}</Badge>
                                                            <button className="opacity-0 group-hover:opacity-100" onClick={() => deleteInstr.mutate(instr.id)}>
                                                                <X className="h-3 w-3 text-red-400" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Add instruction inline */}
                                        <div className="ml-11 flex gap-2">
                                            <Input
                                                placeholder="Yeni talimat ekle..."
                                                className="h-7 text-xs"
                                                value={instrForm.stepId === step.id ? instrForm.text : ''}
                                                onChange={(e) => setInstrForm({ ...instrForm, text: e.target.value, stepId: step.id })}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInstruction(step.id))}
                                            />
                                            <Select
                                                value={instrForm.stepId === step.id ? instrForm.type : 'CHECK'}
                                                onValueChange={(v) => setInstrForm({ ...instrForm, type: v, stepId: step.id })}
                                            >
                                                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CHECK">Kontrol</SelectItem>
                                                    <SelectItem value="INPUT">Giris</SelectItem>
                                                    <SelectItem value="CONFIRMATION">Onay</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleAddInstruction(step.id)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Step Form */}
                                <Separator />
                                <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-600">Yeni Adim Ekle</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Adim Adi *</Label>
                                            <Input className="h-8 text-sm" placeholder="Granulasyon" value={stepForm.name} onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Sira No</Label>
                                            <Input className="h-8 text-sm" type="number" value={stepForm.sequence} onChange={(e) => setStepForm({ ...stepForm, sequence: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Gerekli Yetenek</Label>
                                            <Input className="h-8 text-sm" placeholder="MIXING" value={stepForm.requiredCapability} onChange={(e) => setStepForm({ ...stepForm, requiredCapability: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Aciklama</Label>
                                            <Input className="h-8 text-sm" placeholder="Opsiyonel" value={stepForm.description} onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Kurulum (dk)</Label>
                                            <Input className="h-8 text-sm" type="number" value={stepForm.setupTimeMinutes} onChange={(e) => setStepForm({ ...stepForm, setupTimeMinutes: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Calisma (sn/birim)</Label>
                                            <Input className="h-8 text-sm" type="number" value={stepForm.runTimeSecondsPerUnit} onChange={(e) => setStepForm({ ...stepForm, runTimeSecondsPerUnit: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={handleAddStep} disabled={createStep.isPending || !stepForm.name}>
                                        {createStep.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        <Plus className="mr-1 h-3 w-3" /> Adim Ekle
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    </>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

// Re-export X icon for use in the component
function X(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}
