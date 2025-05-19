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
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonActionSheet,
    IonToast,
    IonModal,
    IonFab,
    IonFabButton
} from '@ionic/react';
import {
    personAddOutline,
    ellipsisVertical,
    addOutline,
    mailOutline,
    trashOutline,
    logoX,
    notificationsOutline
} from 'ionicons/icons';
import FriendService from '../../services/friend';
import FriendSearch from '../FriendSearch/FriendSearch';
import FriendRequests from '../FriendRequest/FriendRequest';
import ChatService from '../../services/chat';
import ChatView from '../Layout/ChatView';
import {Friend} from "../../types";
// import './FriendsList.css';

const FriendsList: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<{ id: number, name?: string } | null>(null);
    const currentUserId = parseInt(localStorage.getItem('userId') || '0');

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        setIsLoading(true);
        try {
            const friendsList: Friend[] = await FriendService.getFriends();
            setFriends(friendsList);
        } catch (error) {
            console.error('Erreur lors du chargement des amis:', error);
            showToastMessage('Erreur lors du chargement des amis');
        } finally {
            setIsLoading(false);
        }
    };

    console.log("friends", friends)

    const handleRefresh = (event: CustomEvent) => {
        loadFriends().then(() => {
            event.detail.complete();
        });
    };

    const handleFriendAction = (userId: number) => {
        const friend = friends.find((friend) => friend.id === userId);
        console.log("user id not found in friends", userId, friends);
        if (!friend) return;
        console.log("friend", friend)
        setSelectedFriend(friend);
        setShowActionSheet(true);
    };

    const handleStartChat = async (friend: Friend) => {
        setIsLoading(true);
        try {
            const conversation = await ChatService.createOrGetConversation(friend.id);
            setSelectedConversation({
                id: conversation.id,
                name: `Utilisateur ${friend.username}` // Dans une app réelle, vous utiliseriez le nom de l'utilisateur
            });
            setShowChatModal(true);
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
            showToastMessage('Erreur lors de la création de la conversation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFriend = async () => {
        if (!selectedFriend) return;

        setIsLoading(true);
        try {
            await FriendService.removeFriend(selectedFriend);
            setFriends(prev => prev.filter(id => id !== selectedFriend));
            showToastMessage('Ami supprimé');
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'ami:', error);
            showToastMessage('Erreur lors de la suppression de l\'ami');
        } finally {
            setIsLoading(false);
            setSelectedFriend(null);
        }
    };

    const handleBlockUser = async () => {
        if (!selectedFriend) return;

        setIsLoading(true);
        try {
            await FriendService.blockUser(selectedFriend);
            setFriends(prev => prev.filter(id => id !== selectedFriend));
            showToastMessage('Utilisateur bloqué');
        } catch (error) {
            console.error('Erreur lors du blocage de l\'utilisateur:', error);
            showToastMessage('Erreur lors du blocage de l\'utilisateur');
        } finally {
            setIsLoading(false);
            setSelectedFriend(null);
        }
    };

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const filteredFriends: Friend[]  = friends.filter(friend => {
        // Dans une app réelle, vous filtreriez par nom/pseudo d'utilisateur
        // return friend.toString().includes(searchText);
        return friend.username.toLowerCase().includes(searchText.toLowerCase());
    });

    return (
        <div className="friends-container">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Mes Amis</IonTitle>
                    <div className="ion-buttons ion-buttons-end">
                        <IonButton onClick={() => setShowRequestsModal(true)}>
                            <IonIcon icon={notificationsOutline} />
                            {/* Badge pour les demandes en attente */}
                        </IonButton>
                        <IonButton onClick={() => setShowSearchModal(true)}>
                            <IonIcon icon={personAddOutline} />
                        </IonButton>
                    </div>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar
                        value={searchText}
                        onIonChange={e => setSearchText(e.detail.value || '')}
                        placeholder="Rechercher des amis"
                        animated
                        className="custom-searchbar"
                    />
                </IonToolbar>
            </IonHeader>

                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                {isLoading ? (
                    <div className="skeleton-container">
                        {[...Array(5)].map((_, i) => (
                            <div className="skeleton-item" key={i}>
                                <div className="skeleton-avatar">
                                    <IonSkeletonText animated />
                                </div>
                                <div className="skeleton-text">
                                    <IonSkeletonText animated style={{ width: '60%' }} />
                                    <IonSkeletonText animated style={{ width: '80%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {friends.length > 0 ? (
                            <IonList className="friends-list">
                                {friends.map((friend : Friend, index : number) => (
                                    <IonItem key={index} className="friend-item">
                                        <IonAvatar slot="start" className="friend-avatar">
                                            <img src={`https://i.pravatar.cc/150?u=${friend.profilePicture}`} alt={`Ami ${friend.username}`} />
                                        </IonAvatar>
                                        <IonLabel>
                                            <h2>Utilisateur {friend.username}</h2>
                                            <p>Statut: En ligne</p>
                                        </IonLabel>
                                        <IonButton fill="clear" onClick={() => handleStartChat(friend)}>
                                            <IonIcon icon={mailOutline} slot="icon-only" />
                                        </IonButton>
                                        <IonButton fill="clear" onClick={() => handleFriendAction(friend.id)}>
                                            <IonIcon icon={ellipsisVertical} slot="icon-only" />
                                        </IonButton>
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : (
                            <div className="no-results">
                                <div className="no-results-icon">
                                    <IonIcon icon={personAddOutline} />
                                </div>
                                <h3>Aucun ami trouvé</h3>
                                <p>Commencez à ajouter des amis</p>
                                <IonButton onClick={() => setShowSearchModal(true)}>
                                    Rechercher des amis
                                </IonButton>
                            </div>
                        )}
                    </>
                )}

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
                <IonFabButton color="primary" onClick={() => setShowSearchModal(true)}>
                    <IonIcon icon={addOutline} />
                </IonFabButton>
            </IonFab>

            {/* Modals */}
            <IonModal isOpen={showSearchModal} onDidDismiss={() => setShowSearchModal(false)}>
                <FriendSearch onBack={() => setShowSearchModal(false)} />
            </IonModal>

            <IonModal isOpen={showRequestsModal} onDidDismiss={() => setShowRequestsModal(false)}>
                <FriendRequests onBack={() => setShowRequestsModal(false)} />
            </IonModal>

            <IonModal isOpen={showChatModal} onDidDismiss={() => setShowChatModal(false)}>
                {selectedConversation && (
                    <ChatView
                        conversationId={selectedConversation.id}
                        userId={currentUserId}
                        onBack={() => setShowChatModal(false)}
                        conversationName={selectedConversation.name}
                    />
                )}
            </IonModal>

            {/* Action Sheet pour les actions sur un ami */}
            <IonActionSheet
                isOpen={showActionSheet}
                onDidDismiss={() => setShowActionSheet(false)}
                buttons={[
                    {
                        text: 'Envoyer un message',
                        icon: mailOutline,
                        handler: () => {
                            if (selectedFriend) {
                                handleStartChat(selectedFriend);
                            }
                        }
                    },
                    {
                        text: 'Supprimer de mes amis',
                        role: 'destructive',
                        icon: trashOutline,
                        handler: handleRemoveFriend
                    },
                    {
                        text: 'Bloquer cet utilisateur',
                        role: 'destructive',
                        icon: logoX,
                        handler: handleBlockUser
                    },
                    {
                        text: 'Annuler',
                        role: 'cancel'
                    }
                ]}
            />

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={2000}
                position="bottom"
            />
        </div>
    );
};

export default FriendsList;