'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LightningShell } from '@/components/layout/lightning-shell';
import { useAuth } from '@/providers/auth-provider';
import { ROLE_PRIORITY, UserRole, normalizeUserRole } from '@sepenatural/shared';

const ROUTE_ROLE_REQUIREMENTS: Array<{ prefix: string; minRole: UserRole }> = [
    { prefix: '/finance', minRole: UserRole.ADMIN },
    { prefix: '/sales', minRole: UserRole.OPERATOR },
    { prefix: '/purchasing', minRole: UserRole.OPERATOR },
    { prefix: '/production/planning', minRole: UserRole.PRODUCTION_MANAGER },
    { prefix: '/production/plans', minRole: UserRole.PRODUCTION_MANAGER },
    { prefix: '/production/definitions', minRole: UserRole.PRODUCTION_MANAGER },
];

function getRequiredRole(pathname: string): UserRole {
    const matched = ROUTE_ROLE_REQUIREMENTS.find((rule) => pathname.startsWith(rule.prefix));
    return matched?.minRole ?? UserRole.VIEWER;
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

    const currentRole = normalizeUserRole(user?.role);
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
