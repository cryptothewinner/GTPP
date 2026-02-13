'use client';

import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Search } from 'lucide-react';
import { useBatchDetail, useBatchList, type ProductionBatch } from '@/hooks/use-batches';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Beklemede',
    IN_PRODUCTION: 'Üretimde',
    QC_PENDING: 'KK Bekliyor',
    QC_PASSED: 'KK Onaylı',
    QC_FAILED: 'KK Reddedildi',
    RELEASED: 'Serbest',
    REJECTED: 'Red',
};

export default function ProductionBatchesPage() {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const listQuery = useBatchList({ page: 1, pageSize: 50, search });
    const batches = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data]);

    useEffect(() => {
        if (!batches.length) {
            setSelectedId(null);
            return;
        }

        if (!selectedId || !batches.some((batch) => batch.id === selectedId)) {
            setSelectedId(batches[0].id);
        }
    }, [batches, selectedId]);

    const detailQuery = useBatchDetail(selectedId);
    const detail = detailQuery.data?.data;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <FlaskConical className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Üretim Partileri</h1>
                    <p className="text-sm text-slate-500">Aktif parti listesi ve parti detay kırılımı</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <section className="xl:col-span-1 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            className="pl-9"
                            placeholder="Parti no veya lokasyon ara"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[70vh] overflow-auto space-y-2">
                        {batches.map((batch: ProductionBatch) => (
                            <button
                                type="button"
                                key={batch.id}
                                onClick={() => setSelectedId(batch.id)}
                                className={`w-full text-left rounded-lg border p-3 transition ${selectedId === batch.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <p className="font-semibold text-slate-900">{batch.batchNumber}</p>
                                    <Badge variant="outline">{STATUS_LABELS[batch.status] ?? batch.status}</Badge>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{batch.productionOrder?.orderNumber ?? '-'}</p>
                                <p className="text-xs text-slate-500 mt-1">{batch.productionLocation ?? '-'}</p>
                            </button>
                        ))}

                        {!batches.length && (
                            <div className="text-sm text-slate-500 py-6 text-center">Parti bulunamadı.</div>
                        )}
                    </div>
                </section>

                <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-4 space-y-6">
                    {!detail && (
                        <div className="text-sm text-slate-500">Detay görmek için listeden bir parti seçin.</div>
                    )}

                    {detail && (
                        <>
                            <div className="grid md:grid-cols-2 gap-4">
                                <InfoCard title="Üretim Partisi Bilgileri" rows={[
                                    ['Parti No', detail.batchNumber],
                                    ['Durum', STATUS_LABELS[detail.status] ?? detail.status],
                                    ['Üretim Hattı / Lokasyon', detail.productionLocation ?? '-'],
                                    ['Miktar', `${detail.quantity} ${detail.unit}`],
                                ]} />
                                <InfoCard title="Bağlı Üretim Emri ve Reçete" rows={[
                                    ['Üretim Emri', detail.productionOrder?.orderNumber ?? '-'],
                                    ['Ürün', detail.productionOrder?.product?.name ?? '-'],
                                    ['Reçete', detail.productionOrder?.recipe?.name ?? '-'],
                                    ['Reçete Kodu', detail.productionOrder?.recipe?.code ?? '-'],
                                ]} />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-slate-900 mb-2">Tüketilen Malzeme Partileri</h2>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="text-left px-3 py-2">Malzeme Kodu</th>
                                                <th className="text-left px-3 py-2">Malzeme Adı</th>
                                                <th className="text-left px-3 py-2">Malzeme Parti No</th>
                                                <th className="text-left px-3 py-2">Tedarikçi Lot No</th>
                                                <th className="text-right px-3 py-2">Tüketim Miktarı</th>
                                                <th className="text-left px-3 py-2">Depo Lokasyonu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.consumptions?.length ? detail.consumptions.map((item) => (
                                                <tr key={item.id} className="border-t border-slate-100">
                                                    <td className="px-3 py-2">{item.materialBatch.material.code}</td>
                                                    <td className="px-3 py-2">{item.materialBatch.material.name}</td>
                                                    <td className="px-3 py-2 font-mono text-xs">{item.materialBatch.batchNumber}</td>
                                                    <td className="px-3 py-2 font-mono text-xs">{item.materialBatch.supplierLotNo ?? '-'}</td>
                                                    <td className="px-3 py-2 text-right">{item.consumedQuantity} {item.unit}</td>
                                                    <td className="px-3 py-2">{item.materialStorageLocation ?? '-'}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                                                        Bu parti için tüketim kaydı bulunamadı.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
    return (
        <div className="border border-slate-200 rounded-lg p-4">
            <h2 className="font-semibold text-slate-900 mb-2">{title}</h2>
            <div className="space-y-2">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-slate-900 text-right">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
