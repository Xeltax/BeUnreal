import React, { useEffect, useRef, useState } from 'react';
import {
    IonAvatar,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonList,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { imageOutline, sendOutline } from 'ionicons/icons';
import ChatService, { Message } from '../../services/chat';
import '../../styles/ChatView.css';
import { AuthService } from "../../services/auth";
import {MEDIAS_URL, USERS_URL} from "../../utils/env";

interface ChatViewProps {
    conversationId: number;
    userId: number;
    onBack: () => void;
    conversationName?: string;
}

interface UserProfile {
    id: number;
    username: string;
    profilePicture?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ conversationId, userId, onBack, conversationName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<number[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [userProfiles, setUserProfiles] = useState<Map<number, UserProfile>>(new Map());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLIonContentElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadMessages().finally();

        const messageListener = async (message: Message) => {
            const isDuplicate = messages.some(m => m.id === message.id);
            if (isDuplicate) return;

            if (message.senderId === userId && (!message.id || message.id <= 0)) {
                const duplicateByTime = messages.some(
                    m =>
                        m.senderId === message.senderId &&
                        m.content === message.content &&
                        new Date(m.timestamp).getTime() > Date.now() - 2000
                );
                if (duplicateByTime) return;
            }

            let enrichedMessage = { ...message };
            if (message.type !== 'text' && message.mediaUrl) {
                try {
                    const res = await fetch(`${MEDIAS_URL}/api/media/${message.mediaUrl}`, {
                        headers: {
                            Authorization: `Bearer ${AuthService.getToken()!}`,
                        },
                    });

                    if (res.ok) {
                        const data = await res.json();
                        enrichedMessage.mediaUrl = data.url;
                    }
                } catch (err) {
                    console.error('Erreur lors du chargement d\'un media en temps réel :', err);
                }
            }

            setMessages(prevMessages => [...prevMessages, enrichedMessage]);

            if (message.senderId !== userId) {
                ChatService.markAsRead(conversationId, message.id);
            }

            await ensureUserProfile(message.senderId);
        };

        const typingListener = (typingUserId: number, isTyping: boolean) => {
            if (typingUserId === userId) return;

            setTypingUsers(prev =>
                isTyping
                    ? [...prev.filter(id => id !== typingUserId), typingUserId]
                    : prev.filter(id => id !== typingUserId)
            );
        };

        ChatService.addMessageListener(conversationId, messageListener);
        ChatService.addTypingListener(conversationId, typingListener);

        return () => {
            ChatService.removeMessageListener(conversationId, messageListener);
            ChatService.removeTypingListener(conversationId, typingListener);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [conversationId, userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const messagesList = await ChatService.getConversationMessages(conversationId);

            const enrichedMessages = await Promise.all(
                messagesList.map(async (msg) => {
                    await ensureUserProfile(msg.senderId);
                    if (msg.type !== 'text' && msg.mediaUrl) {
                        try {
                            const res = await fetch(`${MEDIAS_URL}/api/media/${msg.mediaUrl}`, {
                                headers: {
                                    Authorization: `Bearer ${AuthService.getToken()!}`
                                }
                            });

                            if (!res.ok) throw new Error('Erreur récupération média');
                            const data = await res.json();
                            return { ...msg, mediaUrl: data.url };
                        } catch (e) {
                            console.error('Erreur chargement media :', msg.mediaUrl, e);
                            return msg;
                        }
                    } else {
                        return msg;
                    }
                })
            );

            setMessages(enrichedMessages);
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const ensureUserProfile = async (senderId: number) => {
        if (userProfiles.has(senderId)) return;

        try {
            const res = await fetch(`${USERS_URL}/api/users/internal/profile/${senderId}`, {
                headers: {
                    Authorization: `Bearer ${AuthService.getToken()!}`
                }
            });

            if (!res.ok) throw new Error(`Erreur lors de la récupération du profil utilisateur ${senderId}`);

            const data: UserProfile = await res.json();
            setUserProfiles(prev => new Map(prev).set(senderId, data));
        } catch (e) {
            console.error('Erreur récupération utilisateur :', senderId, e);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            contentRef.current?.scrollToBottom(300);
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        setNewMessage('');

        if (isTyping) {
            setIsTyping(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            ChatService.sendTypingStatus(conversationId, false);
        }

        ChatService.sendMessage(conversationId, newMessage.trim());
    };

    const handleSendImage = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fileType = file.type.startsWith('image') ? 'image' :
            file.type.startsWith('video') ? 'video' : null;

        if (!fileType) {
            console.warn('Type de fichier non supporté :', file.type);
            return;
        }

        try {
            const media: { key: string } = await uploadFile(file);
            ChatService.sendMessage(conversationId, '', fileType, media.key);
        } catch (err) {
            console.error('Erreur lors de l\'envoi du fichier', err);
        } finally {
            event.target.value = '';
        }
    };

    const uploadFile = async (file: File): Promise<{ key: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${USERS_URL}/api/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()!}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Erreur lors de l\'upload');

        return await response.json();
    };

    const handleTextareaChange = (e: any) => {
        const value = e.detail.value || '';
        setNewMessage(value);

        const shouldBeTyping = value.length > 0;

        if (shouldBeTyping !== isTyping) {
            setIsTyping(shouldBeTyping);
            ChatService.sendTypingStatus(conversationId, shouldBeTyping);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (shouldBeTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                ChatService.sendTypingStatus(conversationId, false);
                typingTimeoutRef.current = null;
            }, 3000);
        }
    };

    const formatMessageTime = (timestamp: Date) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getAvatarUrl = (senderId: number): string => {
        const profile = userProfiles.get(senderId);
        return profile?.profilePicture || `https://i.pravatar.cc/150?u=${senderId}`;
    };

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="#" />
                    </IonButtons>
                    <IonTitle>{conversationName || 'Discussion'}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent ref={contentRef} className="chat-content">
                {isLoading ? (
                    <div className="loading-container">
                        <IonSpinner name="crescent" />
                    </div>
                ) : (
                    <IonList className="message-list">
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`message-container ${message.senderId === userId ? 'my-message' : 'other-message'}`}
                            >
                                {message.senderId !== userId && (
                                    <IonAvatar className="message-avatar">
                                        <img src={getAvatarUrl(message.senderId)} alt="avatar" />
                                    </IonAvatar>
                                )}
                                <div className="message-bubble">
                                    {message.type === 'text' ? (
                                        <p>{message.content}</p>
                                    ) : message.type === 'image' ? (
                                        <img src={message.mediaUrl} alt="media" className="message-media" />
                                    ) : (
                                        <video src={message.mediaUrl} controls className="message-media" />
                                    )}
                                    <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                                </div>
                            </div>
                        ))}
                    </IonList>
                )}

                {typingUsers.length > 0 && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <p>En train d'écrire...</p>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </IonContent>

            <IonFooter>
                <div className="input-container">
                    <IonButton fill="clear" onClick={handleSendImage}>
                        <IonIcon icon={imageOutline} slot="icon-only" />
                    </IonButton>

                    <IonTextarea
                        value={newMessage}
                        onIonChange={handleTextareaChange}
                        placeholder="Écrivez un message..."
                        autoGrow
                        rows={1}
                        maxlength={500}
                        className="message-input"
                    />

                    <IonButton
                        fill="clear"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                    >
                        <IonIcon icon={sendOutline} slot="icon-only" />
                    </IonButton>
                </div>
            </IonFooter>

            <input
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />
        </>
    );
};

export default ChatView;