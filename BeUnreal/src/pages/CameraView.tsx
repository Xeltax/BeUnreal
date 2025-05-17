import React, {useEffect, useRef, useState} from 'react';
import {
    IonActionSheet,
    IonAlert,
    IonButton,
    IonButtons,
    IonCol,
    IonContent,
    IonFabButton,
    IonGrid,
    IonIcon,
    IonLoading,
    IonPage,
    IonRow,
    IonToolbar,
} from '@ionic/react';
import {aperture, cameraReverse, close, flash, images} from 'ionicons/icons';
import {Camera, CameraDirection, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import {useHistory} from 'react-router';

const CameraView: React.FC = () => {
    const history = useHistory();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [videoSource, setVideoSource] = useState<string | null>(null);
    const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
    const [timer, setTimer] = useState<number>(0);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isFrontCamera, setIsFrontCamera] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        startCamera();
        getCurrentPosition();

        return () => {
            stopCamera();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            if (!Capacitor.isNativePlatform()) {
                // Utilisation de l'API MediaDevices pour le web
                const constraints = {
                    video: {
                        facingMode: isFrontCamera ? 'user' : 'environment',
                    },
                    audio: false,
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                mediaStreamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }
        } catch (error) {
            console.error('Erreur lors du démarrage de la caméra:', error);
            setErrorMessage('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
        }
    };

    const stopCamera = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            mediaStreamRef.current = null;
        }
    };

    const switchCamera = () => {
        setIsFrontCamera(!isFrontCamera);
        stopCamera();
        startCamera();
    };

    const getCurrentPosition = async () => {
        try {
            const coordinates = await Geolocation.getCurrentPosition();
            setPosition({
                latitude: coordinates.coords.latitude,
                longitude: coordinates.coords.longitude,
            });
        } catch (error) {
            console.error('Erreur lors de la récupération de la position:', error);
        }
    };

    const takePicture = async () => {
        if (timer > 0) {
            setLoading(true);

            timerRef.current = setTimeout(async () => {
                await capturePhoto();
                setLoading(false);
            }, timer * 1000);
        } else {
            await capturePhoto();
        }
    };

    const capturePhoto = async () => {
        try {
            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
                direction: isFrontCamera ? CameraDirection.Front : CameraDirection.Rear,
            });

            setPhoto(photo);
            stopCamera(); // Arrêter la caméra une fois la photo prise

            // Si on a une position, on peut l'associer à la photo
            if (position) {
                console.log('Photo prise avec la position:', position);
                // Vous pouvez stocker ces informations ou les envoyer à votre API
            }
        } catch (error) {
            console.error('Erreur lors de la prise de photo:', error);
            setErrorMessage('Erreur lors de la prise de photo. Veuillez réessayer.');
        }
    };

    const startRecordingVideo = async () => {
        // Cette fonction nécessite un plugin supplémentaire
        // Comme l'application est centrée sur les photos et les vidéos courtes (10s max)
        alert('Fonctionnalité d\'enregistrement vidéo en cours d\'implémentation');
    };

    const discardCapture = () => {
        setPhoto(null);
        setVideoSource(null);
        startCamera();
    };

    const saveCapture = async () => {
        // Ici, vous pouvez implémenter la logique pour sauvegarder et partager la photo/vidéo
        // Par exemple, envoyer à vos amis, ou publier comme "story"
        alert('Photo/vidéo sauvegardée! Fonctionnalité de partage à implémenter.');

        // Retour à la caméra pour une nouvelle prise
        discardCapture();
    };

    const selectFromGallery = async () => {
        try {
            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos,
            });

            setPhoto(photo);
        } catch (error) {
            console.error('Erreur lors de la sélection depuis la galerie:', error);
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen>
                {/* Vue de la caméra en direct */}
                {!photo && !videoSource && (
                    <>
                        <div style={{ position: 'relative', height: '100%' }}>
                            <video
                                ref={videoRef}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                autoPlay
                                playsInline
                            />

                            {/* Boutons supérieurs */}
                            <IonToolbar color="clear" style={{ position: 'absolute', top: 0, width: '100%' }}>
                                <IonButtons slot="start">
                                    <IonButton onClick={() => history.goBack()}>
                                        <IonIcon icon={close} color="light" />
                                    </IonButton>
                                </IonButtons>
                                <IonButtons slot="end">
                                    <IonButton onClick={() => setFlashMode(flashMode === 'on' ? 'off' : 'on')}>
                                        <IonIcon icon={flash} color={flashMode === 'on' ? 'warning' : 'light'} />
                                    </IonButton>
                                    <IonButton onClick={() => setShowActionSheet(true)}>
                                        <IonIcon title={timer.toString()} color="light" />
                                    </IonButton>
                                </IonButtons>
                            </IonToolbar>

                            {/* Boutons inférieurs */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <IonGrid>
                                    <IonRow className="ion-align-items-center">
                                        <IonCol size="3" className="ion-text-center">
                                            <IonButton fill="clear" onClick={selectFromGallery}>
                                                <IonIcon icon={images} color="light" size="large" />
                                            </IonButton>
                                        </IonCol>
                                        <IonCol size="6" className="ion-text-center">
                                            <IonFabButton onClick={takePicture}>
                                                <IonIcon icon={aperture} />
                                            </IonFabButton>
                                        </IonCol>
                                        <IonCol size="3" className="ion-text-center">
                                            <IonButton fill="clear" onClick={switchCamera}>
                                                <IonIcon icon={cameraReverse} color="light" size="large" />
                                            </IonButton>
                                        </IonCol>
                                    </IonRow>
                                </IonGrid>
                            </div>
                        </div>
                    </>
                )}

                {/* Affichage de la photo prise */}
                {photo && (
                    <div style={{ position: 'relative', height: '100%' }}>
                        <img
                            src={photo.dataUrl}
                            alt="Capture"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        <IonToolbar color="clear" style={{ position: 'absolute', top: 0, width: '100%' }}>
                            <IonButtons slot="start">
                                <IonButton onClick={discardCapture}>
                                    <IonIcon icon={close} color="light" />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>

                        <div
                            style={{
                                position: 'absolute',
                                bottom: '20px',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                        >
                            <IonButton expand="block" onClick={saveCapture}>
                                Partager
                            </IonButton>
                        </div>
                    </div>
                )}

                {/* Lecture de la vidéo enregistrée */}
                {videoSource && (
                    <div style={{ position: 'relative', height: '100%' }}>
                        <video
                            src={videoSource}
                            controls
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        <IonToolbar color="clear" style={{ position: 'absolute', top: 0, width: '100%' }}>
                            <IonButtons slot="start">
                                <IonButton onClick={discardCapture}>
                                    <IonIcon icon={close} color="light" />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>

                        <div
                            style={{
                                position: 'absolute',
                                bottom: '20px',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                        >
                            <IonButton expand="block" onClick={saveCapture}>
                                Partager
                            </IonButton>
                        </div>
                    </div>
                )}

                {/* Sélecteur de minuterie */}
                <IonActionSheet
                    isOpen={showActionSheet}
                    onDidDismiss={() => setShowActionSheet(false)}
                    header="Minuterie"
                    buttons={[
                        {
                            text: 'Aucune',
                            handler: () => setTimer(0),
                        },
                        {
                            text: '3 secondes',
                            handler: () => setTimer(3),
                        },
                        {
                            text: '5 secondes',
                            handler: () => setTimer(5),
                        },
                        {
                            text: '10 secondes',
                            handler: () => setTimer(10),
                        },
                        {
                            text: 'Annuler',
                            role: 'cancel',
                        },
                    ]}
                />

                <IonLoading
                    isOpen={loading}
                    message={`Compte à rebours: ${timer}...`}
                    duration={timer * 1000}
                />

                <IonAlert
                    isOpen={!!errorMessage}
                    onDidDismiss={() => setErrorMessage(null)}
                    header="Erreur"
                    message={errorMessage || ''}
                    buttons={['OK']}
                />
            </IonContent>
        </IonPage>
    );
};

export default CameraView;