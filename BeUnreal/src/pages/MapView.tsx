import React, {useEffect, useRef} from 'react';
import {IonContent, IonPage, useIonToast} from '@ionic/react';
import L from 'leaflet';
import {Geolocation} from '@capacitor/geolocation';
import 'leaflet/dist/leaflet.css';
import {Capacitor} from "@capacitor/core";

const MapView: React.FC = () => {
    const [present] = useIonToast();
    const mapRef = useRef<L.Map | null>(null);

    const initializeMap = (lat: number, lng: number, message?: string) => {
        if (mapRef.current) {
            mapRef.current.remove();
        }

        const map = L.map('map', {
            center: [lat, lng],
            zoom: 11,
            zoomControl: true,
        });

        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    };

    useEffect(() => {
        const loadMap = async () => {
            try {
                let coords: { latitude: number; longitude: number };

                if (Capacitor.getPlatform() === 'web') {
                    // Utilisation de l'API native navigateur
                    coords = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            (position) =>
                                resolve({
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                }),
                            (error) => reject(error),
                            { enableHighAccuracy: true, timeout: 10000 }
                        );
                    });
                } else {
                    // Appareil mobile (iOS/Android)
                    const position = await Geolocation.getCurrentPosition({
                        enableHighAccuracy: true,
                        timeout: 10000,
                    });
                    coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                }

                initializeMap(coords.latitude, coords.longitude);
            } catch (error) {
                console.warn('Erreur de géolocalisation :', error);
                present({
                    message:
                        'Impossible d\'obtenir votre position. Affichage de la carte par défaut.',
                    duration: 3000,
                    position: 'bottom',
                    color: 'warning',
                });

                // Fallback : Paris
                initializeMap(48.866667, 2.333333, 'Position par défaut : Paris');
            }
        };

        loadMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [present]);

    return (
        <IonPage>
            <IonContent>
                <div
                    id="map"
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                    }}
                ></div>
            </IonContent>
        </IonPage>
    );
};

export default MapView;