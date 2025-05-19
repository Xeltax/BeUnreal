import React, {useEffect, useRef, useState} from 'react';
import { IonPage, IonContent, useIonToast } from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import StoryModal from "../components/StoryModal";

interface Story {
    id: string;
    lat: number;
    lng: number;
    videoUrl?: string;
    photoUrl?: string;
    username: string;
    city: string;
}

const fakeStories: Story[] = [
    // 20 stories très proches du centre (rayon ~200m)
    ...Array.from({ length: 100 }).map((_, i) => ({
        id: `center-${i + 1}`,
        lat: 49.182863 + (Math.random() - 0.5) * 0.008, // ~±0.0015 degrés ~ ±150m
        lng: -0.370679 + (Math.random() - 0.5) * 0.008,
        videoUrl: i % 2 === 0
            ? 'https://www.w3schools.com/html/mov_bbb.mp4'
            : 'https://www.w3schools.com/html/movie.mp4',
        username: "Ewennn",
        city: "Caen",
    })),
    // 10 stories autour du centre (rayon ~1.5-2km)
    ...Array.from({ length: 10 }).map((_, i) => ({
        id: `outer-${i + 1}`,
        lat: 49.182863 + (Math.random() - 0.5) * 0.02, // ~±0.01 degrés ~ ±1km
        lng: -0.370679 + (Math.random() - 0.5) * 0.02,
        videoUrl: i % 2 === 0
            ? 'https://www.w3schools.com/html/mov_bbb.mp4'
            : 'https://www.w3schools.com/html/movie.mp4',
        username: "Ewennn",
        city: "Caen",
    })),
];

const MapView: React.FC = () => {
    const [present] = useIonToast();
    const mapRef = useRef<L.Map | null>(null);
    const [selectedStories, setSelectedStories] = useState<Story[]>([]);

    const initializeMap = (lat: number, lng: number) => {
        if (mapRef.current) {
            mapRef.current.remove();
        }

        const map = L.map('map', {
            center: [lat, lng],
            zoom: 14,
            zoomControl: true,
        });

        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const heatPoints = fakeStories.map((s) => [s.lat, s.lng, 0.8]);
        // @ts-ignore
        L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);

        map.on('click', (e: L.LeafletMouseEvent) => {
            const { latlng } = e;

            const found = fakeStories
                .filter((story) => {
                    const dist = map.distance(latlng, L.latLng(story.lat, story.lng));
                    return dist < 80;
                })
                .slice(0, 10); // max 10 stories

            if (found.length > 0) {
                setSelectedStories(found);
            }
        });

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    };

    useEffect(() => {
        const loadMap = async () => {
            try {
                let coords: { latitude: number; longitude: number };

                if (Capacitor.getPlatform() === 'web') {
                    coords = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                            (err) => reject(err),
                            { enableHighAccuracy: true, timeout: 10000 }
                        );
                    });
                } else {
                    const position = await Geolocation.getCurrentPosition();
                    coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                }

                initializeMap(coords.latitude, coords.longitude);
            } catch (error) {
                console.warn('Erreur de géolocalisation :', error);
                await present({
                    message: 'Impossible d\'obtenir votre position. Affichage sur Caen par défaut.',
                    duration: 3000,
                    position: 'bottom',
                    color: 'warning',
                });

                initializeMap(49.182863, -0.370679);
            }
        };

        loadMap().finally();

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

                {selectedStories.length > 0 && (
                    <StoryModal
                        isOpen={true}
                        onClose={() => setSelectedStories([])}
                        stories={selectedStories}
                    />
                )}
            </IonContent>
        </IonPage>
    );
};

export default MapView;