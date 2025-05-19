export interface User {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    bio?: string;
    createdAt: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface Friend {
    id : number
    profilePicture: string
    username : string
}