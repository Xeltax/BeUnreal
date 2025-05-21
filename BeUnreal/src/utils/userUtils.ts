import {Friend} from '../types';
import {MESSAGES_URL} from "./env";

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    name?: string;
    bio?: string;
    profilePicture?: string;
    createdAt: string;
}

export const getProfilePicture = (user: Friend): string => {
    if (!user) return 'https://ionicframework.com/docs/img/demos/avatar.svg';

    if (user.profilePicture) {
        // Si l'URL est complète, la retourner directement
        if (user.profilePicture.startsWith('http')) {
            return user.profilePicture;
        }
        // Sinon, construire l'URL complète (selon ton implémentation)
        return `${MESSAGES_URL}/uploads/${user.profilePicture}`;
    }

    // Utiliser un avatar de placeholder avec l'ID de l'utilisateur pour la consistance
    return `https://i.pravatar.cc/150?u=${user.id}`;
};

export const formatUsername = (username: string, defaultText: string = 'Utilisateur'): string => {
    if (!username) return defaultText;
    return username || `${defaultText} ${username}`;
};