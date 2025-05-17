import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonInput,
    IonButton,
    IonItem,
    IonLabel,
    IonLoading,
    IonText,
    IonCard,
    IonCardContent,
    IonImg,
} from '@ionic/react';
import { login } from '../services/auth';
import { useHistory } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
    const history = useHistory();
    const { isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            history.replace('/profile');
        }
    }, [isAuthenticated, history]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!email || !password) {
            setError('Tous les champs sont requis');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userData = await login({ email, password });

            // Enregistrer le token d'authentification
            localStorage.setItem('userToken', userData.token);
            localStorage.setItem('userId', userData.id.toString());

            // Rediriger vers la page de profil
            history.push('/profile');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Connexion - BeUnreal</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="ion-text-center ion-padding">
                    <h1>BeUnreal</h1>
                    <p>Soyez vous-même en temps réel</p>
                </div>

                <IonCard>
                    <IonCardContent>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <IonText color="danger">
                                    <p>{error}</p>
                                </IonText>
                            )}

                            <IonItem>
                                <IonLabel position="floating">Email</IonLabel>
                                <IonInput
                                    type="email"
                                    value={email}
                                    onIonChange={(e) => setEmail(e.detail.value!)}
                                    required
                                />
                            </IonItem>

                            <IonItem>
                                <IonLabel position="floating">Mot de passe</IonLabel>
                                <IonInput
                                    type="password"
                                    value={password}
                                    onIonChange={(e) => setPassword(e.detail.value!)}
                                    required
                                />
                            </IonItem>

                            <div className="ion-padding-top">
                                <IonButton expand="block" type="submit">
                                    Se connecter
                                </IonButton>
                            </div>

                            <div className="ion-text-center ion-padding-top">
                                <IonText>
                                    Pas encore de compte? <IonButton fill="clear" routerLink="/register">S'inscrire</IonButton>
                                </IonText>
                            </div>
                        </form>
                    </IonCardContent>
                </IonCard>

                <IonLoading isOpen={loading} message="Connexion en cours..." />
            </IonContent>
        </IonPage>
    );
};

export default Login;