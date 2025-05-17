import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '../services/auth';

interface User {
    id: number;
    username: string;
    email: string;
    profilePicture?: string;
    bio?: string;
    latitude?: number;
    longitude?: number;
    lastActive?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        loading: true,
        error: null,
    });

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('userToken');

        if (!token) {
            setAuthState({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            });
            return;
        }

        try {
            setAuthState(prev => ({ ...prev, loading: true }));
            const userData = await getUserProfile();

            setAuthState({
                user: userData,
                isAuthenticated: true,
                loading: false,
                error: null,
            });
        } catch {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userId');

            setAuthState({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: 'Session expirée. Veuillez vous reconnecter.',
            });
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');

        setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        });
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    return {
        ...authState,
        loadUser,
        logout,
    };
};