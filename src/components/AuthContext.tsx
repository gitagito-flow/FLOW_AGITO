import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, AuthUser, getStoredUser, getAuthToken, ApiError } from '@/lib/api';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check auth status on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check current session
                const currentUser = await authApi.me();
                setUser(currentUser);
            } catch (error) {
                // Not authenticated
                setUser(null);
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        setUser(response.user);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const response = await authApi.register({ email, password, name });
        setUser(response.user);
    }, []);

    const logout = useCallback(() => {
        authApi.logout();
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (data: { name?: string; avatarUrl?: string }) => {
        const updatedUser = await authApi.updateProfile(data);
        setUser(prev => prev ? { ...prev, ...updatedUser } : null);
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
