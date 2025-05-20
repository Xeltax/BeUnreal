import axios from 'axios';
import {Friend} from "../types";

const API_URL = 'http://localhost:3000/api/friends';

export interface User {
    id: number;
    username: string;
    name: string;
    profilePicture?: string;
}

export interface FriendRequest {
    id: number;
    requesterId: number;
    addresseeId: number;
    requester: User;
    addressee: User;
    status: 'pending' | 'accepted' | 'declined' | 'blocked';
    createdAt: Date;
}

class FriendService {
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('beunreal_token');
    }

    async searchUsers(query: string): Promise<User[]> {
        try {
            const response = await axios.get(`${API_URL}/search`, {
                params: { query },
                headers: { Authorization: `Bearer ${this.token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateurs:', error);
            throw error;
        }
    }

    async getFriends(): Promise<Friend[]> {
        try {
            const response = await axios.get(`${API_URL}/list`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            return response.data.friends;
        } catch (error) {
            console.error('Erreur lors de la récupération des amis:', error);
            throw error;
        }
    }

    async getPendingRequests(): Promise<{ received: FriendRequest[], sent: FriendRequest[] }> {
        try {
            const response = await axios.get(`${API_URL}/pending`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            console.log(response)
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des demandes en attente:', error);
            throw error;
        }
    }

    async sendFriendRequest(addresseeId: number): Promise<FriendRequest> {
        try {
            const response = await axios.post(`${API_URL}/request`,
                { addresseeId },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            return response.data.friendship;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
            throw error;
        }
    }

    async respondToFriendRequest(friendshipId: number, accept: boolean): Promise<FriendRequest> {
        try {
            const response = await axios.post(`${API_URL}/respond`,
                { friendshipId, accept },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            return response.data.friendship;
        } catch (error) {
            console.error('Erreur lors de la réponse à la demande d\'ami:', error);
            throw error;
        }
    }

    async blockUser(friend: Friend): Promise<FriendRequest> {
        try {
            const userId = friend.id;
            const response = await axios.post(`${API_URL}/block`,
                { userId },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            return response.data.friendship;
        } catch (error) {
            console.error('Erreur lors du blocage de l\'utilisateur:', error);
            throw error;
        }
    }

    async unblockUser(friend: Friend): Promise<void> {
        try {
            const userId = friend.id;
            await axios.post(`${API_URL}/unblock`,
                { userId },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
        } catch (error) {
            console.error('Erreur lors du déblocage de l\'utilisateur:', error);
            throw error;
        }
    }

    async removeFriend(friend: Friend): Promise<void> {
        try {
            const friendId = friend.id;
            await axios.post(`${API_URL}/remove`,
                { friendId },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'ami:', error);
            throw error;
        }
    }
}

export default new FriendService();