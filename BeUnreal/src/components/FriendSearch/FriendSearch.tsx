import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSearchbar,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    IonIcon,
    IonLoading,
    IonToast,
    IonBackButton,
    IonButtons
} from '@ionic/react';
import { personAddOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import FriendService, { User, FriendRequest } from '../../services/friend';
// import './FriendSearch.css';

interface FriendSearchProps {
    onBack: () => void;
}

const FriendSearch: React.FC<FriendSearchProps> = ({ onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<{ [key: number]: boolean }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Gérer la recherche
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const results = await FriendService.searchUsers(query);
            console.log('Résultats de la recherche:', results);
            setSearchResults(results);

            // Obtenir les demandes en attente pour savoir lesquelles sont déjà envoyées
            const pendingData = await FriendService.getPendingRequests();
            const newPendingRequests: { [key: number]: boolean } = {};

            pendingData.sent.forEach((request : any) => {
                newPendingRequests[request.addresseeId] = true;
            });

            setPendingRequests(newPendingRequests);
        } catch (error) {
            console.error('Erreur de recherche:', error);
            showToastMessage('Erreur lors de la recherche');
        } finally {
            setIsLoading(false);
        }
    };

    // Envoyer une demande d'ami
    const sendRequest = async (userId: number) => {
        setIsLoading(true);
        try {
            await FriendService.sendFriendRequest(userId);
            // Marquer comme en attente dans l'UI
            setPendingRequests(prev => ({ ...prev, [userId]: true }));
            showToastMessage('Demande d\'ami envoyée');
        } catch (error: any) {
            showToastMessage(error.response?.data?.message || 'Erreur lors de l\'envoi de la demande');
        } finally {
            setIsLoading(false);
        }
    };

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="#" />
                    </IonButtons>
                    <IonTitle>Rechercher des amis</IonTitle>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar
                        value={searchQuery}
                        onIonChange={e => handleSearch(e.detail.value || '')}
                        placeholder="Rechercher des personnes"
                        animated
                        debounce={500}
                    />
                </IonToolbar>
            </IonHeader>

            <IonContent>
                {searchResults.length > 0 ? (
                    <IonList>
                        {searchResults.map(user => (
                            <IonItem key={user.id} className="user-item">
                                <IonAvatar slot="start">
                                    <img src={user.profilePicture || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
                                </IonAvatar>
                                <IonLabel>
                                    <h2>{user.name}</h2>
                                    <p>@{user.username}</p>
                                </IonLabel>
                                {pendingRequests[user.id] ? (
                                    <IonButton fill="clear" disabled>
                                        <IonIcon icon={checkmarkOutline} slot="icon-only" />
                                    </IonButton>
                                ) : (
                                    <IonButton fill="clear" onClick={() => sendRequest(user.id)}>
                                        <IonIcon icon={personAddOutline} slot="icon-only" />
                                    </IonButton>
                                )}
                            </IonItem>
                        ))}
                    </IonList>
                ) : (
                    searchQuery.length > 0 && !isLoading && (
                        <div className="no-results">
                            <p>Aucun résultat trouvé pour "{searchQuery}"</p>
                        </div>
                    )
                )}

                {searchQuery.length === 0 && (
                    <div className="search-info">
                        <p>Recherchez des amis par nom ou pseudonyme</p>
                    </div>
                )}

                <IonLoading isOpen={isLoading} message="Chargement..." />

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={2000}
                    position="bottom"
                />
            </IonContent>
        </>
    );
};

export default FriendSearch;