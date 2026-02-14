'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGLAccounts } from '@/hooks/use-gl-accounts';

export default function GLAccountsPage() {
    const { data, isLoading } = useGLAccounts();
    const [search, setSearch] = useState('');

    const rows = useMemo(() => {
        const list = data || [];
        const q = search.trim().toLowerCase();

        if (!q) return list;

        return list.filter((account) => {
            const code = account.accountNumber?.toLowerCase() || '';
            const name = account.name?.toLowerCase() || '';
            return code.includes(q) || name.includes(q);
        });
    }, [data, search]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <header className="bg-white border-b border-lightning-border p-4 md:px-6 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-lightning-blue rounded-md text-white shadow-sm">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Finans</p>
                        <h1 className="text-2xl font-bold text-slate-800 leading-tight">G/L Hesapları</h1>
                        <p className="text-sm text-slate-500">Muhasebe hesap planı listesi</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-hidden">
                <div className="max-w-[1920px] mx-auto h-full">
                    <div className="flex flex-col h-full bg-white rounded-lg border border-lightning-border overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-lightning-border bg-[#f9fafb]">
                            <Input
                                placeholder="Hızlı arama (hesap kodu / hesap adı)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="max-w-md"
                            />
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 sticky top-0 z-10">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Hesap Kodu</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Hesap Adı</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Tip</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Aktif</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={4} className="p-6 text-center text-slate-500">Yükleniyor...</td></tr>
                                    ) : rows.length === 0 ? (
                                        <tr><td colSpan={4} className="p-6 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                                    ) : (
                                        rows.map((account) => (
                                            <tr key={account.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-700">{account.accountNumber}</td>
                                                <td className="px-4 py-3 text-slate-700">{account.name}</td>
                                                <td className="px-4 py-3 text-slate-600">{account.type}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-sm ${(account.isActive ?? true) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {(account.isActive ?? true) ? 'Evet' : 'Hayır'}
                                                    </span>
                                                </td>
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
