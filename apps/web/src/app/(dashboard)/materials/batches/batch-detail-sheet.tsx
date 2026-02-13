
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MaterialBatch, useMaterialBatchDetail } from '@/hooks/use-material-batches';
import { Loader2, Package, Calendar, MapPin, ClipboardList } from 'lucide-react';

interface MaterialBatchDetailSheetProps {
    batchId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_LABELS: Record<string, string> = {
    AVAILABLE: 'Kullanılabilir',
    RESERVED: 'Rezerve',
    CONSUMED: 'Tüketildi',
    EXPIRED: 'Süresi Doldu',
    QUARANTINE: 'Karantina',
};

const STATUS_VARIANTS: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500',
    RESERVED: 'bg-amber-500',
    CONSUMED: 'bg-slate-500',
    EXPIRED: 'bg-rose-500',
    QUARANTINE: 'bg-rose-500',
};

export function MaterialBatchDetailSheet({ batchId, open, onOpenChange }: MaterialBatchDetailSheetProps) {
    const { data: response, isLoading } = useMaterialBatchDetail(batchId);
    const batch = response ? ('data' in response ? response.data : response) : null;

    if (!open) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
                <div className="bg-slate-900 text-white p-6">
                    <SheetHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-400" />
                                    {batch?.batchNumber || 'Yükleniyor...'}
                                </SheetTitle>
                                <SheetDescription className="text-slate-400 mt-1">
                                    {batch?.material?.name} ({batch?.material?.code})
                                </SheetDescription>
                            </div>
                            {batch && (
                                <Badge className={`${STATUS_VARIANTS[batch.status] || 'bg-slate-500'} border-none`}>
                                    {STATUS_LABELS[batch.status] || batch.status}
                                </Badge>
                            )}
                        </div>
                    </SheetHeader>
                </div>

                <ScrollArea className="flex-1 bg-white p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : batch ? (
                        <div className="space-y-6">
                            {/* Key Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 font-medium uppercase">Kalan Miktar</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-1">
                                        {Number(batch.remainingQuantity).toLocaleString('tr-TR')}
                                        <span className="text-sm font-normal text-slate-500 ml-1">{batch.material.unitOfMeasure}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        İlk Miktar: {Number(batch.quantity).toLocaleString('tr-TR')} {batch.material.unitOfMeasure}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 font-medium uppercase">Depo Konumu</div>
                                    <div className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {batch.storageLocation || '-'}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Ted. Lot: {batch.supplierLotNo || '-'}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                <div>
                                    <div className="text-slate-500 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Üretim Tarihi
                                    </div>
                                    <div className="font-medium">
                                        {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString('tr-TR') : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Son Kullanma Tarihi
                                    </div>
                                    <div className={`font-medium ${getDateStyle(batch.expiryDate)}`}>
                                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('tr-TR') : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">Oluşturulma</div>
                                    <div className="font-medium">
                                        {new Date(batch.createdAt).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">Güncellenme</div>
                                    <div className="font-medium">
                                        {new Date(batch.updatedAt).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Usage History */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" /> Kullanım Geçmişi
                                </h3>
                                {batch.consumptions && batch.consumptions.length > 0 ? (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 border-b">
                                                <tr>
                                                    <th className="px-3 py-2 font-medium text-slate-500">Tarih</th>
                                                    <th className="px-3 py-2 font-medium text-slate-500">İş Emri</th>
                                                    <th className="px-3 py-2 font-medium text-slate-500">Ürün</th>
                                                    <th className="px-3 py-2 font-medium text-slate-500 text-right">Miktar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {batch.consumptions.map((c) => (
                                                    <tr key={c.id}>
                                                        <td className="px-3 py-2 text-slate-600">
                                                            {new Date(c.timestamp).toLocaleDateString('tr-TR')}
                                                        </td>
                                                        <td className="px-3 py-2 font-medium">
                                                            {c.productionBatch.productionOrder?.orderNumber || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600">
                                                            {c.productionBatch.productionOrder?.product?.name || c.productionBatch.productionOrder?.product?.code || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-medium">
                                                            {c.consumedQuantity} {c.unit}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg text-center">
                                        Henüz kullanım kaydı yok.
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            Parti detayları bulunamadı.
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

function getDateStyle(dateStr?: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'text-rose-600 font-bold';
    if (diffDays < 30) return 'text-amber-600 font-bold';
    return 'text-slate-900';
}
