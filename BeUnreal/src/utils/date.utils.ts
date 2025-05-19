export const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Conversion en secondes, minutes, heures, jours
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Textes à afficher en fonction du temps écoulé
    if (diffSec < 60) {
        return 'À l\'instant';
    } else if (diffMin < 60) {
        return `Il y a ${diffMin} min${diffMin > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
        // Formater en date normale pour les dates plus anciennes
        return formatDate(dateString);
    }
};

export const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Format d'heure : HH:MM
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
        return timeStr;
    } else {
        // Ajouter le jour pour les dates plus anciennes
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ', ' + timeStr;
    }
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatDetailedDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance en km

    return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
};