
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StickyNote, Plus, X, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAddCustomerNote } from '@/hooks/use-customers';

interface Note {
    id: string;
    content: string;
    isPinned: boolean;
    createdAt: Date;
    createdBy: string;
}

export default function CustomerNotesWidget({ customerId, initialNotes = [] }: { customerId: string, initialNotes?: any[] }) {
    const [notes, setNotes] = useState<Note[]>(initialNotes.map(n => ({
        id: n.id,
        content: n.content,
        isPinned: n.isPinned,
        createdAt: new Date(n.createdAt),
        createdBy: n.createdBy
    })));
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState('');

    // Update local state when initialNotes changes (e.g. refetch)
    React.useEffect(() => {
        if (initialNotes) {
            setNotes(initialNotes.map(n => ({
                id: n.id,
                content: n.content,
                isPinned: n.isPinned,
                createdAt: new Date(n.createdAt),
                createdBy: n.createdBy
            })));
        }
    }, [initialNotes]);

    const addNoteMutation = useAddCustomerNote();

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        addNoteMutation.mutate({
            customerId,
            note: { content: newNote }
        }, {
            onSuccess: () => {
                setNewNote('');
                setIsAdding(false);
            }
        });
    };

    const togglePin = (id: string) => {
        setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    };

    return (
        <Card className="h-full flex flex-col shadow-sm border-l border-y-0 border-r-0 rounded-none bg-slate-50/50">
            <CardHeader className="py-3 px-4 border-b bg-white flex flex-row items-center justify-between sticky top-0 z-10 shrink-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-amber-500" />
                    Notlar
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                        {isAdding && (
                            <div className="bg-white p-3 rounded-lg border shadow-sm animate-in slide-in-from-top-2">
                                <Textarea
                                    placeholder="Notunuzu buraya yazın..."
                                    className="min-h-[80px] text-xs resize-none mb-2 focus-visible:ring-1"
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs">İptal</Button>
                                    <Button size="sm" onClick={handleAddNote} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">Ekle</Button>
                                </div>
                            </div>
                        )}

                        {notes.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-400">
                                Henüz not eklenmemiş.
                            </div>
                        ) : (
                            notes.sort((a, b) => (Number(b.isPinned) - Number(a.isPinned))).map(note => (
                                <div key={note.id} className={`group relative p-3 rounded-lg border text-sm ${note.isPinned ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <span className="font-semibold text-xs text-slate-700">{note.createdBy}</span>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {formatDistanceToNow(note.createdAt, { addSuffix: true, locale: tr })}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-xs">{note.content}</p>

                                    <button
                                        onClick={() => togglePin(note.id)}
                                        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-100 ${note.isPinned ? 'opacity-100 text-amber-500' : 'text-slate-400'}`}
                                    >
                                        <Pin className="w-3 h-3 fill-current" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
