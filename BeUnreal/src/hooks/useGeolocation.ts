import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    loading: boolean;
}

export const useGeolocation = () => {
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        error: null,
        loading: true,
    });

    const getCurrentPosition = async () => {
        try {
            setLocation(prev => ({ ...prev, loading: true }));
            const position = await Geolocation.getCurrentPosition();
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                error: null,
                loading: false,
            });
            return position;
        } catch (error) {
            setLocation({
                latitude: null,
                longitude: null,
                error: (error as Error).message,
                loading: false,
            });
            throw error;
        }
    };

    useEffect(() => {
        getCurrentPosition();
    }, []);

    return { ...location, getCurrentPosition };
};