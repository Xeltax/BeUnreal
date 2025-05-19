import React, {useState} from 'react';
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonChip,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonLabel,
    IonPage,
    IonRefresher,
    IonRefresherContent,
    IonRow,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import {chatbubbleOutline, flameOutline, heartOutline, peopleOutline, timeOutline} from 'ionicons/icons';
import '../../styles/DiscoverView.css';

const trendingPosts = [
    {
        id: '1',
        username: 'laura_paris',
        avatar: 'https://i.pravatar.cc/150?u=laura',
        image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab',
        likes: 258,
        comments: 42,
        caption: 'Tour Eiffel par une belle journée d\'été ☀️',
        tags: ['Paris', 'Voyage']
    },
    {
        id: '2',
        username: 'max_photo',
        avatar: 'https://i.pravatar.cc/150?u=max',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        likes: 124,
        comments: 18,
        caption: 'Dîner parfait 🍽️',
        tags: ['Food', 'Cuisine']
    },
    {
        id: '3',
        username: 'julie_adventure',
        avatar: 'https://i.pravatar.cc/150?u=julie',
        image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606',
        likes: 315,
        comments: 56,
        caption: 'Randonnée matinale dans les montagnes 🏔️',
        tags: ['Nature', 'Aventure']
    },
    {
        id: '4',
        username: 'thomas_art',
        avatar: 'https://i.pravatar.cc/150?u=thomas',
        image: 'https://images.unsplash.com/photo-1501472312651-726afe119ff1',
        likes: 187,
        comments: 24,
        caption: 'Street art découvert ce matin 🎨',
        tags: ['Art', 'Urbain']
    },
];

const DiscoverView: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [segment, setSegment] = useState('trending');

    const handleRefresh = (event: CustomEvent) => {
        setTimeout(() => {
            console.log('Refresh completed');
            event.detail.complete();
        }, 1500);
    };

    return (
        <IonPage>
            <IonContent>
                <div className="discover-container">
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Découvrir</IonTitle>
                        </IonToolbar>
                        <IonToolbar>
                            <IonSearchbar
                                value={searchText}
                                onIonChange={e => setSearchText(e.detail.value || '')}
                                placeholder="Rechercher du contenu"
                            />
                        </IonToolbar>
                        <IonToolbar>
                            {/*// @ts-ignore*/}
                            <IonSegment value={segment} onIonChange={e => setSegment(e.detail.value || 'trending')}>
                                <IonSegmentButton value="trending">
                                    <IonIcon icon={flameOutline} />
                                    <IonLabel>Tendances</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="recent">
                                    <IonIcon icon={timeOutline} />
                                    <IonLabel>Récent</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="following">
                                    <IonIcon icon={peopleOutline} />
                                    <IonLabel>Suivis</IonLabel>
                                </IonSegmentButton>
                            </IonSegment>
                        </IonToolbar>
                    </IonHeader>

                    <IonContent className="discover-content">
                        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                            <IonRefresherContent></IonRefresherContent>
                        </IonRefresher>

                        <IonGrid>
                            <IonRow>
                                {trendingPosts.map(post => (
                                    <IonCol size="12" key={post.id}>
                                        <IonCard className="post-card">
                                            <div className="post-header">
                                                <div className="user-info">
                                                    <img src={post.avatar} alt={post.username} className="user-avatar" />
                                                    <div className="username">{post.username}</div>
                                                </div>
                                            </div>

                                            <div className="post-image-container">
                                                <img src={post.image} alt="" className="post-image" />
                                            </div>

                                            <IonCardContent>
                                                <div className="post-actions">
                                                    <IonButton fill="clear" className="action-button">
                                                        <IonIcon slot="icon-only" icon={heartOutline} />
                                                    </IonButton>
                                                    <span>{post.likes}</span>

                                                    <IonButton fill="clear" className="action-button">
                                                        <IonIcon slot="icon-only" icon={chatbubbleOutline} />
                                                    </IonButton>
                                                    <span>{post.comments}</span>
                                                </div>

                                                <div className="post-caption">
                                                    <strong>{post.username}</strong> {post.caption}
                                                </div>

                                                <div className="post-tags">
                                                    {post.tags.map(tag => (
                                                        <IonChip key={tag} outline color="primary">
                                                            <IonLabel>#{tag}</IonLabel>
                                                        </IonChip>
                                                    ))}
                                                </div>
                                            </IonCardContent>
                                        </IonCard>
                                    </IonCol>
                                ))}
                            </IonRow>
                        </IonGrid>
                    </IonContent>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default DiscoverView;
