import api from './api';

interface RegisterData {
    username: string;
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface AuthResponse {
    id: number;
    username: string;
    email: string;
    token: string;
}

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/users/register', userData);
    console.log(response);
    return response.data;
};

export const login = async (userData: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/users/login', userData);
    return response.data;
};

export const getUserProfile = async (): Promise<any> => {
    const response = await api.get('/users/profile');
    return response.data;
};

export const updateUserProfile = async (userData: any): Promise<any> => {
    const response = await api.put('/users/profile', userData);
    return response.data;
};

export const deleteUserAccount = async (): Promise<any> => {
    const response = await api.delete('/users/profile');
    return response.data;
};

export const searchUsers = async (query: string): Promise<any[]> => {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
};

export const findNearbyUsers = async (latitude: number, longitude: number, distance?: number): Promise<any[]> => {
    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
    });

    if (distance) {
        params.append('distance', distance.toString());
    }

    const response = await api.get(`/users/nearby?${params.toString()}`);
    return response.data;
};

export const updateUserLocation = async (latitude: number, longitude: number): Promise<any> => {
    const response = await api.put('/users/location', { latitude, longitude });
    return response.data;
};