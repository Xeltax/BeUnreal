import { AuthUser } from '../types/AuthType';

export const setToken = (token: string): void => {
    localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const setUser = (user: AuthUser): void => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): AuthUser | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr) as AuthUser;
    } catch (error) {
        return null;
    }
};

export const clearStorage = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const setItem = (key: string, value: any): void => {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const getItem = <T>(key: string, defaultValue: T | null = null): T | null => {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    try {
        return JSON.parse(item) as T;
    } catch (error) {
        // Si ce n'est pas un JSON valide, retourne la chaîne brute
        return item as unknown as T;
    }
};

export const removeItem = (key: string): void => {
    localStorage.removeItem(key);
};