'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Truck, PackageCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOutboundDeliveryDetail, usePostGoodsIssue } from '@/hooks/use-outbound-deliveries';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';

export default function OutboundDeliveryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;

    const { data: delivery, isLoading } = useOutboundDeliveryDetail(id);
    const pgiMutation = usePostGoodsIssue();

    const handlePostGoodsIssue = async () => {
        if (!confirm('Bu teslimat için Mal Çıkışı (PGI) yapmak istediğinize emin misiniz? Stoklar güncellenecektir.')) return;
        try {
            await pgiMutation.mutateAsync(id);
            toast({ title: 'Başarılı', description: 'Mal çıkışı başarıyla yapıldı.' });
        } catch (error: any) {
            toast({ title: 'Hata', description: error?.response?.data?.message || 'Mal çıkışı sırasında bir hata oluştu.', variant: 'destructive' });
        }
    };

    if (isLoading) return <div className="p-6">Yükleniyor...</div>;
    if (!delivery) return <div className="p-6">Teslimat bulunamadı</div>;

    const isShipped = delivery.status === 'Shipped' || delivery.status === 'ISSUED';

    const itemDefs: any[] = [
        { field: 'material.code', headerName: 'MALZEME KODU', width: 140 },
        { field: 'material.name', headerName: 'MALZEME ADI', flex: 1 },
        { field: 'plant.code', headerName: 'ÜRETİM YERİ', width: 120 },
        { field: 'batchNumber', headerName: 'PARTİ NO', width: 140 },
        {
            field: 'quantity',
            headerName: 'MİKTAR',
            width: 120,
            cellClass: 'text-right font-medium',
            valueFormatter: (p: any) => Number(p.value).toLocaleString('tr-TR')
        },
        { field: 'unit', headerName: 'BİRİM', width: 80 },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <header className="bg-white border-b border-lightning-border p-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-800">{delivery.deliveryNumber}</h1>
                            <span className={`text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-sm ${isShipped ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isShipped ? 'Sevk Edildi' : 'Açık'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{delivery.customer?.name1}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isShipped && (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handlePostGoodsIssue}
                            disabled={pgiMutation.isPending}
                        >
                            <Truck className="w-4 h-4 mr-2" />
                            {pgiMutation.isPending ? 'İşleniyor...' : 'Mal Çıkışı Yap (PGI)'}
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                {/* Header Info */}
                <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Teslimat Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Sipariş Referansı</Label>
                            <div className="mt-1 text-sm font-medium text-lightning-blue">
                                {delivery.salesOrder?.orderNumber || delivery.salesOrderId}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Teslimat Tarihi</Label>
                            <div className="mt-1 text-sm font-medium">
                                {new Date(delivery.deliveryDate).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Sevk Tarihi (PGI)</Label>
                            <div className="mt-1 text-sm font-medium">
                                {delivery.actualGI ? new Date(delivery.actualGI).toLocaleDateString('tr-TR') : '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white p-6 rounded-lg border border-lightning-border shadow-sm h-[500px] flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Teslimat Kalemleri</h2>
                    <div className="flex-1 -mx-2">
                        <AgGridReact
                            className="ag-theme-quartz"
                            theme={themeQuartz}
                            rowData={delivery.items || []}
                            columnDefs={itemDefs}
                            defaultColDef={{ resizable: true, sortable: true }}
                            rowHeight={42}
                            headerHeight={32}
                            overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Kalem bulunamadı</span>'
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
