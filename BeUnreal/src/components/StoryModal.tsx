import React, { useEffect, useRef, useState } from 'react';
import {
    IonModal,
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
} from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Navigation } from 'swiper/modules';
import {
    chevronBackOutline,
    chevronForwardOutline,
    closeOutline,
} from 'ionicons/icons';
import {AuthService} from "../services/auth";
import {Story} from '../pages/MapView'

interface ResolvedStory {
    id: number;
    signedUrl: string;
    type: 'image' | 'video';
    username: string;
    city?: string;
}

interface StoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    stories: Story[];
}

const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, stories }) => {
    const swiperRef = useRef<any>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [resolvedStories, setResolvedStories] = useState<ResolvedStory[]>([]);

    useEffect(() => {
        const fetchMediaUrls = async () => {
            const validStories: ResolvedStory[] = [];

            await Promise.all(
                stories.map(async (story) => {
                    try {
                        const res = await fetch(`http://localhost:3002/api/media/${story.mediaUrl}`, {
                            headers: {
                                authorization: 'Bearer ' + AuthService.getToken()!
                            }
                        });
                        if (!res.ok) return;

                        const data = await res.json();
                        const ext = story.mediaUrl.split('.').pop()?.toLowerCase();

                        if (!data?.url || !ext) return;

                        validStories.push({
                            id: story.id,
                            signedUrl: data.url,
                            type: ext === 'mp4' ? 'video' : 'image',
                            username: story.user?.username!,
                            city: story.city,
                        });
                    } catch (err) {
                        console.error(`Erreur lors du fetch du média ${story.mediaUrl}`, err);
                    }
                })
            );

            setResolvedStories(validStories);
        };

        if (isOpen) {
            setActiveIndex(0); // reset index
            fetchMediaUrls().finally();
        }
    }, [isOpen, stories]);

    const goNext = () => {
        const swiper = swiperRef.current?.swiper;
        if (!swiper) return;
        swiper.isEnd ? swiper.slideTo(0) : swiper.slideNext();
    };

    const goPrev = () => {
        const swiper = swiperRef.current?.swiper;
        if (!swiper) return;
        swiper.isBeginning ? swiper.slideTo(resolvedStories.length - 1) : swiper.slidePrev();
    };

    const isMobile = window.innerWidth <= 768;

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={1}>
            <IonHeader translucent style={{ marginTop: isMobile ? 25 : 0 }}>
                <IonToolbar>
                    <div style={{ width: 40 }}></div>
                    <IonTitle style={{ textAlign: 'center', fontWeight: '600', fontSize: '1.1rem' }}>
                        {resolvedStories.length > 0 ? `${activeIndex + 1} / ${resolvedStories.length}` : 'Chargement...'}
                    </IonTitle>
                    <IonButton slot="end" fill="clear" onClick={onClose} style={{ padding: '0 12px' }}>
                        <IonIcon icon={closeOutline} size="large" />
                    </IonButton>
                </IonToolbar>
            </IonHeader>

            <IonContent scrollY={false} fullscreen>
                <div
                    style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem',
                        boxSizing: 'border-box',
                    }}
                >
                    <Swiper
                        pagination={{ clickable: true }}
                        modules={[Navigation]}
                        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                        ref={swiperRef}
                        style={{ width: '100%', height: '70vh', maxHeight: '70vh' }}
                    >
                        {resolvedStories.map((story) => (
                            <SwiperSlide key={story.id}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '100%',
                                        width: '100%',
                                    }}
                                >
                                    {story.type === 'video' ? (
                                        <video
                                            src={story.signedUrl}
                                            controls
                                            autoPlay
                                            muted
                                            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }}
                                        />
                                    ) : (
                                        <img
                                            src={story.signedUrl}
                                            alt="Story"
                                            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }}
                                        />
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Progress bar */}
                    <div
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: 4,
                            background: '#ccc',
                            zIndex: 100,
                        }}
                    >
                        <div
                            style={{
                                width: `${((activeIndex + 1) / resolvedStories.length) * 100}%`,
                                background: '#3880ff',
                                height: '100%',
                                transition: 'width 300ms ease-in-out',
                            }}
                        />
                    </div>

                    {/* Navigation arrows */}
                    <button
                        onClick={goPrev}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '0.5rem',
                            marginLeft: '0.5rem',
                            zIndex: 10,
                            color: 'white',
                        }}
                    >
                        <IonIcon icon={chevronBackOutline} />
                    </button>

                    <button
                        onClick={goNext}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: 0,
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '0.5rem',
                            marginRight: '0.5rem',
                            zIndex: 10,
                            color: 'white',
                        }}
                    >
                        <IonIcon icon={chevronForwardOutline} />
                    </button>
                </div>
            </IonContent>
        </IonModal>
    );
};

export default StoryModal;