import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:3001/api/messages';

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

class ChatService {
    private socket: Socket | null = null;
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('token');
    }

    connectSocket(): Socket {
        if (!this.socket) {
            this.socket = io('http://localhost:3001', {
                auth: { token: this.token }
            });
        }
        return this.socket;
    }

    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    async getUserConversations(): Promise<Conversation[]> {
        try {
            const response = await axios.get(`${API_URL}/conversations`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des conversations:', error);
            throw error;
        }
    }

    async getConversationMessages(conversationId: number): Promise<Message[]> {
        try {
            const response = await axios.get(`${API_URL}/conversation/${conversationId}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des messages:', error);
            throw error;
        }
    }

    async createOrGetConversation(userId: number): Promise<Conversation> {
        try {
            const response = await axios.post(`${API_URL}/conversation`,
                { userId },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
            throw error;
        }
    }

    async createGroupConversation(name: string, userIds: number[]): Promise<Conversation> {
        try {
            const response = await axios.post(`${API_URL}/group`,
                { name, userIds },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création du groupe:', error);
            throw error;
        }
    }

    async sendTextMessage(conversationId: number, content: string): Promise<Message> {
        try {
            const response = await axios.post(`${API_URL}/text`,
                { conversationId, content },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            throw error;
        }
    }

    async sendMediaMessage(conversationId: number, type: 'image' | 'video', mediaUrl: string, content?: string): Promise<Message> {
        try {
            const response = await axios.post(`${API_URL}/media`,
                { conversationId, type, mediaUrl, content },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du média:', error);
            throw error;
        }
    }
}

export default new ChatService();