import api from './api';
import { Socket, io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api/messages';

let socket: Socket | null = null;

// Initialiser la connexion socket
export const initSocket = (token: string): Socket => {
    if (socket) {
        socket.disconnect();
    }

    socket = io(SOCKET_URL, {
        auth: {
            token,
        },
    });

    socket.on('connect', () => {
        console.log('Connecté au serveur socket');
    });

    socket.on('connect_error', (error) => {
        console.error('Erreur de connexion socket:', error.message);
    });

    return socket;
};

// Récupérer le socket
export const getSocket = (): Socket | null => {
    return socket;
};

// Fermer la connexion socket
export const closeSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// API pour créer ou récupérer une conversation avec un utilisateur
export const createOrGetConversation = async (userId: number): Promise<any> => {
    const response = await api.post(`${API_URL}/conversation`, { userId });
    return response.data;
};

// API pour créer une conversation de groupe
export const createGroupConversation = async (name: string, userIds: number[]): Promise<any> => {
    const response = await api.post(`${API_URL}/group`, { name, userIds });
    return response.data;
};

// API pour récupérer toutes les conversations de l'utilisateur
export const getUserConversations = async (): Promise<any[]> => {
    const response = await api.get(`${API_URL}/conversations`);
    return response.data;
};

// API pour récupérer les messages d'une conversation
export const getConversationMessages = async (conversationId: number): Promise<any[]> => {
    const response = await api.get(`${API_URL}/conversation/${conversationId}`);
    return response.data;
};

// API pour envoyer un message texte
export const sendTextMessage = async (conversationId: number, content: string): Promise<any> => {
    const response = await api.post(`${API_URL}/text`, { conversationId, content });
    return response.data;
};

// API pour envoyer un message média (image ou vidéo)
export const sendMediaMessage = async (
    conversationId: number,
    type: 'image' | 'video',
    content: string,
    mediaUrl: string
): Promise<any> => {
    const response = await api.post(`${API_URL}/media`, { conversationId, type, content, mediaUrl });
    return response.data;
};

// Envoyer un message via socket
export const sendMessageSocket = (conversationId: number, message: any): void => {
    if (!socket) {
        throw new Error('Socket non initialisé');
    }
    socket.emit('message', { conversationId, message });
};

// Marquer les messages comme lus via socket
export const markAsReadSocket = (conversationId: number, messageId: number): void => {
    if (!socket) {
        throw new Error('Socket non initialisé');
    }
    socket.emit('markAsRead', { conversationId, messageId });
};

// Indiquer que l'utilisateur est en train de saisir via socket
export const sendTypingSocket = (conversationId: number, isTyping: boolean): void => {
    if (!socket) {
        throw new Error('Socket non initialisé');
    }
    socket.emit('typing', { conversationId, isTyping });
};