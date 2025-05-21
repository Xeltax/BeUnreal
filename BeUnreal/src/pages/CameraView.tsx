import React, { useEffect, useRef, useState } from 'react';
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
    IonModal,
    IonPage,
    IonRow,
    IonToolbar,
    IonLoading,
} from '@ionic/react';
import { aperture, cameraReverse, close, flash, images, videocam } from 'ionicons/icons';
import { Camera, CameraDirection, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useHistory } from 'react-router';
import {AuthService} from "../services/auth";

const CameraView: React.FC = () => {
    const history = useHistory();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
    const [timer, setTimer] = useState<number>(0);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showPrivacyAlert, setShowPrivacyAlert] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isVideoMode, setIsVideoMode] = useState(false);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        startCamera().finally();
        getCurrentPosition().finally();

        return () => {
            stopCamera();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isFrontCamera]);

    const startCamera = async () => {
        try {
            if (!Capacitor.isNativePlatform()) {
                const constraints = {
                    video: {
                        facingMode: isFrontCamera ? 'user' : 'environment',
                    },
                    audio: true,
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
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
    };

    const switchCamera = () => {
        setIsFrontCamera(!isFrontCamera);
        stopCamera();
        startCamera().finally();
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
        if (isVideoMode) {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        } else {
            if (timer > 0) {
                setLoading(true);
                timerRef.current = setTimeout(async () => {
                    await capturePhoto();
                    setLoading(false);
                }, timer * 1000);
            } else {
                await capturePhoto();
            }
        }
    };

    const capturePhoto = async () => {
        try {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                context?.drawImage(video, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL('image/jpeg');

                const newPhoto: Photo = {
                    dataUrl,
                    format: 'jpeg',
                    saved: false,
                    path: '',
                    webPath: dataUrl,
                };

                setPhoto(newPhoto);
                setShowPhotoModal(true);
                stopCamera();

                if (position) {
                    console.log('Photo prise avec position:', position);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la prise de photo:', error);
            setErrorMessage('Erreur lors de la prise de photo. Veuillez réessayer.');
        }
    };

    const startRecording = () => {
        const stream = mediaStreamRef.current;
        if (!stream) return;

        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedVideoUrl(url);
            setShowPhotoModal(true);
            stopCamera();
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const discardCapture = () => {
        setPhoto(null);
        if (recordedVideoUrl) {
            URL.revokeObjectURL(recordedVideoUrl);
            setRecordedVideoUrl(null);
        }
        setShowPhotoModal(false);
        startCamera();
    };

    const validatePhoto = () => {
        setShowPrivacyAlert(true);
    };

    const handlePrivacyChoice = async (choice: string) => {
        try {
            const coordinates = await Geolocation.getCurrentPosition();
            const latitude = coordinates.coords.latitude;
            const longitude = coordinates.coords.longitude;

            let fileBlob: Blob | null = null;
            let fileName = '';

            if (!isVideoMode && photo) {
                // Photo : transformer dataUrl en Blob
                const res = await fetch(photo.dataUrl || photo.webPath || '');
                fileBlob = await res.blob();
                fileName = `photo_${Date.now()}.jpeg`;
            } else if (isVideoMode) {
                // Vidéo : concaténer les chunks enregistrés en un blob
                if (recordedChunksRef.current.length === 0) {
                    throw new Error('Aucune vidéo enregistrée');
                }
                fileBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' }); // ou 'video/mp4' selon codec
                fileName = `video_${Date.now()}.webm`; // adapte extension si besoin
            }

            if (!fileBlob) {
                throw new Error('Aucun fichier média disponible pour l\'upload');
            }

            const formData = new FormData();
            formData.append('file', fileBlob, fileName);
            formData.append('latitude', latitude.toString());
            formData.append('longitude', longitude.toString());

            const response = await fetch('http://localhost:3002/api/media/story', {
                method: 'POST',
                body: formData,
                headers: {
                    authorization: 'Bearer ' + AuthService.getToken()!
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur serveur: ${response.status}`);
            }

            const result = await response.json();
            console.log('Upload réussi:', result);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde du média:', error);
        } finally {
            setShowPrivacyAlert(false);
            discardCapture();
            // Réinitialiser le buffer vidéo pour le prochain enregistrement
            recordedChunksRef.current = [];
            setRecordedVideoUrl(null);
            setPhoto(null);
        }
    };

    const selectFromGallery = async () => {
        try {
            const selectedPhoto = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos,
            });

            setPhoto(selectedPhoto);
            setShowPhotoModal(true);
        } catch (error) {
            console.error('Erreur lors de la sélection depuis la galerie:', error);
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen>
                {!photo && !recordedVideoUrl && (
                    <div style={{ position: 'relative', height: '100%' }}>
                        <video
                            ref={videoRef}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            autoPlay
                            playsInline
                            muted
                        />

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

                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}>
                            <IonButton fill="clear" onClick={() => setIsVideoMode(!isVideoMode)}>
                                {isVideoMode ? 'Vidéo' : 'Photo'}
                            </IonButton>

                            <IonGrid>
                                <IonRow className="ion-align-items-center">
                                    <IonCol size="3" className="ion-text-center">
                                        <IonButton fill="clear" onClick={selectFromGallery}>
                                            <IonIcon icon={images} color="light" size="large" />
                                        </IonButton>
                                    </IonCol>
                                    <IonCol size="6" className="ion-text-center">
                                        <IonFabButton onClick={takePicture} color={isRecording ? 'danger' : 'primary'}>
                                            <IonIcon icon={isVideoMode ? videocam : aperture} />
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
                )}

                <IonModal isOpen={showPhotoModal}>
                    <IonContent>
                        <div style={{ height: '100%', position: 'relative' }}>
                            {photo && (
                                <img
                                    src={photo.dataUrl}
                                    alt="Prévisualisation"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                            {recordedVideoUrl && (
                                <video
                                    src={recordedVideoUrl}
                                    controls
                                    autoPlay
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                            <div style={{
                                position: 'absolute',
                                bottom: 20,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-around',
                            }}>
                                <IonButton color="medium" onClick={discardCapture}>
                                    Annuler
                                </IonButton>
                                <IonButton color="primary" onClick={validatePhoto}>
                                    Valider
                                </IonButton>
                            </div>
                        </div>
                    </IonContent>
                </IonModal>

                <IonAlert
                    isOpen={showPrivacyAlert}
                    header="Enregistrement"
                    message="Souhaitez-vous enregistrer ce contenu comme public ou privé ?"
                    buttons={[
                        {
                            text: 'Privé',
                            handler: () => handlePrivacyChoice('privé'),
                        },
                        {
                            text: 'Public',
                            handler: () => handlePrivacyChoice('public'),
                        },
                    ]}
                    onDidDismiss={() => setShowPrivacyAlert(false)}
                />

                <IonActionSheet
                    isOpen={showActionSheet}
                    onDidDismiss={() => setShowActionSheet(false)}
                    header="Minuterie"
                    buttons={[
                        { text: 'Aucune', handler: () => setTimer(0) },
                        { text: '3 secondes', handler: () => setTimer(3) },
                        { text: '5 secondes', handler: () => setTimer(5) },
                        { text: '10 secondes', handler: () => setTimer(10) },
                        { text: 'Annuler', role: 'cancel' },
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
                    message={errorMessage ?? ''}
                    buttons={['OK']}
                />
            </IonContent>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </IonPage>
    );
};

export default CameraView;