'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await login(email, password);
            router.push('/');
        } catch {
            setError('Giriş başarısız. E-posta veya parola hatalı.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-[70vh] items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm space-y-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Giriş Yap</h1>
                    <p className="text-sm text-slate-500">SepeNatural 2026 paneline erişin.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="email">E-posta</label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="admin@sepenatural.com"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="password">Parola</label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
            </form>
        </div>
    );
}
