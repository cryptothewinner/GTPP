'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LightningShell } from '@/components/layout/lightning-shell';
import { useAuth } from '@/providers/auth-provider';

const ROLE_PRIORITY: Record<string, number> = {
    viewer: 10,
    operator: 20,
    warehouse_operator: 20,
    quality_manager: 30,
    production_manager: 30,
    admin: 40,
    super_admin: 50,
};

const ROUTE_ROLE_REQUIREMENTS: Array<{ prefix: string; minRole: keyof typeof ROLE_PRIORITY }> = [
    { prefix: '/finance', minRole: 'admin' },
    { prefix: '/sales', minRole: 'operator' },
    { prefix: '/purchasing', minRole: 'operator' },
    { prefix: '/production/planning', minRole: 'production_manager' },
    { prefix: '/production/plans', minRole: 'production_manager' },
    { prefix: '/production/definitions', minRole: 'production_manager' },
];

function normalizeRole(role: string | undefined): keyof typeof ROLE_PRIORITY | null {
    if (!role) return null;

    const normalized = role.toLowerCase();
    if (normalized in ROLE_PRIORITY) {
        return normalized as keyof typeof ROLE_PRIORITY;
    }

    if (normalized === 'manager') return 'production_manager';
    return null;
}

function getRequiredRole(pathname: string): keyof typeof ROLE_PRIORITY {
    const matched = ROUTE_ROLE_REQUIREMENTS.find((rule) => pathname.startsWith(rule.prefix));
    return matched?.minRole ?? 'viewer';
}

export function ShellGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading } = useAuth();

    if (pathname.startsWith('/login')) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
                Oturum doğrulanıyor...
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-900">Yetkilendirme gerekli</h1>
                    <p className="mt-2 text-sm text-slate-600">Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
                    <Link
                        href="/login"
                        className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Giriş sayfasına git
                    </Link>
                </div>
            </div>
        );
    }

    const currentRole = normalizeRole(user?.role);
    const requiredRole = getRequiredRole(pathname);

    if (!currentRole || ROLE_PRIORITY[currentRole] < ROLE_PRIORITY[requiredRole]) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-900">Erişim yetkiniz yok</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Bu sayfa için gereken rol: <strong>{requiredRole}</strong>
                    </p>
                    <Link
                        href="/"
                        className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Ana sayfaya dön
                    </Link>
                </div>
            </div>
        );
    }

    return <LightningShell>{children}</LightningShell>;
}
