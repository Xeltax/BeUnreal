import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonFooter,
    IonItem,
    IonInput,
    IonText,
    IonAvatar,
    IonLoading,
    IonFab,
    IonFabButton,
    IonActionSheet,
    IonBadge,
} from '@ionic/react';
import { send, camera, image, videocam, ellipsisVertical, arrowBack } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router';
import { getConversationMessages, sendTextMessage, sendMediaMessage, getSocket, markAsReadSocket, sendTypingSocket } from '../services/message';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface Message {
    id: number;
    senderId: number;
    type: 'text' | 'image' | 'video';
    content: string;
    mediaUrl?: string;
    timestamp: string;
    isRead: boolean;
}

interface ChatRoomParams {
    id: string;
}

const ChatRoom: React.FC = () => {
    const { id } = useParams<ChatRoomParams>();
    const history = useHistory();
    const contentRef = useRef<HTMLIonContentElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationTitle, setConversationTitle] = useState('Conversation');
    const [showActions, setShowActions] = useState(false);
    const [typingUsers, setTypingUsers] = useState<number[]>([]);

    // Obtenir l'ID de l'utilisateur actuel
    const currentUserId = parseInt(localStorage.getItem('userId') || '0');

    const loadMessages = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getConversationMessages(parseInt(id));
            setMessages(data);

            // Marquer le dernier message comme lu
            if (data.length > 0) {
                const lastMessage = data[data.length - 1];
                if (lastMessage.senderId !== currentUserId) {
                    markAsReadSocket(parseInt(id), lastMessage.id);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();

        // Écouter les nouveaux messages via socket
        const socket = getSocket();
        if (socket) {
            // Écouter les nouveaux messages
            socket.on('newMessage', (data) => {
                if (data.conversationId === parseInt(id)) {
                    setMessages(prev => [...prev, data.message]);

                    // Marquer le message comme lu s'il provient d'un autre utilisateur
                    if (data.message.senderId !== currentUserId) {
                        markAsReadSocket(parseInt(id), data.message.id);
                    }
                }
            });

            // Écouter les notifications de saisie
            socket.on('userTyping', (data) => {
                if (data.conversationId === parseInt(id)) {
                    if (data.isTyping) {
                        setTypingUsers(prev => [...prev, data.userId]);
                    } else {
                        setTypingUsers(prev => prev.filter(userId => userId !== data.userId));
                    }
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('newMessage');
                socket.off('userTyping');
            }
        };
    }, [id, currentUserId]);

    useEffect(() => {
        // Faire défiler jusqu'au dernier message
        if (contentRef.current) {
            contentRef.current.scrollToBottom(300);
        }
    }, [messages]);

    const handleSendText = async () => {
        if (!text.trim()) return;

        try {
            const trimmedText = text.trim();
            setText('');

            // Envoyer l'indication que l'utilisateur n'est plus en train de saisir
            sendTypingSocket(parseInt(id), false);

            // Envoyer le message via l'API
            await sendTextMessage(parseInt(id), trimmedText);
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
        }
    };

    const handleInputChange = (e: CustomEvent) => {
        const value = e.detail.value || '';
        setText(value);

        // Envoyer l'indication que l'utilisateur est en train de saisir
        sendTypingSocket(parseInt(id), !!value);
    };

    const handleTakePhoto = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
            });

            if (image.dataUrl) {
                // Envoyer l'image via l'API
                await sendMediaMessage(parseInt(id), 'image', '', image.dataUrl);
            }
        } catch (error) {
            console.error('Erreur lors de la prise de photo:', error);
        }
    };

    const handleSelectImage = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos,
            });

            if (image.dataUrl) {
                // Envoyer l'image via l'API
                await sendMediaMessage(parseInt(id), 'image', '', image.dataUrl);
            }
        } catch (error) {
            console.error('Erreur lors de la sélection de l\'image:', error);
        }
    };

    const handleSelectVideo = async () => {
        try {
            // Note: La sélection de vidéo peut nécessiter des plugins supplémentaires
            alert('Fonctionnalité de vidéo en cours d\'implémentation');
            // Simuler l'envoi d'une vidéo (à remplacer par l'implémentation réelle)
            // await sendMediaMessage(parseInt(id), 'video', 'Vidéo', 'URL_VIDEO');
        } catch (error) {
            console.error('Erreur lors de la sélection de la vidéo:', error);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Aujourd\'hui';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hier';
        } else {
            return date.toLocaleDateString();
        }
    };

    // Déterminer si un message appartient à un nouveau jour
    const isNewDay = (index: number, messages: Message[]) => {
        if (index === 0) return true;

        const currentDate = new Date(messages[index].timestamp).toDateString();
        const prevDate = new Date(messages[index - 1].timestamp).toDateString();

        return currentDate !== prevDate;
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/conversations" />
                    </IonButtons>
                    <IonTitle>{conversationTitle}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowActions(true)}>
                            <IonIcon icon={ellipsisVertical} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent ref={contentRef} className="ion-padding">
                {error && (
                    <IonText color="danger" className="ion-padding">
                        <p>{error}</p>
                    </IonText>
                )}

                {messages.map((message, index) => (
                    <React.Fragment key={message.id}>
                        {isNewDay(index, messages) && (
                            <div className="ion-text-center ion-margin-vertical">
                                <IonBadge color="light">
                                    {formatDate(message.timestamp)}
                                </IonBadge>
                            </div>
                        )}

                        <div
                            className={`message-container ${message.senderId === currentUserId ? 'my-message' : 'other-message'}`}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                                marginBottom: '10px',
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: message.senderId === currentUserId ? '#4c8dff' : '#f4f5f8',
                                    color: message.senderId === currentUserId ? 'white' : 'black',
                                    borderRadius: '12px',
                                    padding: '8px 12px',
                                    maxWidth: '70%',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {message.type === 'text' ? (
                                    <p style={{ margin: '0' }}>{message.content}</p>
                                ) : message.type === 'image' ? (
                                    <img
                                        src={message.mediaUrl}
                                        alt="Image"
                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <video
                                        controls
                                        src={message.mediaUrl}
                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                    />
                                )}
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        textAlign: 'right',
                                        marginTop: '4px',
                                        opacity: '0.7',
                                    }}
                                >
                                    {formatTime(message.timestamp)}
                                    {message.senderId === currentUserId && (
                                        <span style={{ marginLeft: '4px' }}>
                      {message.isRead ? '✓✓' : '✓'}
                    </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                ))}

                {typingUsers.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            margin: '10px 0',
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#f4f5f8',
                                color: 'black',
                                borderRadius: '12px',
                                padding: '8px 12px',
                                fontSize: '0.9rem',
                            }}
                        >
                            En train d'écrire...
                        </div>
                    </div>
                )}
            </IonContent>
            <IonFooter>
                <IonItem lines="none">
                    <IonInput
                        placeholder="Tapez un message..."
                        value={text}
                        onIonChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                        clearInput
                    />
                    <IonButton
                        slot="end"
                        fill="clear"
                        onClick={handleSendText}
                        disabled={!text.trim()}
                    >
                        <IonIcon icon={send} slot="icon-only" />
                    </IonButton>
                </IonItem>
            </IonFooter>

            <IonActionSheet
                isOpen={showActions}
                onDidDismiss={() => setShowActions(false)}
                buttons={[
                    {
                        text: 'Prendre une photo',
                        icon: camera,
                        handler: () => {
                            handleTakePhoto();
                        },
                    },
                    {
                        text: 'Sélectionner une image',
                        icon: image,
                        handler: () => {
                            handleSelectImage();
                        },
                    },
                    {
                        text: 'Sélectionner une vidéo',
                        icon: videocam,
                        handler: () => {
                            handleSelectVideo();
                        },
                    },
                    {
                        text: 'Annuler',
                        role: 'cancel',
                    },
                ]}
            />

            <IonLoading isOpen={loading} message="Chargement en cours..." />
        </IonPage>
    );
};

export default ChatRoom;