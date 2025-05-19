import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {AuthService} from '../services/auth';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types';

interface AuthContextType {
    authState: AuthState;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (userData: Partial<User>) => Promise<void>;
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
};

// Actions
type AuthAction =
    | { type: 'LOGIN_SUCCESS'; payload: User }
    | { type: 'REGISTER_SUCCESS'; payload: User }
    | { type: 'AUTH_ERROR'; payload: string }
    | { type: 'USER_LOADED'; payload: User }
    | { type: 'LOGOUT' }
    | { type: 'CLEAR_ERROR' }
    | { type: 'PROFILE_UPDATED'; payload: User };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'USER_LOADED':
        case 'LOGIN_SUCCESS':
        case 'REGISTER_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
                loading: false,
                error: null,
            };
        case 'PROFILE_UPDATED':
            return {
                ...state,
                user: action.payload,
                loading: false,
                error: null,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                loading: false,
                error: action.payload,
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const loadUser = async () => {
            try {
                if (AuthService.isAuthenticated()) {
                    try {
                        const user = await AuthService.getCurrentUser();
                        dispatch({ type: 'USER_LOADED', payload: user });
                    } catch (error) {
                        const localUser = AuthService.getUser();
                        if (localUser) {
                            dispatch({ type: 'USER_LOADED', payload: localUser });
                        } else {
                            AuthService.removeToken(); // Token invalide, on le supprime
                            dispatch({ type: 'AUTH_ERROR', payload: 'Session expirée' });
                        }
                    }
                } else {
                    dispatch({ type: 'AUTH_ERROR', payload: 'Non authentifié' });
                }
            } catch (error) {
                console.log(error)
                console.error('Error loading user:', error);
                dispatch({ type: 'AUTH_ERROR', payload: 'Erreur lors du chargement de l\'utilisateur' });
            }
        };

        loadUser();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const user = await AuthService.login(credentials);
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error: any) {
            dispatch({
                type: 'AUTH_ERROR',
                payload: error.response?.data?.message || 'Erreur de connexion',
            });
        }
    };

    const register = async (credentials: RegisterCredentials) => {
        try {
            const user = await AuthService.register(credentials);
            dispatch({ type: 'REGISTER_SUCCESS', payload: user });
        } catch (error: any) {
            dispatch({
                type: 'AUTH_ERROR',
                payload: error.response?.data?.message || 'Erreur d\'inscription',
            });
        }
    };

    const logout = async () => {
        try {
            await AuthService.logout();
            dispatch({ type: 'LOGOUT' });
        } catch (error) {
            console.error('Erreur lors de la déconnexion', error);
            dispatch({ type: 'LOGOUT' });
        }
    };

    const updateProfile = async (userData: Partial<User>) => {
        try {
            const updatedUser = await AuthService.updateProfile(userData);
            dispatch({ type: 'PROFILE_UPDATED', payload: updatedUser });
        } catch (error: any) {
            dispatch({
                type: 'AUTH_ERROR',
                payload: error.response?.data?.message || 'Erreur de mise à jour du profil',
            });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                authState,
                login,
                register,
                logout,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;