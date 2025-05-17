import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonLoading,
    IonText,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardContent,
} from '@ionic/react';
import { personAdd, reload } from 'ionicons/icons';
import { findNearbyUsers, updateUserLocation } from '../services/auth';
import { useGeolocation } from '../hooks/useGeolocation';

interface NearbyUser {
    id: number;
    username: string;
    profilePicture?: string;
    latitude: number;
    longitude: number;
    lastActive: string;
}

const NearbyUsers: React.FC = () => {
    const { latitude, longitude, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();
    const [users, setUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [distance, setDistance] = useState(5); // Distance en km

    const fetchNearbyUsers = async () => {
        if (!latitude || !longitude) return;

        try {
            setLoading(true);
            setError(null);

            // Mettre à jour la position de l'utilisateur actuel
            await updateUserLocation(latitude, longitude);

            // Récupérer les utilisateurs à proximité
            const nearbyUsers = await findNearbyUsers(latitude, longitude, distance);
            setUsers(nearbyUsers);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (latitude && longitude) {
            fetchNearbyUsers();
        }
    }, [latitude, longitude, distance]);

    const handleRefresh = async (event: CustomEvent) => {
        try {
            await getCurrentPosition();
            await fetchNearbyUsers();
        } finally {
            event.detail.complete();
        }
    };

    const formatDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        // Calcul approximatif de la distance en km entre deux points géographiques
        const R = 6371; // Rayon de la Terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;

        if (d < 1) {
            return `${Math.round(d * 1000)} m`;
        }
        return `${d.toFixed(1)} km`;
    };

    const formatLastActive = (lastActive: string) => {
        const date = new Date(lastActive);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMin = Math.floor(diffInMs / (1000 * 60));

        if (diffInMin < 1) return 'À l\'instant';
        if (diffInMin < 60) return `Il y a ${diffInMin} min`;

        const diffInHours = Math.floor(diffInMin / 60);
        if (diffInHours < 24) return `Il y a ${diffInHours}h`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `Il y a ${diffInDays}j`;

        return date.toLocaleDateString();
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/profile" />
                    </IonButtons>
                    <IonTitle>Personnes à proximité</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={fetchNearbyUsers}>
                            <IonIcon icon={reload} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                {geoError && (
                    <IonCard color="danger">
                        <IonCardContent>
                            <p>Erreur de géolocalisation: {geoError}</p>
                            <IonButton expand="block" onClick={getCurrentPosition}>
                                Réessayer
                            </IonButton>
                        </IonCardContent>
                    </IonCard>
                )}

                {error && (
                    <IonText color="danger" className="ion-padding">
                        <p>{error}</p>
                    </IonText>
                )}

                <IonCard>
                    <IonCardContent>
                        <p>
                            Distance maximale: {distance} km
                        </p>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={distance}
                            onChange={(e) => setDistance(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </IonCardContent>
                </IonCard>

                <IonList>
                    {users.length === 0 && !loading ? (
                        <IonItem lines="none" className="ion-text-center">
                            <IonLabel>Aucune personne à proximité</IonLabel>
                        </IonItem>
                    ) : (
                        users.map((user) => (
                            <IonItem key={user.id}>
                                <IonAvatar slot="start">
                                    <img
                                        src={user.profilePicture || 'https://ionicframework.com/docs/img/demos/avatar.svg'}
                                        alt={user.username}
                                    />
                                </IonAvatar>
                                <IonLabel>
                                    <h2>{user.username}</h2>
                                    <p>
                                        {latitude && longitude ?
                                            formatDistance(latitude, longitude, user.latitude, user.longitude) :
                                            'Calcul en cours...'}
                                    </p>
                                    <p>Actif: {formatLastActive(user.lastActive)}</p>
                                </IonLabel>
                                <IonButton fill="clear">
                                    <IonIcon icon={personAdd} slot="icon-only" />
                                </IonButton>
                            </IonItem>
                        ))
                    )}
                </IonList>

                <IonLoading isOpen={loading || geoLoading} message="Chargement en cours..." />
            </IonContent>
        </IonPage>
    );
};

export default NearbyUsers;