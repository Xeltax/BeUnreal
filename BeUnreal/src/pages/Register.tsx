import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonInput,
    IonButton,
    IonItem,
    IonLabel,
    IonText,
    IonLoading,
    IonIcon,
    IonRow,
    IonCol,
    IonGrid,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
} from '@ionic/react';
import { personAddOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router';
import '../styles/Register.css';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const { authState, register } = useAuth();
    const history = useHistory();

    useEffect(() => {
        if (authState.isAuthenticated) {
            history.replace('/tabs/camera');
        }
    }, [authState.isAuthenticated, history]);

    const validatePassword = () => {
        if (password !== confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas');
            return false;
        }
        if (password.length < 6) {
            setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !email || !password || !confirmPassword) return;
        if (!validatePassword()) return;

        setShowLoading(true);
        try {
            await register({ username, email, password, confirmPassword });
        } catch (error) {
            console.error('Register error:', error);
        } finally {
            setShowLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent className="register-content">
                <IonGrid>
                    <IonRow className="ion-justify-content-center ion-align-items-center">
                        <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
                            <div className="logo-container">
                                <h1>BeUnreal</h1>
                            </div>

                            <IonCard className="register-card">
                                <IonCardHeader>
                                    <IonCardTitle>Créer un compte</IonCardTitle>
                                </IonCardHeader>

                                <IonCardContent>
                                    <form onSubmit={handleRegister}>
                                        <IonItem className="ion-margin-bottom">
                                            <IonLabel position="stacked">Nom d'utilisateur</IonLabel>
                                            <IonInput
                                                value={username}
                                                onIonChange={e => setUsername(e.detail.value || '')}
                                                required
                                            />
                                        </IonItem>

                                        <IonItem className="ion-margin-bottom">
                                            <IonLabel position="stacked">Email</IonLabel>
                                            <IonInput
                                                type="email"
                                                value={email}
                                                onIonChange={e => setEmail(e.detail.value || '')}
                                                required
                                            />
                                        </IonItem>

                                        <IonItem className="ion-margin-bottom">
                                            <IonLabel position="stacked">Mot de passe</IonLabel>
                                            <IonInput
                                                type="password"
                                                value={password}
                                                onIonChange={e => {
                                                    setPassword(e.detail.value || '');
                                                    if (confirmPassword) validatePassword();
                                                }}
                                                required
                                            />
                                        </IonItem>

                                        <IonItem className="ion-margin-bottom">
                                            <IonLabel position="stacked">Confirmer le mot de passe</IonLabel>
                                            <IonInput
                                                type="password"
                                                value={confirmPassword}
                                                onIonChange={e => {
                                                    setConfirmPassword(e.detail.value || '');
                                                    if (password) validatePassword();
                                                }}
                                                required
                                            />
                                        </IonItem>

                                        {passwordError && (
                                            <IonText color="danger">
                                                <p>{passwordError}</p>
                                            </IonText>
                                        )}

                                        {authState.error && (
                                            <IonText color="danger" className="ion-text-center">
                                                <p>{authState.error}</p>
                                            </IonText>
                                        )}

                                        <IonButton
                                            expand="block"
                                            type="submit"
                                            className="ion-margin-top register-button"
                                        >
                                            <IonIcon slot="start" icon={personAddOutline} />
                                            S'inscrire
                                        </IonButton>

                                        <div className="ion-text-center ion-margin-top">
                                            <IonText>
                                                <p>
                                                    Déjà inscrit ?{' '}
                                                    <a href="/login" onClick={(e) => {
                                                        e.preventDefault();
                                                        history.push('/login');
                                                    }}>
                                                        Se connecter
                                                    </a>
                                                </p>
                                            </IonText>
                                        </div>
                                    </form>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                <IonLoading
                    isOpen={showLoading}
                    message={'Création du compte...'}
                />
            </IonContent>
        </IonPage>
    );
};

export default Register;