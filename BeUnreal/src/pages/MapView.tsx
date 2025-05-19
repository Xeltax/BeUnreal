import React, {useEffect, useRef, useState} from 'react';
import {IonContent, IonPage, useIonToast} from '@ionic/react';
import {Geolocation} from '@capacitor/geolocation';
import {Capacitor} from '@capacitor/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import StoryModal from "../components/StoryModal";
import {User} from "../types";
import {AuthService} from "../services/auth";

export interface Story {
    id: number,
    userId: number,
    user?: User,
    mediaUrl: string,
    city?: string,
    createdAt: Date,

    isPublic: boolean,
    latitude?: number,
    longitude?: number,
}

const MapView: React.FC = () => {
    const [present] = useIonToast();
    const mapRef = useRef<L.Map | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [selectedStories, setSelectedStories] = useState<Story[]>([]);

    const fetchStories = async (latitude: number, longitude: number, radius: number) => {
        try {
            const res = await fetch('http://localhost:3002/api/media/stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: 'Bearer ' + AuthService.getToken()!
                },
                body: JSON.stringify({ latitude, longitude, radius }),
            });

            if (!res.ok) {
                console.error(res)
                return
            }

            const data = await res.json();

            setStories(data);
        } catch (err) {
            console.error(err);
        }
    };

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

        // Initial fetch
        const loadStories = () => {
            console.log("LOAD")
            const bounds = map.getBounds();
            const radius = Math.floor(
                (bounds.getSouthWest().distanceTo(bounds.getNorthEast()) / 2) * 1.6
            );
            const center = bounds.getCenter();
            fetchStories(center.lat, center.lng, radius).finally();
        };

        map.on('moveend', loadStories);

        map.on('click', (e: L.LeafletMouseEvent) => {
            const { latlng } = e;

            const found = stories
                .filter((story) => {
                    const dist = map.distance(latlng, L.latLng(story.latitude!, story.longitude!));
                    return dist < 80;
                })
                .slice(0, 10);

            if (found.length > 0) {
                setSelectedStories(found);
            }
        });

        setTimeout(() => {
            map.invalidateSize();
            loadStories(); // fetch initial
        }, 100);
    };

    useEffect(() => {
        if (!mapRef.current) return;

        const heatLayer = (L as any).heatLayer(
            stories.map((s) => [s.latitude, s.longitude, 0.8]),
            { radius: 25, blur: 15, maxZoom: 17 }
        );

        heatLayer.addTo(mapRef.current);

        return () => {
            mapRef.current?.removeLayer(heatLayer);
        };
    }, [stories]);

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