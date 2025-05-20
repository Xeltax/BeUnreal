import React from 'react';
import {
    IonAvatar,
    IonBadge,
    IonFab,
    IonFabButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSkeletonText
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { Conversation, Friend } from '../../services/chat';
import { getProfilePicture, formatUsername } from '../../utils/userUtils';
import '../../styles/ConversationList.css';

interface ConversationListProps {
    conversations: Conversation[];
    friends: Friend[];
    isLoading: boolean;
    currentUserId: number;
    onOpenChat: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
                                                               conversations,
                                                               friends,
                                                               isLoading,
                                                               currentUserId,
                                                               onOpenChat
                                                           }) => {
    const getLastMessage = (conversation: Conversation) => {
        if (conversation.messages && conversation.messages.length > 0) {
            const lastMessage = conversation.messages[0];
            if (lastMessage.type === 'text') {
                return lastMessage.content;
            } else if (lastMessage.type === 'image') {
                return '📷 Image';
            } else if (lastMessage.type === 'video') {
                return '🎥 Vidéo';
            }
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

    const hasUnreadMessages = (conversation: Conversation) => {
        return conversation.messages.some(m => !m.isRead && m.senderId !== currentUserId);
    };

    const getConversationName = (conversation: Conversation): string => {
        if (conversation.name) {
            return conversation.name;
        }

        if (!conversation.isGroup) {
            const participant = conversation.participants.find(p => p.userId !== currentUserId);
            if (participant) {
                const friend = friends.find(f => f.id === participant.userId);
                if (friend) {
                    return formatUsername(friend.username);
                }
            }
        }

        return "Conversation";
    };

    const getConversationAvatar = (conversation: Conversation): string => {
        if (!conversation.isGroup) {
            const participant = conversation.participants.find(p => p.userId !== currentUserId);
            if (participant) {
                const friend = friends.find(f => f.id === participant.userId);
                if (friend) {
                    return getProfilePicture(friend);
                }
            }
        }

        // Pour les groupes ou quand l'ami n'est pas trouvé
        return `https://i.pravatar.cc/150?u=${conversation.id}`;
    };

    return (
        <div className="conversations-container">
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
                    {conversations.length > 0 ? (
                        <IonList className="conversations-list">
                            {conversations.map(conversation => (
                                <IonItem
                                    key={conversation.id}
                                    className="conversation-item"
                                    detail={false}
                                    button
                                    onClick={() => onOpenChat(conversation)}
                                >
                                    <IonAvatar slot="start" className="conversation-avatar">
                                        <img src={getConversationAvatar(conversation)} alt={getConversationName(conversation)} />
                                    </IonAvatar>
                                    <IonLabel>
                                        <h2>{getConversationName(conversation)}</h2>
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
                                <IonIcon icon={addOutline} />
                            </div>
                            <h3>Aucune conversation trouvée</h3>
                            <p>Commencez à discuter avec vos amis</p>
                        </div>
                    )}
                </>
            )}

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
                <IonFabButton color="primary">
                    <IonIcon icon={addOutline} />
                </IonFabButton>
            </IonFab>
        </div>
    );
};

export default ConversationList;