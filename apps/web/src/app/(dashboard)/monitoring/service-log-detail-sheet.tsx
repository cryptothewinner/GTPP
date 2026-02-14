'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    ServiceLog,
    useServiceLogDetail,
    useRetryServiceLog,
    useArchiveServiceLog,
} from '@/hooks/use-service-logs';
import {
    Loader2,
    Copy,
    RotateCcw,
    Archive,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    Globe,
    User,
    Hash,
} from 'lucide-react';

interface ServiceLogDetailSheetProps {
    logId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    SUCCESS: { label: 'Başarılı', className: 'bg-emerald-500' },
    FAILED: { label: 'Hatalı', className: 'bg-rose-500' },
    PENDING_RETRY: { label: 'Yeniden Denenecek', className: 'bg-amber-500' },
    RETRIED: { label: 'Yeniden Denendi', className: 'bg-blue-500' },
    ARCHIVED: { label: 'Arşivlendi', className: 'bg-slate-500' },
};

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-emerald-600 bg-emerald-50',
    POST: 'text-blue-600 bg-blue-50',
    PUT: 'text-amber-600 bg-amber-50',
    PATCH: 'text-orange-600 bg-orange-50',
    DELETE: 'text-rose-600 bg-rose-50',
};

export function ServiceLogDetailSheet({
    logId,
    open,
    onOpenChange,
}: ServiceLogDetailSheetProps) {
    const { data: response, isLoading } = useServiceLogDetail(logId);
    const retryMutation = useRetryServiceLog();
    const archiveMutation = useArchiveServiceLog();

    const log: ServiceLog | null = response
        ? 'data' in (response as any)
            ? (response as any).data
            : (response as ServiceLog)
        : null;

    if (!open) return null;

    const handleCopy = (content: unknown) => {
        navigator.clipboard.writeText(
            typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        );
    };

    const handleRetry = () => {
        if (logId) retryMutation.mutate(logId);
    };

    const handleArchive = () => {
        if (logId) {
            archiveMutation.mutate(logId);
            onOpenChange(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6">
                    <SheetHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
                                    {log?.direction === 'INBOUND' ? (
                                        <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                                    ) : (
                                        <ArrowUpRight className="w-5 h-5 text-orange-400" />
                                    )}
                                    <span
                                        className={`text-sm font-mono px-2 py-0.5 rounded ${METHOD_COLORS[log?.method || ''] || 'text-slate-400 bg-slate-800'}`}
                                    >
                                        {log?.method}
                                    </span>
                                    <span className="text-sm font-mono text-slate-300 truncate max-w-[300px]">
                                        {log?.endpoint}
                                    </span>
                                </SheetTitle>
                                <SheetDescription className="text-slate-400 mt-1">
                                    {log?.createdAt
                                        ? new Date(log.createdAt).toLocaleString('tr-TR')
                                        : 'Yükleniyor...'}
                                </SheetDescription>
                            </div>
                            {log && (
                                <Badge
                                    className={`${STATUS_CONFIG[log.status]?.className || 'bg-slate-500'} border-none`}
                                >
                                    {STATUS_CONFIG[log.status]?.label || log.status}
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
                    ) : log ? (
                        <div className="space-y-6">
                            {/* Aksiyonlar */}
                            {(log.status === 'FAILED' ||
                                log.status === 'PENDING_RETRY') && (
                                <div className="flex gap-2">
                                    {log.isRetriable && (
                                        <Button
                                            onClick={handleRetry}
                                            disabled={retryMutation.isPending}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {retryMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                            )}
                                            Yeniden Dene
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleArchive}
                                        disabled={archiveMutation.isPending}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Archive className="w-4 h-4 mr-2" />
                                        Arşivle
                                    </Button>
                                </div>
                            )}

                            {/* Özet Bilgiler */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard
                                    icon={<Clock className="w-4 h-4 text-slate-400" />}
                                    label="Süre"
                                    value={`${log.durationMs} ms`}
                                />
                                <InfoCard
                                    icon={<Globe className="w-4 h-4 text-slate-400" />}
                                    label="Durum Kodu"
                                    value={String(log.statusCode)}
                                    valueClass={
                                        log.statusCode >= 400
                                            ? 'text-rose-600'
                                            : 'text-emerald-600'
                                    }
                                />
                                <InfoCard
                                    icon={<User className="w-4 h-4 text-slate-400" />}
                                    label="IP / Kullanıcı"
                                    value={`${log.clientIp || '-'} / ${log.userId || '-'}`}
                                />
                                <InfoCard
                                    icon={<Hash className="w-4 h-4 text-slate-400" />}
                                    label="Trace ID"
                                    value={log.traceId || '-'}
                                />
                            </div>

                            {/* Hata Mesajı */}
                            {log.errorMessage && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-sm font-semibold text-rose-600 mb-2">
                                            Hata Mesajı
                                        </h3>
                                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800 font-mono">
                                            {log.errorMessage}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Retry Bilgisi */}
                            {log.retryCount > 0 && (
                                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                    Bu istek <strong>{log.retryCount}</strong> kez yeniden
                                    denendi.
                                </div>
                            )}

                            <Separator />

                            {/* Request Body */}
                            <JsonSection
                                title="Request Body"
                                data={log.requestBody}
                                onCopy={handleCopy}
                            />

                            {/* Response Body */}
                            <JsonSection
                                title="Response Body"
                                data={log.responseBody}
                                onCopy={handleCopy}
                            />

                            {/* Request Headers */}
                            <JsonSection
                                title="Request Headers"
                                data={log.requestHeaders}
                                onCopy={handleCopy}
                                collapsed
                            />

                            {/* Response Headers */}
                            <JsonSection
                                title="Response Headers"
                                data={log.responseHeaders}
                                onCopy={handleCopy}
                                collapsed
                            />
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            Log detayları bulunamadı.
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

function InfoCard({
    icon,
    label,
    value,
    valueClass,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium uppercase mb-1">
                {icon} {label}
            </div>
            <div
                className={`text-sm font-bold truncate ${valueClass || 'text-slate-900'}`}
            >
                {value}
            </div>
        </div>
    );
}

function JsonSection({
    title,
    data,
    onCopy,
    collapsed = false,
}: {
    title: string;
    data: unknown;
    onCopy: (content: unknown) => void;
    collapsed?: boolean;
}) {
    if (!data) return null;

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    return (
        <details open={!collapsed}>
            <summary className="text-sm font-semibold text-slate-900 cursor-pointer select-none flex items-center justify-between mb-2">
                <span>{title}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={(e) => {
                        e.preventDefault();
                        onCopy(data);
                    }}
                >
                    <Copy className="w-3 h-3 mr-1" />
                    Kopyala
                </Button>
            </summary>
            <pre className="bg-slate-950 text-slate-200 rounded-lg p-4 text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
                {content}
            </pre>
        </details>
    );
}
