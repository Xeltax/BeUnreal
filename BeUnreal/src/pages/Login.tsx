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
import { logInOutline, logoGoogle, logoFacebook } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router';
import '../styles/Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const { authState, login } = useAuth();
    const history = useHistory();

    useEffect(() => {
        if (authState.isAuthenticated) {
            history.replace('/tabs/camera');
        }
    }, [authState.isAuthenticated, history]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setShowLoading(true);
        try {
            await login({ email, password });
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setShowLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent className="login-content">
                <IonGrid>
                    <IonRow className="ion-justify-content-center ion-align-items-center">
                        <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
                            <div className="logo-container">
                                <h1>BeUnreal</h1>
                            </div>

                            <IonCard className="login-card">
                                <IonCardHeader>
                                    <IonCardTitle>Connexion</IonCardTitle>
                                </IonCardHeader>

                                <IonCardContent>
                                    <form onSubmit={handleLogin}>
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
                                                onIonChange={e => setPassword(e.detail.value || '')}
                                                required
                                            />
                                        </IonItem>

                                        {authState.error && (
                                            <IonText color="danger" className="ion-text-center">
                                                <p>{authState.error}</p>
                                            </IonText>
                                        )}

                                        <IonButton
                                            expand="block"
                                            type="submit"
                                            className="ion-margin-top login-button"
                                        >
                                            <IonIcon slot="start" icon={logInOutline} />
                                            Se connecter
                                        </IonButton>

                                        <div className="ion-text-center ion-margin-top">
                                            <IonText>
                                                <p>
                                                    Pas encore de compte ?{' '}
                                                    <a href="/register" onClick={(e) => {
                                                        e.preventDefault();
                                                        history.push('/register');
                                                    }}>
                                                        S'inscrire
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
                    message={'Connexion en cours...'}
                />
            </IonContent>
        </IonPage>
    );
};

export default Login;