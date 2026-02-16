'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserRole } from '@sepenatural/shared';
import { apiClient } from '@/lib/api-client';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const checkAuth = async () => {
            if (apiClient.isAuthenticated()) {
                try {
                    const profile = await apiClient.get<any>('/auth/me');
                    setUser(profile.data);
                } catch {
                    apiClient.logout();
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const result = await apiClient.login(email, password);
        setUser(result.user);
    }, []);

    const logout = useCallback(() => {
        apiClient.logout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
