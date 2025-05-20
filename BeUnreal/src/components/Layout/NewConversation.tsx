import React, { useState, useEffect } from 'react';
import {
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonCheckbox,
    IonAvatar,
    IonButtons,
    IonBackButton,
    IonLoading,
    IonToast,
    IonToggle,
    IonSegment,
    IonSegmentButton
} from '@ionic/react';
import FriendService from '../../services/friend';
import ChatService, { Friend } from '../../services/chat';
import { getProfilePicture, formatUsername } from '../../utils/userUtils';
import '../../styles/NewConversation.css';

interface NewConversationProps {
    onBack: () => void;
    onConversationCreated: (conversationId: number, name?: string) => void;
}

const NewConversation: React.FC<NewConversationProps> = ({ onBack, onConversationCreated }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
    const [isGroup, setIsGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [searchText, setSearchText] = useState('');
    const [tab, setTab] = useState<'recent' | 'all'>('recent');

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        try {
            setIsLoading(true);
            const friendsList = await FriendService.getFriends();
            setFriends(friendsList);
        } catch (error) {
            console.error('Erreur lors du chargement des amis:', error);
            showToastMessage('Erreur lors du chargement des amis');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFriend = (friendId: number) => {
        setSelectedFriends(prevSelected => {
            if (prevSelected.includes(friendId)) {
                return prevSelected.filter(id => id !== friendId);
            } else {
                return [...prevSelected, friendId];
            }
        });
    };

    const handleCreateConversation = async () => {
        if (selectedFriends.length === 0) {
            showToastMessage('Veuillez sélectionner au moins un ami');
            return;
        }

        if (isGroup && !groupName.trim()) {
            showToastMessage('Veuillez entrer un nom pour le groupe');
            return;
        }

        setIsLoading(true);
        try {
            if (isGroup) {
                // Créer une conversation de groupe
                const conversation = await ChatService.createGroupConversation(
                    groupName.trim(),
                    selectedFriends
                );
                onConversationCreated(conversation.id, groupName.trim());
            } else if (selectedFriends.length === 1) {
                // Créer/récupérer une conversation individuelle
                const conversation = await ChatService.createOrGetConversation(selectedFriends[0]);

                // Trouver le nom de l'ami
                const friend = friends.find(f => f.id === selectedFriends[0]);
                const name = friend ? formatUsername(friend.username) : undefined;

                onConversationCreated(conversation.id, name);
            } else {
                showToastMessage('Pour une conversation normale, veuillez sélectionner un seul ami');
                setIsLoading(false);
                return;
            }
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
            showToastMessage('Erreur lors de la création de la conversation');
            setIsLoading(false);
        }
    };

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const filteredFriends = friends.filter(friend => {
        const matchesSearch = searchText
            ? friend.username.toLowerCase().includes(searchText.toLowerCase())
            : true;
        return matchesSearch;
    });

    // Récents vs. Tous (pour l'instant, juste tous les amis)
    const displayedFriends = tab === 'recent'
        ? filteredFriends.slice(0, Math.min(10, filteredFriends.length))
        : filteredFriends;

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="#" />
                    </IonButtons>
                    <IonTitle>Nouvelle conversation</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={handleCreateConversation}
                            disabled={selectedFriends.length === 0 || (isGroup && !groupName.trim())}
                        >
                            Créer
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <div className="conversation-settings">
                    <div className="toggle-container">
                        <IonLabel>Conversation de groupe</IonLabel>
                        <IonToggle checked={isGroup} onIonChange={e => setIsGroup(e.detail.checked)} />
                    </div>

                    {isGroup && (
                        <IonItem>
                            <IonLabel position="stacked">Nom du groupe</IonLabel>
                            <IonInput
                                value={groupName}
                                onIonChange={e => setGroupName(e.detail.value || '')}
                                placeholder="Ex: Amis du lycée"
                            />
                        </IonItem>
                    )}

                    <IonItem>
                        <IonInput
                            value={searchText}
                            onIonChange={e => setSearchText(e.detail.value || '')}
                            placeholder="Rechercher des amis"
                            clearInput
                        />
                    </IonItem>

                    <IonSegment value={tab} onIonChange={e => setTab(e.detail.value as 'recent' | 'all')}>
                        <IonSegmentButton value="recent">
                            <IonLabel>Récents</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="all">
                            <IonLabel>Tous</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </div>

                {isLoading ? (
                    <div className="loading-message">Chargement des amis...</div>
                ) : (
                    <>
                        {displayedFriends.length > 0 ? (
                            <IonList>
                                {displayedFriends.map(friend => (
                                    <IonItem key={friend.id} className="friend-selection-item">
                                        <IonCheckbox
                                            slot="start"
                                            checked={selectedFriends.includes(friend.id)}
                                            onIonChange={() => handleToggleFriend(friend.id)}
                                        />
                                        <IonAvatar slot="start">
                                            <img src={getProfilePicture(friend)} alt={`Avatar de ${friend.username}`} />
                                        </IonAvatar>
                                        <IonLabel>
                                            <h2>{formatUsername(friend.username)}</h2>
                                            <p>@{friend.username}</p>
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : (
                            <div className="no-friends-message">
                                {searchText ?
                                    `Aucun ami trouvé pour "${searchText}"` :
                                    "Vous n'avez pas encore d'amis"
                                }
                            </div>
                        )}
                    </>
                )}

                <IonLoading isOpen={isLoading} message="Chargement..." />

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={2000}
                    position="bottom"
                />
            </IonContent>
        </>
    );
};

export default NewConversation;