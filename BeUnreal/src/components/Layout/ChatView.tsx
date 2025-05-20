import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonTextarea,
    IonButton,
    IonIcon,
    IonAvatar,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonList
} from '@ionic/react';
import { sendOutline, imageOutline, arrowBackOutline } from 'ionicons/icons';
import ChatService, { Message } from '../../services/chat';
import { getProfilePicture } from '../../utils/userUtils';
import '../../styles/ChatView.css';

interface ChatViewProps {
    conversationId: number;
    userId: number;
    onBack: () => void;
    conversationName?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ conversationId, userId, onBack, conversationName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<number[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLIonContentElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadMessages();

        const messageListener = (message: Message) => {
            setMessages(prevMessages => {
                if (prevMessages.some(m => m.id === message.id)) {
                    return prevMessages;
                }

                if (message.senderId === userId && (!message.id || message.id <= 0)) {
                    const isDuplicate = prevMessages.some(
                        m => m.senderId === message.senderId &&
                            m.content === message.content &&
                            new Date(m.timestamp).getTime() > Date.now() - 2000
                    );
                    if (isDuplicate) {
                        return prevMessages;
                    }
                }

                return [...prevMessages, message];
            });

            if (message.senderId !== userId) {
                ChatService.markAsRead(conversationId, message.id);
            }
        };

        const typingListener = (typingUserId: number, isTyping: boolean) => {
            if (typingUserId === userId) return;

            if (isTyping) {
                setTypingUsers(prev => [...prev.filter(id => id !== typingUserId), typingUserId]);
            } else {
                setTypingUsers(prev => prev.filter(id => id !== typingUserId));
            }
        };

        ChatService.addMessageListener(conversationId, messageListener);
        ChatService.addTypingListener(conversationId, typingListener);

        return () => {
            ChatService.removeMessageListener(conversationId, messageListener);
            ChatService.removeTypingListener(conversationId, typingListener);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [conversationId, userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const messagesList = await ChatService.getConversationMessages(conversationId);
            setMessages(messagesList);
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            contentRef.current?.scrollToBottom(300);
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        // const localMessage: Message = {
        //     id: -1, // ID temporaire
        //     conversationId: conversationId,
        //     senderId: userId,
        //     type: 'text',
        //     content: newMessage.trim(),
        //     timestamp: new Date(),
        //     isRead: false
        // };
        //
        // setMessages(prevMessages => [...prevMessages, localMessage]);

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
        // À implémenter : utiliser une bibliothèque pour upload d'image
        console.log('Envoi d\'image à implémenter');
    };



    const handleTextareaChange = (e: any) => {
        const value = e.detail.value || '';
        setNewMessage(value);

        const shouldBeTyping = value.length > 0;

        if (shouldBeTyping !== isTyping) {
            setIsTyping(shouldBeTyping);
            ChatService.sendTypingStatus(conversationId, shouldBeTyping);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

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

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="#"  />
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
                                        <img src={`https://i.pravatar.cc/150?u=${message.senderId}`} alt="avatar" />
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
        </>
    );
};

export default ChatView;