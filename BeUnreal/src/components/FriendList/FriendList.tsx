import React, { useEffect, useState } from 'react';
import {
    IonActionSheet,
    IonAvatar,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonPage,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonSkeletonText,
    IonTitle,
    IonToast,
    IonToolbar
} from '@ionic/react';
import {
    addOutline,
    ellipsisVertical,
    logoX,
    mailOutline,
    notificationsOutline,
    personAddOutline,
    chatbubbleOutline,
    peopleOutline,
    trashOutline
} from 'ionicons/icons';
import FriendService from '../../services/friend';
import FriendSearch from '../FriendSearch/FriendSearch';
import FriendRequests from '../FriendRequest/FriendRequest';
import ChatService, { Conversation, Friend } from '../../services/chat';
import ChatView from '../Layout/ChatView';
import ConversationList from '../Layout/ConversationList';
import { getProfilePicture, formatUsername } from '../../utils/userUtils';
import {useAuth} from "../../contexts/AuthContext";
// import './FriendsList.css';

const FriendsList: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'friends' | 'conversations'>('friends');
    const [searchText, setSearchText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<{ id: number, name?: string } | null>(null);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const { authState } = useAuth()
    const currentUserId = Number(authState.user?.id);

    useEffect(() => {
        // Initialiser Socket.io lors du montage du composant
        ChatService.initializeSocket();

        // Charger les données initiales
        loadInitialData();

        // Nettoyer la connexion socket lors du démontage
        return () => {
            ChatService.disconnectSocket();
        };
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadFriends(),
                loadConversations(),
                loadPendingRequests()
            ]);
        } catch (error) {
            console.error('Erreur lors du chargement des données initiales:', error);
            showToastMessage('Erreur lors du chargement des données');
        } finally {
            setIsLoading(false);
        }
    };

    const loadFriends = async () => {
        try {
            const friendsList = await FriendService.getFriends();
            setFriends(friendsList);
            return friendsList;
        } catch (error) {
            console.error('Erreur lors du chargement des amis:', error);
            showToastMessage('Erreur lors du chargement des amis');
            throw error;
        }
    };

    const loadConversations = async () => {
        try {
            const conversationsList = await ChatService.getUserConversations();
            setConversations(conversationsList);
            return conversationsList;
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
            showToastMessage('Erreur lors du chargement des conversations');
            throw error;
        }
    };

    const loadPendingRequests = async () => {
        try {
            const requests = await FriendService.getPendingRequests();
            setPendingRequestsCount(requests.received.length);
            return requests;
        } catch (error) {
            console.error('Erreur lors du chargement des demandes en attente:', error);
            throw error;
        }
    };

    const handleRefresh = async (event: CustomEvent) => {
        try {
            await loadInitialData();
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        } finally {
            event.detail.complete();
        }
    };

    const handleFriendAction = (userId: number) => {
        const friend = friends.find((friend) => friend.id === userId);
        if (!friend) {
            console.log("User ID not found in friends", userId, friends);
            return;
        }
        console.log("friend", friend);
        setSelectedFriend(friend);
        setShowActionSheet(true);
    };

    const handleStartChat = async (friend: Friend) => {
        setIsLoading(true);
        try {
            const conversation = await ChatService.createOrGetConversation(friend.id);
            setSelectedConversation({
                id: conversation.id,
                name: formatUsername(friend.username)
            });
            setShowChatModal(true);
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
            showToastMessage('Erreur lors de la création de la conversation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenExistingChat = (conversation: Conversation) => {
        // Pour les conversations individuelles, trouver l'ami correspondant
        let name = conversation.name;
        if (!conversation.isGroup) {
            const participant = conversation.participants.find(p => p.userId !== currentUserId);
            if (participant) {
                const friend = friends.find(f => f.id === participant.userId);
                if (friend) {
                    name = formatUsername(friend.username);
                }
            }
        }

        setSelectedConversation({
            id: conversation.id,
            name: name
        });
        setShowChatModal(true);
    };

    const handleRemoveFriend = async () => {
        if (!selectedFriend) return;

        setIsLoading(true);
        try {
            await FriendService.removeFriend(selectedFriend);
            setFriends(prev => prev.filter(friend => friend.id !== selectedFriend.id));
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
            setFriends(prev => prev.filter(friend => friend.id !== selectedFriend.id));
            showToastMessage('Utilisateur bloqué');
        } catch (error) {
            console.error('Erreur lors du blocage de l\'utilisateur:', error);
            showToastMessage('Erreur lors du blocage de l\'utilisateur');
        } finally {
            setIsLoading(false);
            setSelectedFriend(null);
        }
    };

    const handleConversationCreated = (conversationId: number, name?: string) => {
        loadConversations().then(() => {
            setSelectedConversation({
                id: conversationId,
                name: name
            });
            setShowChatModal(true);

            // Changer l'onglet pour les conversations
            setActiveTab('conversations');
        });
    };

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const handleModalClose = () => {
        // Recharger les données après la fermeture d'une modale
        loadInitialData();
    };

    const filteredFriends = friends.filter(friend => {
        return friend.username.toLowerCase().includes(searchText.toLowerCase());
    });

    return (
        <IonPage>
            <IonContent>
                <div className="container">
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>BeUnreal</IonTitle>
                            <div className="ion-buttons ion-buttons-end" slot="end">
                                <IonButton onClick={() => setShowRequestsModal(true)}>
                                    <IonIcon icon={notificationsOutline} />
                                    {pendingRequestsCount > 0 && (
                                        <span className="badge">{pendingRequestsCount}</span>
                                    )}
                                </IonButton>
                                <IonButton onClick={() => setShowSearchModal(true)}>
                                    <IonIcon icon={personAddOutline} />
                                </IonButton>
                            </div>
                        </IonToolbar>

                        <IonToolbar>
                            <IonSegment value={activeTab} onIonChange={e => setActiveTab(e.detail.value as 'friends' | 'conversations')}>
                                <IonSegmentButton value="friends">
                                    <IonIcon icon={peopleOutline} />
                                    <IonLabel>Amis</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="conversations">
                                    <IonIcon icon={chatbubbleOutline} />
                                    <IonLabel>Messages</IonLabel>
                                </IonSegmentButton>
                            </IonSegment>
                        </IonToolbar>

                        <IonToolbar>
                            <IonSearchbar
                                value={searchText}
                                onIonChange={e => setSearchText(e.detail.value || '')}
                                placeholder={activeTab === 'friends' ? "Rechercher des amis" : "Rechercher des conversations"}
                                animated
                                className="custom-searchbar"
                            />
                        </IonToolbar>
                    </IonHeader>

                    <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                        <IonRefresherContent></IonRefresherContent>
                    </IonRefresher>

                    {activeTab === 'friends' ? (
                        <>
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
                                    {filteredFriends.length > 0 ? (
                                        <IonList className="friends-list">
                                            {filteredFriends.map((friend: Friend, index: number) => (
                                                <IonItem key={index} className="friend-item">
                                                    <IonAvatar slot="start" className="friend-avatar">
                                                        <img src={getProfilePicture(friend)} alt={`Ami ${friend.username}`} />
                                                    </IonAvatar>
                                                    <IonLabel>
                                                        <h2>{formatUsername(friend.username)}</h2>
                                                        <p>@{friend.username}</p>
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
                        </>
                    ) : (
                        // Onglet conversations
                        <ConversationList
                            conversations={conversations}
                            friends={friends}
                            isLoading={isLoading}
                            currentUserId={currentUserId}
                            onOpenChat={handleOpenExistingChat}
                            onConversationCreated={handleConversationCreated}
                        />
                    )}

                    {/* Modals */}
                    <IonModal isOpen={showSearchModal} onDidDismiss={() => { setShowSearchModal(false); handleModalClose(); }}>
                        <FriendSearch onBack={() => setShowSearchModal(false)} />
                    </IonModal>

                    <IonModal isOpen={showRequestsModal} onDidDismiss={() => { setShowRequestsModal(false); handleModalClose(); }}>
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
            </IonContent>
        </IonPage>
    );
};

export default FriendsList;