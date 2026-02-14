'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJournalEntries } from '@/hooks/use-journal-entries';

export default function JournalEntriesPage() {
    const router = useRouter();
    const { data, isLoading } = useJournalEntries();

    const rows = useMemo(() => {
        return (data || []).map((entry) => {
            const totalDebit = (entry.items || []).reduce((sum, item) => sum + Number(item.debit || 0), 0);
            const totalCredit = (entry.items || []).reduce((sum, item) => sum + Number(item.credit || 0), 0);
            return { ...entry, totalDebit, totalCredit };
        });
    }, [data]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-lightning-blue rounded-md text-white shadow-sm">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Finans</p>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Yevmiye Kayıtları</h1>
                            <p className="text-sm text-slate-500">Muhasebe fişlerinin listesi</p>
                        </div>
                    </div>
                    <Button className="bg-lightning-blue hover:bg-blue-600" onClick={() => router.push('/finance/journal-entries/new')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Fiş
                    </Button>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <div className="flex flex-col h-full bg-white rounded-lg border border-lightning-border overflow-hidden shadow-sm">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 sticky top-0 z-10">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Fiş No</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Kayıt Tarihi</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Referans</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Durum</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Toplam Borç/Alacak</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">PB</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="p-6 text-center text-slate-500">Yükleniyor...</td></tr>
                                    ) : rows.length === 0 ? (
                                        <tr><td colSpan={6} className="p-6 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                                    ) : (
                                        rows.map((entry) => (
                                            <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-lightning-blue">{entry.entryNumber}</td>
                                                <td className="px-4 py-3 text-slate-700">{entry.postingDate ? new Date(entry.postingDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                <td className="px-4 py-3 text-slate-700">{entry.reference || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{entry.status}</td>
                                                <td className="px-4 py-3 text-slate-700 font-medium">
                                                    {entry.totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /
                                                    {' '}
                                                    {entry.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">{entry.currency}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
