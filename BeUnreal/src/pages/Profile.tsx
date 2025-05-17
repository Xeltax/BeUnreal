import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonLoading,
    IonText,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonIcon,
    IonAlert,
    IonBackButton,
    IonButtons,
    IonRouterLink,
} from '@ionic/react';
import { camera, logOutOutline, trash, pencil } from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, deleteUserAccount } from '../services/auth';
import { useHistory } from 'react-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const Profile: React.FC = () => {
    const history = useHistory();
    const { user, isAuthenticated, loading: authLoading, loadUser, logout } = useAuth();

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profilePicture, setProfilePicture] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBio(user.bio || '');
            setProfilePicture(user.profilePicture || '');
        }
    }, [user]);

    useEffect(() => {
        if (!isAuthenticated && !authLoading) {
            history.replace('/login');
        }
    }, [isAuthenticated, authLoading, history]);

    const handleLogout = () => {
        logout();
        history.replace('/login');
    };

    const handleDeleteAccount = async () => {
        try {
            setLoading(true);
            await deleteUserAccount();
            logout();
            history.replace('/register');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression du compte');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            await updateUserProfile({
                username,
                bio,
                profilePicture,
            });

            loadUser();
            setEditing(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    const handleTakePicture = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Prompt,
            });

            if (image.dataUrl) {
                setProfilePicture(image.dataUrl);
            }
        } catch (error) {
            console.error('Erreur lors de la prise de photo:', error);
        }
    };

    if (authLoading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center">
                    <IonLoading isOpen={true} message="Chargement du profil..." />
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {editing && (
                        <IonButtons slot="start">
                            <IonButton onClick={() => setEditing(false)}>Annuler</IonButton>
                        </IonButtons>
                    )}
                    <IonTitle>{editing ? 'Modifier le profil' : 'Mon profil'}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>
                            <IonIcon icon={logOutOutline} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                {error && (
                    <IonText color="danger">
                        <p>{error}</p>
                    </IonText>
                )}

                <div className="ion-text-center ion-padding">
                    <IonAvatar style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                        <img
                            src={profilePicture || 'https://ionicframework.com/docs/img/demos/avatar.svg'}
                            alt="Profile"
                        />
                    </IonAvatar>

                    {editing && (
                        <IonButton
                            fill="clear"
                            size="small"
                            onClick={handleTakePicture}
                            style={{ marginTop: '10px' }}
                        >
                            <IonIcon icon={camera} slot="start" />
                            Changer la photo
                        </IonButton>
                    )}

                    {!editing && (
                        <h2 className="ion-padding-top">{user?.username}</h2>
                    )}
                </div>

                <IonCard>
                    <IonCardContent>
                        {editing ? (
                            // Formulaire d'édition
                            <>
                                <IonItem>
                                    <IonLabel position="floating">Nom d'utilisateur</IonLabel>
                                    <IonInput
                                        value={username}
                                        onIonChange={(e) => setUsername(e.detail.value!)}
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="floating">Bio</IonLabel>
                                    <IonTextarea
                                        rows={4}
                                        value={bio}
                                        onIonChange={(e) => setBio(e.detail.value!)}
                                    />
                                </IonItem>

                                <div className="ion-padding-top">
                                    <IonButton expand="block" onClick={handleUpdateProfile}>
                                        Enregistrer les modifications
                                    </IonButton>
                                </div>
                            </>
                        ) : (
                            // Affichage du profil
                            <>
                                <IonItem lines="none">
                                    <IonLabel>
                                        <h3>Email</h3>
                                        <p>{user?.email}</p>
                                    </IonLabel>
                                </IonItem>

                                <IonItem lines="none">
                                    <IonLabel>
                                        <h3>Bio</h3>
                                        <p>{user?.bio || 'Aucune bio définie'}</p>
                                    </IonLabel>
                                </IonItem>

                                <div className="ion-padding-top">
                                    <IonButton expand="block" onClick={() => setEditing(true)}>
                                        <IonIcon icon={pencil} slot="start" />
                                        Modifier le profil
                                    </IonButton>

                                    <IonButton
                                        expand="block"
                                        color="danger"
                                        fill="outline"
                                        className="ion-margin-top"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <IonIcon icon={trash} slot="start" />
                                        Supprimer le compte
                                    </IonButton>
                                </div>
                            </>
                        )}
                    </IonCardContent>
                </IonCard>

                <div className="ion-padding ion-text-center">
                    <IonRouterLink routerLink="/user-search">
                        Rechercher des amis
                    </IonRouterLink>
                    {' | '}
                    <IonRouterLink routerLink="/nearby-users">
                        Personnes à proximité
                    </IonRouterLink>
                </div>

                <IonLoading isOpen={loading} message="Chargement en cours..." />

                <IonAlert
                    isOpen={showDeleteConfirm}
                    header="Confirmation"
                    message="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
                    buttons={[
                        {
                            text: 'Annuler',
                            role: 'cancel',
                            handler: () => setShowDeleteConfirm(false),
                        },
                        {
                            text: 'Supprimer',
                            role: 'destructive',
                            handler: handleDeleteAccount,
                        },
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default Profile;