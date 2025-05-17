import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSearchbar,
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
} from '@ionic/react';
import { searchUsers } from '../services/auth';
import { personAdd } from 'ionicons/icons';

interface User {
    id: number;
    username: string;
    email: string;
    profilePicture?: string;
    bio?: string;
}

const UserSearch: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: CustomEvent) => {
        const value = e.detail.value;
        setSearchTerm(value);

        if (value && value.length >= 2) {
            try {
                setLoading(true);
                setError(null);

                const users = await searchUsers(value);
                setResults(users);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Erreur lors de la recherche');
            } finally {
                setLoading(false);
            }
        } else {
            setResults([]);
        }
    };

    const addFriend = (userId: number) => {
        // Cette fonction sera développée lorsque nous implémenterons la fonctionnalité d'amis
        console.log('Ajouter ami:', userId);
        // Pour l'instant, on affiche juste un message
        alert('Fonctionnalité à implémenter: Ajouter un ami');
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/profile" />
                    </IonButtons>
                    <IonTitle>Rechercher des amis</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonSearchbar
                    value={searchTerm}
                    onIonChange={handleSearch}
                    placeholder="Rechercher par nom ou email"
                    debounce={500}
                />

                {error && (
                    <IonText color="danger" className="ion-padding">
                        <p>{error}</p>
                    </IonText>
                )}

                <IonList>
                    {results.length === 0 && searchTerm !== '' && !loading ? (
                        <IonItem lines="none" className="ion-text-center">
                            <IonLabel>Aucun résultat trouvé</IonLabel>
                        </IonItem>
                    ) : (
                        results.map((user) => (
                            <IonItem key={user.id}>
                                <IonAvatar slot="start">
                                    <img
                                        src={user.profilePicture || 'https://ionicframework.com/docs/img/demos/avatar.svg'}
                                        alt={user.username}
                                    />
                                </IonAvatar>
                                <IonLabel>
                                    <h2>{user.username}</h2>
                                    <p>{user.email}</p>
                                    {user.bio && <p>{user.bio}</p>}
                                </IonLabel>
                                <IonButton fill="clear" onClick={() => addFriend(user.id)}>
                                    <IonIcon icon={personAdd} slot="icon-only" />
                                </IonButton>
                            </IonItem>
                        ))
                    )}
                </IonList>

                <IonLoading isOpen={loading} message="Recherche en cours..." />
            </IonContent>
        </IonPage>
    );
};

export default UserSearch;