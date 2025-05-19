import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonSpinner,
    IonFab,
    IonFabButton,
} from '@ionic/react';
import {
    personAddOutline,
    peopleOutline,

    chatbubbleOutline,
    addOutline,
    notificationsOutline
} from 'ionicons/icons';
import '../../styles/FriendsList.css';

// Exemple de données
const friendsData = [
    {
        id: '1',
        name: 'Sophie Martin',
        online: true,
        message: 'Salut, ça va?',
        lastSeen: 'maintenant',
        hasNewMessage: true
    },
    {
        id: '2',
        name: 'Thomas Dubois',
        online: false,
        message: 'On se voit demain ?',
        lastSeen: 'il y a 15 min',
        hasNewMessage: false
    },
    {
        id: '3',
        name: 'Emma Lefebvre',
        online: true,
        message: 'J\'ai pris une super photo !',
        lastSeen: 'maintenant',
        hasNewMessage: true
    },
    {
        id: '4',
        name: 'Lucas Bernard',
        online: true,
        message: 'Merci pour hier !',
        lastSeen: 'maintenant',
        hasNewMessage: false
    },
    {
        id: '5',
        name: 'Chloé Petit',
        online: false,
        message: 'À plus tard',
        lastSeen: 'il y a 1h',
        hasNewMessage: false
    },
    {
        id: '6',
        name: 'Maxime Dubois',
        online: false,
        message: 'Tu as vu mon dernier post?',
        lastSeen: 'hier',
        hasNewMessage: false
    },
    {
        id: '7',
        name: 'Julie Moreau',
        online: false,
        message: 'Super soirée !',
        lastSeen: 'il y a 2h',
        hasNewMessage: false
    },
];

const FriendsList: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [segment, setSegment] = useState('all');
    const [isLoading, setIsLoading] = useState(false);

    const filteredFriends = friendsData.filter(friend => {
        const matchesSearch = friend.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesSegment = segment === 'all' ||
            (segment === 'online' && friend.online) ||
            (segment === 'messages' && friend.hasNewMessage);
        return matchesSearch && matchesSegment;
    });

    const handleRefresh = (event: CustomEvent) => {
        setIsLoading(true);

        // Simuler un chargement
        setTimeout(() => {
            setIsLoading(false);
            event.detail.complete();
        }, 1500);
    };

    return (
        <div className="friends-container">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Amis</IonTitle>
                    <IonButtons slot="end">
                        <IonButton>
                            <IonIcon icon={notificationsOutline} />
                            <IonBadge color="primary" className="notification-badge">2</IonBadge>
                        </IonButton>
                        <IonButton>
                            <IonIcon icon={personAddOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar
                        value={searchText}
                        onIonChange={e => setSearchText(e.detail.value || '')}
                        placeholder="Rechercher des amis"
                        animated
                        className="custom-searchbar"
                    />
                </IonToolbar>
                <IonToolbar>
                    {/*// @ts-ignore*/}
                    <IonSegment value={segment} onIonChange={e => setSegment(e.detail.value || 'all')}>
                        <IonSegmentButton value="all">
                            <IonIcon icon={peopleOutline} />
                            <IonLabel>Tous</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="online">
                            <div className="segment-dot online"></div>
                            <IonLabel>En ligne</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="messages">
                            <IonIcon icon={chatbubbleOutline} />
                            <IonLabel>Messages</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent className="friends-content">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                {isLoading ? (
                    <div className="skeleton-container">
                        {[...Array(5)].map((_, i) => (
                            <div className="skeleton-item" key={i}>
                                <div className="skeleton-avatar">
                                    <IonSkeletonText animated />
                                </div>
                                <div className="skeleton-text">
                                    <IonSkeletonText animated style={{ width: '60%' }} />
                                    <IonSkeletonText animated style={{ width: '80%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {filteredFriends.length > 0 ? (
                            <IonList className="friends-list">
                                {filteredFriends.map(friend => (
                                    <IonItem key={friend.id} className="friend-item" detail={false} button>
                                        <IonAvatar slot="start" className="friend-avatar">
                                            <div className={`status-indicator ${friend.online ? 'online' : 'offline'}`}></div>
                                            <img src={`https://i.pravatar.cc/150?u=${friend.id}`} alt={friend.name} />
                                        </IonAvatar>
                                        <IonLabel>
                                            <h2>{friend.name}</h2>
                                            <p className="message-preview">{friend.message}</p>
                                            <p className="time-preview">{friend.lastSeen}</p>
                                        </IonLabel>
                                        {friend.hasNewMessage && (
                                            <div className="message-indicator" slot="end"></div>
                                        )}
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : (
                            <div className="no-results">
                                <div className="no-results-icon">
                                    <IonIcon icon={peopleOutline} />
                                </div>
                                <h3>Aucun ami trouvé</h3>
                                <p>Essayez une autre recherche ou ajoutez de nouveaux amis</p>
                            </div>
                        )}
                    </>
                )}
            </IonContent>

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
                <IonFabButton color="primary">
                    <IonIcon icon={addOutline} />
                </IonFabButton>
            </IonFab>
        </div>
    );
};

// Composant IonButtons
const IonButtons: React.FC<{
    slot?: string;
    children: React.ReactNode;
}> = ({ slot, children }) => {
    return (
        <div className={`ion-buttons ${slot ? `ion-buttons-${slot}` : ''}`}>
            {children}
        </div>
    );
};

export default FriendsList;