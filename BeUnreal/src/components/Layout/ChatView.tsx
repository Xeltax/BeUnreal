import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonItem,
    IonTextarea,
    IonButton,
    IonIcon,
    IonAvatar,
    IonList,
    IonSpinner,
    IonBackButton,
    IonButtons
} from '@ionic/react';
import { sendOutline, imageOutline, arrowBackOutline } from 'ionicons/icons';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import '../../styles/ChatView.css';

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    type: 'text' | 'image' | 'video';
    content: string;
    mediaUrl?: string;
    timestamp: Date;
    isRead: boolean;
}

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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<number[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLIonContentElement>(null);

    // Connexion à Socket.io au montage du composant
    useEffect(() => {
        const token = localStorage.getItem('token');
        const socketInstance = io('http://localhost:3001', {
            auth: { token }
        });

        socketInstance.on('connect', () => {
            console.log('Connected to socket server');
        });

        socketInstance.on('newMessage', (data: { conversationId: number, message: Message }) => {
            if (data.conversationId === conversationId) {
                setMessages(prevMessages => [...prevMessages, data.message]);

                // Marquer le message comme lu si ce n'est pas le nôtre
                if (data.message.senderId !== userId) {
                    socketInstance.emit('markAsRead', {
                        conversationId,
                        messageId: data.message.id
                    });
                }
            }
        });

        socketInstance.on('userTyping', (data: { conversationId: number, userId: number, isTyping: boolean }) => {
            if (data.conversationId === conversationId) {
                if (data.isTyping) {
                    setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
                } else {
                    setTypingUsers(prev => prev.filter(id => id !== data.userId));
                }
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [conversationId, userId]);

    // Chargement des messages depuis l'API
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:3001/api/messages/conversation/${conversationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(response.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des messages:', error);
                setIsLoading(false);
            }
        };

        fetchMessages();
    }, [conversationId]);

    // Scroll automatique vers le dernier message
    useEffect(() => {
        if (messagesEndRef.current) {
            contentRef.current?.scrollToBottom(300);
        }
    }, [messages]);

    // Gérer l'envoi d'un message
    const handleSendMessage = () => {
        if (!newMessage.trim() || !socket) return;

        // Envoyer via Socket.io
        socket.emit('message', {
            conversationId,
            message: {
                type: 'text',
                content: newMessage.trim()
            }
        });

        // Réinitialiser le champ de saisie
        setNewMessage('');

        // Indiquer qu'on ne tape plus
        handleTyping(false);
    };

    // Gérer l'envoi d'une image
    const handleSendImage = () => {
        // À implémenter : utiliser une bibliothèque pour upload d'image
        console.log('Envoi d\'image à implémenter');
    };

    // Gérer les événements de typing
    const handleTyping = (isTyping: boolean) => {
        if (socket) {
            socket.emit('typing', {
                conversationId,
                isTyping
            });
        }
    };

    const handleTextareaChange = (e: any) => {
        const value = e.detail.value || '';
        setNewMessage(value);

        // Gérer les événements de saisie
        if (value.length > 0 && !isTyping) {
            setIsTyping(true);
            handleTyping(true);
        } else if (value.length === 0 && isTyping) {
            setIsTyping(false);
            handleTyping(false);
        }
    };

    // Formater la date
    const formatMessageTime = (timestamp: Date) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                        <img src={`https://i.pravatar.cc/150?u=${message.senderId}`} alt="avatar" />
                                    </IonAvatar>
                                )}
                                <div className="message-bubble">
                                    {message.type === 'text' ? (
                                        <p>{message.content}</p>
                                    ) : (
                                        <img src={message.mediaUrl} alt="media" className="message-media" />
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