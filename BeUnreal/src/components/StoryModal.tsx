import React from 'react';
import {
    IonModal,
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
} from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';

interface Story {
    id: string;
    videoUrl?: string;
    photoUrl?: string;
    username: string;
    city: string;
}

interface StoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    stories: Story[];
}

const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, stories }) => {
    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={1}>
            <IonHeader translucent>
                <IonToolbar style={{ marginTop: 25 }}>
                    <IonTitle>Stories ({stories.length})</IonTitle>
                    <IonButton slot="end" onClick={onClose}>Fermer</IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <Swiper
                    pagination={{ clickable: true }}
                    modules={[Pagination]}
                    style={{ height: '100%' }}
                >
                    {stories.map((story) => (
                        <SwiperSlide key={story.id}>
                            <div style={{ padding: '1rem', textAlign: 'center' }}>
                                {story.videoUrl ? (
                                    <video
                                        src={story.videoUrl}
                                        controls
                                        autoPlay
                                        muted
                                        style={{ width: '100%', maxHeight: '70vh', borderRadius: 8 }}
                                    />
                                ) : story.photoUrl ? (
                                    <img
                                        src={story.photoUrl}
                                        alt="Story"
                                        style={{ width: '100%', maxHeight: '70vh', borderRadius: 8 }}
                                    />
                                ) : (
                                    <p>Pas de contenu</p>
                                )}
                                <div style={{ marginTop: '1rem' }}>
                                    <strong>@{story.username}</strong> – {story.city}
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </IonContent>
        </IonModal>
    );
};

export default StoryModal;