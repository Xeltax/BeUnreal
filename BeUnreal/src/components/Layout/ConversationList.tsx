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
    IonSearchbar,
    IonButton,
    IonIcon,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonModal,
} from '@ionic/react';
import {
    personAddOutline,
    peopleOutline,
    chatbubbleOutline,
    addOutline,
    notificationsOutline
} from 'ionicons/icons';
import ChatService from '../../services/chat';
import ChatView from './ChatView';
import '../../styles/ConversationList.css';

interface Conversation {
    id: number;
    isGroup: boolean;
    name?: string;
    lastMessageAt: Date;
    participants: {
        userId: number;
    }[];
    messages: {
        id: number;
        senderId: number;
        content: string;
        timestamp: Date;
        isRead: boolean;
    }[];
}

const ConversationList: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [segment, setSegment] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const currentUserId = parseInt(localStorage.getItem('userId') || '0');

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        setIsLoading(true);
        try {
            const data = await ChatService.getUserConversations();
            setConversations(data);
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = (event: CustomEvent) => {
        loadConversations().then(() => {
            event.detail.complete();
        });
    };

    const filteredConversations = conversations.filter(conversation => {
        const matchesSearch = conversation.name?.toLowerCase().includes(searchText.toLowerCase()) || false;
        const hasUnreadMessages = conversation.messages.some(m => !m.isRead && m.senderId !== currentUserId);

        const matchesSegment = segment === 'all' ||
            (segment === 'unread' && hasUnreadMessages);

        return matchesSearch || matchesSegment;
    });

    const getLastMessage = (conversation: Conversation) => {
        if (conversation.messages && conversation.messages.length > 0) {
            return conversation.messages[0].content;
        }
        return "Pas encore de message";
    };

    const formatLastMessageTime = (timestamp: Date) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Hier';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'long' });
        } else {
            return date.toLocaleDateString();
        }
    };

    const handleOpenChat = (conversation: Conversation) => {
        setSelectedConversation(conversation);
    };

    const handleCloseChat = () => {
        setSelectedConversation(null);
        loadConversations(); // Recharger pour voir les nouveaux messages
    };

    const hasUnreadMessages = (conversation: Conversation) => {
        return conversation.messages.some(m => !m.isRead && m.senderId !== currentUserId);
    };

    return (
        <div className="conversations-container">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Messages</IonTitle>
                    <div className="ion-buttons ion-buttons-end" slot="end">
                        <IonButton>
                            <IonIcon icon={notificationsOutline} />
                            {conversations.filter(c => hasUnreadMessages(c)).length > 0 && (
                                <IonBadge color="primary" className="notification-badge">
                                    {conversations.filter(c => hasUnreadMessages(c)).length}
                                </IonBadge>
                            )}
                        </IonButton>
                        <IonButton>
                            <IonIcon icon={personAddOutline} />
                        </IonButton>
                    </div>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar
                        value={searchText}
                        onIonChange={e => setSearchText(e.detail.value || '')}
                        placeholder="Rechercher des conversations"
                        animated
                        className="custom-searchbar"
                    />
                </IonToolbar>
                <IonToolbar>
                    {/*// @ts-ignore*/}
                    <IonSegment value={segment} onIonChange={e => setSegment(e.detail.value || 'all')}>
                        <IonSegmentButton value="all">
                            <IonIcon icon={peopleOutline} />
                            <IonLabel>Toutes</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="unread">
                            <IonIcon icon={chatbubbleOutline} />
                            <IonLabel>Non lues</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent className="conversations-content">
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
                        {filteredConversations.length > 0 ? (
                            <IonList className="conversations-list">
                                {filteredConversations.map(conversation => (
                                    <IonItem key={conversation.id} className="conversation-item" detail={false} button onClick={() => handleOpenChat(conversation)}>
                                        <IonAvatar slot="start" className="conversation-avatar">
                                            <img src={`https://i.pravatar.cc/150?u=${conversation.id}`} alt={conversation.name} />
                                        </IonAvatar>
                                        <IonLabel>
                                            <h2>{conversation.name || 'Discussion'}</h2>
                                            <p className="message-preview">{getLastMessage(conversation)}</p>
                                            <p className="time-preview">{formatLastMessageTime(new Date(conversation.lastMessageAt))}</p>
                                        </IonLabel>
                                        {hasUnreadMessages(conversation) && (
                                            <div className="message-indicator" slot="end"></div>
                                        )}
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : (
                            <div className="no-results">
                                <div className="no-results-icon">
                                    <IonIcon icon={peopleOutline} />
                                </div>
                                <h3>Aucune conversation trouvée</h3>
                                <p>Commencez à discuter avec vos amis</p>
                            </div>
                        )}
                    </>
                )}
            </IonContent>

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
                <IonFabButton color="primary">
                    <IonIcon icon={addOutline} />
                </IonFabButton>
            </IonFab>

            <IonModal isOpen={!!selectedConversation} onDidDismiss={handleCloseChat}>
                {selectedConversation && (
                    <ChatView
                        conversationId={selectedConversation.id}
                        userId={currentUserId}
                        onBack={handleCloseChat}
                        conversationName={selectedConversation.name}
                    />
                )}
            </IonModal>
        </div>
    );
};

export default ConversationList;