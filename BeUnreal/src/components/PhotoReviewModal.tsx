import React from 'react';
import {
    IonButton,
    IonButtons,
    IonHeader,
    IonIcon,
    IonImg,
    IonModal,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { close } from 'ionicons/icons';

interface Props {
    isOpen: boolean;
    photoUrl: string;
    onCancel: () => void;
    onConfirm: () => void;
}

const PhotoReviewModal: React.FC<Props> = ({ isOpen, photoUrl, onCancel, onConfirm }) => {
    return (
        <IonModal isOpen={isOpen} backdropDismiss={false}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Aperçu</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onCancel}>
                            <IonIcon icon={close} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonImg src={photoUrl} style={{ height: '100%', objectFit: 'cover' }} />

            <div style={{ padding: 16 }}>
                <IonButton expand="block" color="primary" onClick={onConfirm}>
                    Valider
                </IonButton>
                <IonButton expand="block" color="medium" onClick={onCancel}>
                    Annuler
                </IonButton>
            </div>
        </IonModal>
    );
};

export default PhotoReviewModal;