import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonFab,
    IonFabButton,
    IonIcon,
    IonLoading,
    IonText,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonModal,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonInput,
} from '@ionic/react';
import { add, search, people, peopleCircle } from 'ionicons/icons';
import { getUserConversations, createOrGetConversation, createGroupConversation, getSocket } from '../services/message';
import { searchUsers } from '../services/auth';
import { useHistory } from 'react-router';

interface Conversation {
    id: number;
    isGroup: boolean;
    name?: string;
    lastMessageAt: string;
    participants: any[];
    messages: any[];
}

const ConversationsList: React.FC = () => {
    const history = useHistory();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNewChat, setShowNewChat] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');

    // Obtenir l'ID de l'utilisateur actuel
    const currentUserId = parseInt(localStorage.getItem('userId') || '0');

    const loadConversations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUserConversations();
            setConversations(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des conversations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();

        // Écouter les nouveaux messages via socket
        const socket = getSocket();
        if (socket) {
            socket.on('newMessage', (data) => {
                // Rafraîchir la liste des conversations après réception d'un nouveau message
                loadConversations();
            });
        }

        return () => {
            if (socket) {
                socket.off('newMessage');
            }
        };
    }, []);

    const handleRefresh = async (event: CustomEvent) => {
        try {
            await loadConversations();
        } finally {
            event.detail.complete();
        }
    };

    const handleSearch = async (e: CustomEvent) => {
        const value = e.detail.value;
        setSearchTerm(value);

        if (value && value.length >= 2) {
            try {
                const users = await searchUsers(value);
                // Filtrer l'utilisateur actuel de la liste des résultats
                setSearchResults(users.filter(user => user.id !== currentUserId));
            } catch (error) {
                console.error('Erreur de recherche:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const startConversation = async (userId: number) => {
        try {
            setLoading(true);
            const conversation = await createOrGetConversation(userId);
            setShowNewChat(false);
            // Rediriger vers la conversation
            history.push(`/chat/${conversation.id}`);
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const createGroup = async () => {
        if (!groupName || selectedUsers.length === 0) {
            return;
        }

        try {
            setLoading(true);
            const conversation = await createGroupConversation(groupName, selectedUsers);
            setShowNewGroup(false);
            setSelectedUsers([]);
            setGroupName('');
            // Rediriger vers la conversation de groupe
            history.push(`/chat/${conversation.id}`);
        } catch (error) {
            console.error('Erreur lors de la création du groupe:', error);
        } finally {
            setLoading(false);
        }
    };

    const getConversationTitle = (conversation: Conversation) => {
        if (conversation.isGroup) {
            return conversation.name || 'Groupe sans nom';
        }

        // Pour les conversations à deux, afficher le nom de l'autre utilisateur
        const otherParticipant = conversation.participants.find(
            p => p.userId !== currentUserId
        );

        return otherParticipant ? otherParticipant.user?.username || 'Utilisateur inconnu' : 'Conversation';
    };

    const getLastMessage = (conversation: Conversation) => {
        if (!conversation.messages || conversation.messages.length === 0) {
            return 'Aucun message';
        }

        const lastMessage = conversation.messages[0];

        if (lastMessage.type === 'text') {
            return lastMessage.content;
        } else if (lastMessage.type === 'image') {
            return '📷 Image';
        } else if (lastMessage.type === 'video') {
            return '🎥 Vidéo';
        }

        return 'Message';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            // Aujourd'hui, afficher l'heure
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays === 1) {
            // Hier
            return 'Hier';
        } else if (diffInDays < 7) {
            // Cette semaine, afficher le jour
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            // Plus ancien, afficher la date
            return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Conversations</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                {error && (
                    <IonText color="danger" className="ion-padding">
                        <p>{error}</p>
                    </IonText>
                )}

                <IonList>
                    {conversations.length === 0 && !loading ? (
                        <IonItem lines="none" className="ion-text-center">
                            <IonLabel>
                                <h2>Aucune conversation</h2>
                                <p>Commencez à discuter en cliquant sur le bouton +</p>
                            </IonLabel>
                        </IonItem>
                    ) : (
                        conversations.map((conversation) => (
                            <IonItem
                                key={conversation.id}
                                button
                                onClick={() => history.push(`/chat/${conversation.id}`)}
                            >
                                <IonAvatar slot="start">
                                    {conversation.isGroup ? (
                                        <div style={{
                                            backgroundColor: '#4c8dff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%'
                                        }}>
                                            <IonIcon icon={peopleCircle} color="light" style={{ fontSize: '24px' }} />
                                        </div>
                                    ) : (
                                        <img
                                            src="https://ionicframework.com/docs/img/demos/avatar.svg"
                                            alt="Avatar"
                                        />
                                    )}
                                </IonAvatar>
                                <IonLabel>
                                    <h2>{getConversationTitle(conversation)}</h2>
                                    <p>{getLastMessage(conversation)}</p>
                                </IonLabel>
                                <div slot="end">
                                    <IonText color="medium">
                                        <small>{formatDate(conversation.lastMessageAt)}</small>
                                    </IonText>
                                    {/* Badge pour les messages non lus (à implémenter) */}
                                </div>
                            </IonItem>
                        ))
                    )}
                </IonList>

                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton>
                        <IonIcon icon={add} />
                    </IonFabButton>
                    <IonFabButton color="primary" onClick={() => setShowNewChat(true)}>
                        <IonIcon icon={search} />
                    </IonFabButton>
                    <IonFabButton color="tertiary" onClick={() => setShowNewGroup(true)}>
                        <IonIcon icon={people} />
                    </IonFabButton>
                </IonFab>

                {/* Modal pour nouvelle conversation */}
                <IonModal isOpen={showNewChat} onDidDismiss={() => setShowNewChat(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Nouvelle conversation</IonTitle>
                            <IonButton slot="end" onClick={() => setShowNewChat(false)}>
                                Fermer
                            </IonButton>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        <IonSearchbar
                            value={searchTerm}
                            onIonChange={handleSearch}
                            placeholder="Rechercher un utilisateur"
                            debounce={500}
                        />

                        <IonList>
                            {searchResults.length === 0 && searchTerm !== '' ? (
                                <IonItem lines="none" className="ion-text-center">
                                    <IonLabel>Aucun résultat trouvé</IonLabel>
                                </IonItem>
                            ) : (
                                searchResults.map((user) => (
                                    <IonItem key={user.id} button onClick={() => startConversation(user.id)}>
                                        <IonAvatar slot="start">
                                            <img
                                                src={user.profilePicture || 'https://ionicframework.com/docs/img/demos/avatar.svg'}
                                                alt={user.username}
                                            />
                                        </IonAvatar>
                                        <IonLabel>
                                            <h2>{user.username}</h2>
                                            <p>{user.email}</p>
                                        </IonLabel>
                                    </IonItem>
                                ))
                            )}
                        </IonList>
                    </IonContent>
                </IonModal>

                {/* Modal pour nouvelle conversation de groupe */}
                <IonModal isOpen={showNewGroup} onDidDismiss={() => setShowNewGroup(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Nouveau groupe</IonTitle>
                            <IonButton slot="end" onClick={() => setShowNewGroup(false)}>
                                Fermer
                            </IonButton>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        <IonItem>
                            <IonLabel position="floating">Nom du groupe</IonLabel>
                            <IonInput
                                value={groupName}
                                onIonChange={(e) => setGroupName(e.detail.value!)}
                                placeholder="Entrez un nom pour le groupe"
                            />
                        </IonItem>

                        <IonItem className="ion-margin-top">
                            <IonLabel>Sélectionnez des membres</IonLabel>
                            <IonSelect
                                multiple={true}
                                value={selectedUsers}
                                onIonChange={(e) => setSelectedUsers(e.detail.value)}
                            >
                                {searchResults.map((user) => (
                                    <IonSelectOption key={user.id} value={user.id}>
                                        {user.username}
                                    </IonSelectOption>
                                ))}
                            </IonSelect>
                        </IonItem>

                        <IonSearchbar
                            value={searchTerm}
                            onIonChange={handleSearch}
                            placeholder="Rechercher des utilisateurs"
                            debounce={500}
                            className="ion-margin-top"
                        />

                        <div className="ion-padding-top">
                            <IonButton expand="block" onClick={createGroup} disabled={!groupName || selectedUsers.length === 0}>
                                Créer le groupe
                            </IonButton>
                        </div>
                    </IonContent>
                </IonModal>

                <IonLoading isOpen={loading} message="Chargement en cours..." />
            </IonContent>
        </IonPage>
    );
};

export default ConversationsList;