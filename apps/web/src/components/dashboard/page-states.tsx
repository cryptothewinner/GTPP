import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

function StateContainer({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: StateProps & { icon: ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center flex flex-col items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">{icon}</div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 max-w-lg">{description}</p>
            {actionLabel && onAction && (
                <Button className="mt-2" variant="outline" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

export function PageLoadingState({ title = 'Veriler yükleniyor...' }: { title?: string }) {
    return (
        <StateContainer
            icon={<Loader2 className="w-5 h-5 animate-spin" />}
            title={title}
            description="Lütfen bekleyin, sayfa içeriği hazırlanıyor."
        />
    );
}

export function PageEmptyState({ title, description, actionLabel, onAction }: StateProps) {
    return <StateContainer icon={<Inbox className="w-5 h-5" />} title={title} description={description} actionLabel={actionLabel} onAction={onAction} />;
}

export function PageErrorState({ title, description, actionLabel, onAction }: StateProps) {
    return <StateContainer icon={<AlertTriangle className="w-5 h-5 text-rose-600" />} title={title} description={description} actionLabel={actionLabel} onAction={onAction} />;
}
