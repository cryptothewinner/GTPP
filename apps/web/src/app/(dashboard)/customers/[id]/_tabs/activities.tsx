
import React, { useState } from 'react';
import { useCustomerActivities, useAddCustomerActivity } from '@/hooks/use-customers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, Calendar, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function CustomerActivitiesTab({ customerId }: { customerId: string }) {
    const { data: activities, isLoading } = useCustomerActivities(customerId);
    const addActivityMutation = useAddCustomerActivity();

    const [isAdding, setIsAdding] = useState(false);
    const [newActivity, setNewActivity] = useState({
        type: 'NOTE',
        subject: '',
        description: '',
        status: 'COMPLETED'
    });

    const handleSubmit = async () => {
        if (!newActivity.subject) return;
        await addActivityMutation.mutateAsync({
            customerId,
            ...newActivity,
            performedAt: new Date().toISOString()
        } as any);
        setIsAdding(false);
        setNewActivity({ type: 'NOTE', subject: '', description: '', status: 'COMPLETED' });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CALL': return <Phone className="w-4 h-4 text-blue-500" />;
            case 'EMAIL': return <Mail className="w-4 h-4 text-purple-500" />;
            case 'MEETING': return <Calendar className="w-4 h-4 text-orange-500" />;
            case 'TASK': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default: return <MessageSquare className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Aktivite Zaman Çizelgesi</h3>
                    <Button size="sm" onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "default"}>
                        {isAdding ? 'İptal' : 'Yeni Aktivite Ekle'}
                    </Button>
                </div>

                {isAdding && (
                    <Card className="border-blue-200 bg-blue-50/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Yeni Etkileşim Kaydet</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    value={newActivity.type}
                                    onValueChange={(val) => setNewActivity({ ...newActivity, type: val })}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Tür seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CALL">Telefon Görüşmesi</SelectItem>
                                        <SelectItem value="EMAIL">E-posta</SelectItem>
                                        <SelectItem value="MEETING">Toplantı</SelectItem>
                                        <SelectItem value="NOTE">Not</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={newActivity.status}
                                    onValueChange={(val) => setNewActivity({ ...newActivity, status: val })}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Durum" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                                        <SelectItem value="PLANNED">Planlandı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input
                                placeholder="Konu (Örn: Fiyat teklifi hk.)"
                                className="bg-white"
                                value={newActivity.subject}
                                onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                            />
                            <Textarea
                                placeholder="Detaylı açıklama..."
                                className="bg-white min-h-[100px]"
                                value={newActivity.description}
                                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                            />
                            <div className="flex justify-end">
                                <Button size="sm" onClick={handleSubmit} disabled={addActivityMutation.isPending}>
                                    {addActivityMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 py-2">
                    {activities?.map((activity: any) => (
                        <div key={activity.id} className="relative group">
                            <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-400 group-hover:shadow transition-colors">
                                {getIcon(activity.type)}
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-800 text-sm">{activity.subject}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${activity.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {activity.status === 'COMPLETED' ? 'Tamamlandı' : 'Planlandı'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(activity.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                    </span>
                                </div>
                                {activity.description && (
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{activity.description}</p>
                                )}
                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                        SU
                                    </div>
                                    <span>System User tarafından oluşturuldu</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {(!activities || activities.length === 0) && (
                        <div className="text-center py-8 text-slate-500 text-sm italic">
                            Henüz kayıtlı bir aktivite yok.
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold">Özet İstatistikler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Bu Ayki Görüşmeler</span>
                            <span className="font-bold">0</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Açık Görevler</span>
                            <span className="font-bold text-blue-600">0</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Son İletişim</span>
                            <span className="text-slate-700 font-medium">-</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
