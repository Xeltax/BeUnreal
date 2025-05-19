import api from './api';
import { LoginCredentials, RegisterCredentials, User } from '../types';

const TOKEN_KEY = 'beunreal_token';
const USER_KEY = 'beunreal_user';

export const AuthService = {
    setToken: (token: string): void => {
        localStorage.setItem(TOKEN_KEY, token);
    },

    getToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },

    removeToken: (): void => {
        localStorage.removeItem(TOKEN_KEY);
    },

    setUser: (user: User): void => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getUser: (): User | null => {
        const userStr = localStorage.getItem(USER_KEY);
        console.log('User from localStorage:', userStr);
        return userStr ? JSON.parse(userStr) : null;
    },

    removeUser: (): void => {
        localStorage.removeItem(USER_KEY);
    },

    isAuthenticated: (): boolean => {
        return !!AuthService.getToken();
    },

    login: async (credentials: LoginCredentials): Promise<User> => {
        try {
            const response = await api.post('/users/login', credentials);
            const { token, user } = response.data;
            console.log('Login response:', response.data);

            AuthService.setToken(token);
            AuthService.setUser(user);

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (credentials: RegisterCredentials): Promise<User> => {
        try {
            const response = await api.post('/users/register', credentials);
            const { token, user } = response.data;

            AuthService.setToken(token);
            AuthService.setUser(user);

            return user;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        try {
            await api.post('/users/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            AuthService.removeToken();
            AuthService.removeUser();
        }
    },

    getCurrentUser: async (): Promise<User> => {
        const localUser = AuthService.getUser();

        if (localUser) {
            return Promise.resolve(localUser);
        }

        try {
            const response = await api.get('/users/me');
            const user = response.data.user;

            AuthService.setUser(user);

            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    },

    updateProfile: async (userData: Partial<User>): Promise<User> => {
        try {
            const response = await api.put('/users/profile', userData);
            const updatedUser = response.data.user;

            const currentUser = AuthService.getUser();
            if (currentUser) {
                AuthService.setUser({ ...currentUser, ...updatedUser });
            }

            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
};