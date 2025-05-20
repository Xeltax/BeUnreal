import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    IonIcon,
    IonLoading,
    IonToast,
    IonBackButton,
    IonButtons,
    IonSegment,
    IonSegmentButton
} from '@ionic/react';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';
import FriendService, { FriendRequest } from '../../services/friend';
import { getProfilePicture } from '../../utils/userUtils';
// import './FriendRequests.css';

interface FriendRequestsProps {
    onBack: () => void;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({ onBack }) => {
    const [segment, setSegment] = useState<'received' | 'sent'>('received');
    const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Charger les demandes d'amitié
    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const data = await FriendService.getPendingRequests();
            setReceivedRequests(data.received);
            setSentRequests(data.sent);
        } catch (error) {
            console.error('Erreur lors du chargement des demandes:', error);
            showToastMessage('Erreur lors du chargement des demandes');
        } finally {
            setIsLoading(false);
        }
    };

    // Accepter une demande d'ami
    const acceptRequest = async (requestId: number) => {
        setIsLoading(true);
        try {
            await FriendService.respondToFriendRequest(requestId, true);
            // Mettre à jour la liste
            setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
            showToastMessage('Demande d\'ami acceptée');
        } catch (error) {
            console.error('Erreur lors de l\'acceptation de la demande:', error);
            showToastMessage('Erreur lors de l\'acceptation de la demande');
        } finally {
            setIsLoading(false);
        }
    };

    // Refuser une demande d'ami
    const declineRequest = async (requestId: number) => {
        setIsLoading(true);
        try {
            await FriendService.respondToFriendRequest(requestId, false);
            // Mettre à jour la liste
            setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
            showToastMessage('Demande d\'ami refusée');
        } catch (error) {
            console.error('Erreur lors du refus de la demande:', error);
            showToastMessage('Erreur lors du refus de la demande');
        } finally {
            setIsLoading(false);
        }
    };

    // Annuler une demande d'ami envoyée
    const cancelRequest = async (requestId: number) => {
        setIsLoading(true);
        try {
            await FriendService.respondToFriendRequest(requestId, false);
            // Mettre à jour la liste
            setSentRequests(prev => prev.filter(req => req.id !== requestId));
            showToastMessage('Demande d\'ami annulée');
        } catch (error) {
            console.error('Erreur lors de l\'annulation de la demande:', error);
            showToastMessage('Erreur lors de l\'annulation de la demande');
        } finally {
            setIsLoading(false);
        }
    };

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };

    // Formatage de la date
    const formatDate = (dateStr: Date): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="#" />
                    </IonButtons>
                    <IonTitle>Demandes d'amitié</IonTitle>
                </IonToolbar>
                <IonToolbar>
                    <IonSegment value={segment} onIonChange={e => setSegment(e.detail.value as 'received' | 'sent')}>
                        <IonSegmentButton value="received">
                            <IonLabel>Reçues</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="sent">
                            <IonLabel>Envoyées</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                {segment === 'received' && (
                    <>
                        {receivedRequests.length > 0 ? (
                            <IonList>
                                {receivedRequests.map(request => (
                                    <IonItem key={request.id} className="request-item">
                                        <IonAvatar slot="start">
                                            <img src={`https://i.pravatar.cc/150?u=${request.requesterId}`} alt="avatar" />
                                        </IonAvatar>
                                        <IonLabel>
                                            <h2>Demande de l'utilisateur {request.requesterId}</h2>
                                            <p>Reçue le {formatDate(request.createdAt)}</p>
                                        </IonLabel>
                                        <IonButton fill="clear" onClick={() => acceptRequest(request.id)}>
                                            <IonIcon icon={checkmarkOutline} slot="icon-only" color="success" />
                                        </IonButton>
                                        <IonButton fill="clear" onClick={() => declineRequest(request.id)}>
                                            <IonIcon icon={closeOutline} slot="icon-only" color="danger" />
                                        </IonButton>
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : (
                            <div className="no-requests">
                                <p>Aucune demande d'amitié reçue</p>
                            </div>
                        )}
                    </>
                )}

                {segment === 'sent' && (
                    <>
                        {sentRequests.length > 0 ? (
                            <IonList>
                                {sentRequests.map(request => (
                                    <IonItem key={request.id} className="request-item">
                                        <IonAvatar slot="start">
                                            <img src={`https://i.pravatar.cc/150?u=${request.addresseeId}`} alt="avatar" />
                                        </IonAvatar>
                                        <IonLabel>
                                            <h2>Envoyée à l'utilisateur {request.addresseeId}</h2>
                                            <p>Envoyée le {formatDate(request.createdAt)}</p>
                                        </IonLabel>
                                        <IonButton fill="clear" onClick={() => cancelRequest(request.id)}>
                                            <IonIcon icon={closeOutline} slot="icon-only" color="danger" />
                                        </IonButton>
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : (
                            <div className="no-requests">
                                <p>Aucune demande d'amitié envoyée</p>
                            </div>
                        )}
                    </>
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

export default FriendRequests;