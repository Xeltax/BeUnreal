import {io, Socket} from 'socket.io-client';
import axios from 'axios';
import {MESSAGES_URL} from "../utils/env";

export interface Friend {
    id: number;
    username: string;
    profilePicture?: string;
}

export interface Conversation {
    id: number;
    isGroup: boolean;
    name?: string;
    lastMessageAt: Date;
    participants: { userId: number }[];
    messages: Message[];
}

export interface Message {
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
    private static instance: ChatService;
    private socket: Socket | null = null;
    private API_URL = `${MESSAGES_URL}/api/messages`;
    private messageListeners: Map<number, ((message: Message) => void)[]> = new Map();
    private typingListeners: Map<number, ((userId: number, isTyping: boolean) => void)[]> = new Map();

    private constructor() {}

    static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    initializeSocket(): void {
        if (this.socket?.connected) {
            return;
        }

        const token = localStorage.getItem('beunreal_token');

        if (!token) {
            console.error('No token found, cannot initialize socket');
            return;
        }

        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(MESSAGES_URL, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('newMessage', (data: { conversationId: number, message: Message }) => {
            const listeners = this.messageListeners.get(data.conversationId) || [];
            listeners.forEach(listener => listener(data.message));
        });

        this.socket.on('userTyping', (data: { conversationId: number, userId: number, isTyping: boolean }) => {
            const listeners = this.typingListeners.get(data.conversationId) || [];
            listeners.forEach(listener => listener(data.userId, data.isTyping));
        });

        this.socket.on('error', (error: string) => {
            console.error('Socket error:', error);
        });

        this.socket.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnectSocket(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    async getUserConversations(): Promise<Conversation[]> {
        try {
            const token = localStorage.getItem('beunreal_token');
            const response = await axios.get(`${this.API_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Conversations:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des conversations :', error);
            throw error;
        }
    }

    async createOrGetConversation(friendId: number): Promise<Conversation> {
        try {
            const token = localStorage.getItem('beunreal_token');
            const response = await axios.post(`${this.API_URL}/conversation`,
                { userId: friendId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de la conversation :', error);
            throw error;
        }
    }

    async getConversationMessages(conversationId: number): Promise<Message[]> {
        try {
            const token = localStorage.getItem('beunreal_token');
            const response = await axios.get(`${this.API_URL}/conversation/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des messages :', error);
            throw error;
        }
    }

    async createGroupConversation(name: string, userIds: number[]): Promise<Conversation> {
        try {
            const token = localStorage.getItem('beunreal_token');
            const response = await axios.post(`${this.API_URL}/group`,
                { name, userIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de la conversation de groupe :', error);
            throw error;
        }
    }

    sendMessage(conversationId: number, content: string, type: 'text' | 'image' | 'video' = 'text', mediaUrl?: string): void {
        if (!this.socket) {
            console.error('Socket not initialized');
            return;
        }

        this.socket.emit('message', {
            conversationId,
            message: {
                type,
                content,
                mediaUrl
            }
        });
    }

    markAsRead(conversationId: number, messageId: number): void {
        if (!this.socket) {
            console.error('Socket not initialized');
            return;
        }

        this.socket.emit('markAsRead', {
            conversationId,
            messageId
        });
    }

    sendTypingStatus(conversationId: number, isTyping: boolean): void {
        if (!this.socket) {
            console.error('Socket not initialized');
            return;
        }

        this.socket.emit('typing', {
            conversationId,
            isTyping
        });
    }

    addMessageListener(conversationId: number, listener: (message: Message) => void): void {
        const listeners = this.messageListeners.get(conversationId) || [];
        listeners.push(listener);
        this.messageListeners.set(conversationId, listeners);
    }

    removeMessageListener(conversationId: number, listener: (message: Message) => void): void {
        const listeners = this.messageListeners.get(conversationId) || [];
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
            this.messageListeners.set(conversationId, listeners);
        }
    }

    addTypingListener(conversationId: number, listener: (userId: number, isTyping: boolean) => void): void {
        const listeners = this.typingListeners.get(conversationId) || [];
        listeners.push(listener);
        this.typingListeners.set(conversationId, listeners);
    }

    removeTypingListener(conversationId: number, listener: (userId: number, isTyping: boolean) => void): void {
        const listeners = this.typingListeners.get(conversationId) || [];
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
            this.typingListeners.set(conversationId, listeners);
        }
    }
}

export default ChatService.getInstance();