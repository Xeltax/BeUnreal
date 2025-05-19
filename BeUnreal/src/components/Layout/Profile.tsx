import React, {useEffect, useState} from 'react';
import {
    IonAvatar,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonLoading,
    IonPage,
    IonRow,
    IonTextarea,
    IonTitle,
    IonToast,
    IonToolbar,
} from '@ionic/react';
import {cameraOutline, createOutline, logOutOutline, saveOutline} from 'ionicons/icons';
import {useAuth} from '../../contexts/AuthContext';
import {useHistory} from 'react-router';
import '../../styles/Profile.css';

const Profile: React.FC = () => {
    const { authState, updateProfile, logout } = useAuth();
    const history = useHistory();
    const user = authState.user;

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState('success');

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBio(user.bio || '');
        }
    }, [user]);

    if (!user) {
        return <IonLoading isOpen={true} message={'Chargement du profil...'} />;
    }

    const handleSaveProfile = async () => {
        setIsLoading(true);

        try {
            updateProfile({
                bio
            }).then((response) => {
                console.log("response", response);
                console.log("pass update profile");
                setToastColor('success');
                setToastMessage('Profil mis à jour avec succès');
                setShowToast(true);
                setIsLoading(false);
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            setToastColor('danger');
            setToastMessage('Erreur lors de la mise à jour du profil');
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
            history.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
            setToastColor('danger');
            setToastMessage('Erreur lors de la déconnexion');
            setShowToast(true);
            setIsLoading(false);
        }
    };

    const handleChangeProfilePicture = () => {
        // Implémentation à venir pour le changement de photo de profil
        setToastMessage('Fonctionnalité à venir');
        setToastColor('primary');
        setShowToast(true);
    };

    return (
        <IonPage>
            <IonContent>
                <div className="profile-container">
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Mon Profil</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={handleLogout}>
                                    <IonIcon slot="icon-only" icon={logOutOutline} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>

                    <IonContent className="profile-content">
                        <IonGrid>
                            <IonRow className="ion-justify-content-center">
                                <IonCol size="12" sizeMd="8" sizeLg="6">
                                    <div className="profile-header ion-text-center">
                                        <div className="avatar-container">
                                            <IonAvatar className="profile-avatar">
                                                <img
                                                    src={user.profilePicture || 'https://gravatar.com/avatar?d=mp'}
                                                    alt="Profile"
                                                />
                                            </IonAvatar>
                                            <IonButton
                                                fill="clear"
                                                className="avatar-edit-button"
                                                onClick={handleChangeProfilePicture}
                                            >
                                                <IonIcon icon={cameraOutline} />
                                            </IonButton>
                                        </div>
                                        <h2>{user.username}</h2>
                                        <p className="user-email">{user.email}</p>
                                        <p className="join-date">Membre depuis {new Date(user.createdAt || new Date()).toLocaleDateString()}</p>
                                    </div>

                                    <IonCard className="profile-card">
                                        <IonCardHeader>
                                            <IonCardTitle>
                                                <div className="card-title-container">
                                                    <span>Informations de profil</span>
                                                    <IonIcon icon={createOutline} />
                                                </div>
                                            </IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <IonItem className="ion-margin-bottom custom-item">
                                                <IonLabel position="stacked">Nom d'utilisateur</IonLabel>
                                                <IonInput
                                                    disabled={true}
                                                    value={username}
                                                    readonly
                                                    onIonChange={e => setUsername(e.detail.value || '')}
                                                    placeholder="Votre nom d'utilisateur"
                                                />
                                            </IonItem>

                                            <IonItem className="ion-margin-bottom custom-item">
                                                <IonLabel position="stacked">Email</IonLabel>
                                                <IonInput
                                                    disabled={true}
                                                    value={user.email}
                                                    readonly
                                                />
                                            </IonItem>

                                            <IonItem className="ion-margin-bottom custom-item">
                                                <IonLabel position="stacked">Bio</IonLabel>
                                                <IonTextarea
                                                    value={bio}
                                                    onIonChange={e => setBio(e.detail.value || '')}
                                                    rows={4}
                                                    placeholder="Parlez-nous de vous..."
                                                />
                                            </IonItem>

                                            <IonButton
                                                expand="block"
                                                onClick={handleSaveProfile}
                                                className="save-button"
                                            >
                                                <IonIcon slot="start" icon={saveOutline} />
                                                Enregistrer les modifications
                                            </IonButton>
                                        </IonCardContent>
                                    </IonCard>

                                    <IonCard className="profile-card">
                                        <IonCardHeader>
                                            <IonCardTitle>Statistiques</IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <IonGrid>
                                                <IonRow>
                                                    <IonCol size="4" className="stats-col">
                                                        <div className="stats-number">0</div>
                                                        <div className="stats-label">Posts</div>
                                                    </IonCol>
                                                    <IonCol size="4" className="stats-col">
                                                        <div className="stats-number">0</div>
                                                        <div className="stats-label">Followers</div>
                                                    </IonCol>
                                                    <IonCol size="4" className="stats-col">
                                                        <div className="stats-number">0</div>
                                                        <div className="stats-label">Following</div>
                                                    </IonCol>
                                                </IonRow>
                                            </IonGrid>
                                        </IonCardContent>
                                    </IonCard>
                                </IonCol>
                            </IonRow>
                        </IonGrid>

                        <IonLoading isOpen={isLoading} message={'Chargement...'} />
                        <IonToast
                            isOpen={showToast}
                            onDidDismiss={() => setShowToast(false)}
                            message={toastMessage}
                            duration={2000}
                            color={toastColor}
                        />
                    </IonContent>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Profile;