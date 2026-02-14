'use client';

import React, { useState } from 'react';
import {
    usePlantStepTree,
    useCreatePlantStep,
    useUpdatePlantStep,
    useDeletePlantStep,
    type PlantStep,
} from '@/hooks/use-plant-hierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
    Plus, ChevronRight, ChevronDown, Building2, MapPin, Layers, GitBranch,
    Loader2, Trash2, Edit,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    SITE: { label: 'Tesis', color: 'bg-blue-100 text-blue-800', icon: Building2 },
    AREA: { label: 'Alan', color: 'bg-green-100 text-green-800', icon: MapPin },
    CELL: { label: 'Hücre', color: 'bg-orange-100 text-orange-800', icon: Layers },
    LINE: { label: 'Hat', color: 'bg-purple-100 text-purple-800', icon: GitBranch },
};

function TreeNode({ node, level = 0 }: { node: PlantStep; level?: number }) {
    const [expanded, setExpanded] = useState(level < 2);
    const hasChildren = node.children && node.children.length > 0;
    const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.SITE;
    const Icon = config.icon;

    return (
        <div>
            <div
                className="flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-md cursor-pointer group"
                style={{ paddingLeft: `${level * 24 + 12}px` }}
                onClick={() => hasChildren && setExpanded(!expanded)}
            >
                <span className="w-5 h-5 flex items-center justify-center text-slate-400">
                    {hasChildren ? (
                        expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                    ) : (
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                    )}
                </span>
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-sm text-slate-700">{node.name}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                    {config.label}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">{node.code}</span>
                {node._count && node._count.workCenters > 0 && (
                    <span className="text-xs text-slate-400 ml-auto">
                        {node._count.workCenters} iş merkezi
                    </span>
                )}
            </div>
            {expanded && hasChildren && (
                <div>
                    {node.children!.map((child) => (
                        <TreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function PlantStepTree() {
    const { data: tree, isLoading } = usePlantStepTree();
    const createMutation = useCreatePlantStep();
    const { toast } = useToast();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'SITE' as string,
        parentId: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMutation.mutateAsync({
                code: formData.code,
                name: formData.name,
                type: formData.type as PlantStep['type'],
                parentId: formData.parentId || undefined,
                description: formData.description || undefined,
            });
            toast({ title: 'Basarili', description: 'Tesis adimi basariyla eklendi.' });
            setSheetOpen(false);
            setFormData({ code: '', name: '', type: 'SITE', parentId: '', description: '' });
        } catch (err: any) {
            toast({ title: 'Hata', description: err.message || 'Bir hata olustu.', variant: 'destructive' });
        }
    };

    // Flatten tree for parent selection
    const flatList: PlantStep[] = [];
    const flatten = (nodes: PlantStep[]) => {
        for (const n of nodes) {
            flatList.push(n);
            if (n.children) flatten(n.children);
        }
    };
    if (tree) flatten(tree);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tesis Hiyerarsisi</CardTitle>
                    <Button onClick={() => setSheetOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Yeni Adim Ekle
                    </Button>
                </CardHeader>
                <CardContent>
                    {tree && tree.length > 0 ? (
                        <div className="border rounded-lg divide-y">
                            {tree.map((node) => (
                                <TreeNode key={node.id} node={node} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            Henuz tesis hiyerarsisi tanimlanmamis. Ilk adimi ekleyerek baslayin.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Yeni Tesis Adimi</SheetTitle>
                        <SheetDescription>
                            Tesis hiyerarsisine yeni bir adim ekleyin (Tesis, Alan, Hucre veya Hat).
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="space-y-2">
                            <Label>Kod *</Label>
                            <Input
                                required
                                placeholder="Orn: IST-FAB-01"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Ad *</Label>
                            <Input
                                required
                                placeholder="Orn: Istanbul Fabrikasi"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tip *</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SITE">Tesis (Site)</SelectItem>
                                    <SelectItem value="AREA">Alan (Area)</SelectItem>
                                    <SelectItem value="CELL">Hucre (Cell)</SelectItem>
                                    <SelectItem value="LINE">Hat (Line)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Ust Adim (Opsiyonel)</Label>
                            <Select
                                value={formData.parentId || 'none'}
                                onValueChange={(v) => setFormData({ ...formData, parentId: v === 'none' ? '' : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kok (ust seviye)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kok (ust seviye)</SelectItem>
                                    {flatList.map((ps) => (
                                        <SelectItem key={ps.id} value={ps.id}>
                                            {ps.name} ({TYPE_CONFIG[ps.type]?.label})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Aciklama</Label>
                            <Input
                                placeholder="Opsiyonel aciklama"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kaydet
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                                Iptal
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    );
}
