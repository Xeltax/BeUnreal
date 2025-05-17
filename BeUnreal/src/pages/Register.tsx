import React, { useState } from 'react';
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
} from '@ionic/react';
import { register } from '../services/auth';
import { useHistory } from 'react-router';

const Register: React.FC = () => {
    const history = useHistory();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!username || !email || !password) {
            setError('Tous les champs sont requis');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userData = await register({ username, email, password });

            // Enregistrer le token d'authentification
            localStorage.setItem('userToken', userData.token);
            localStorage.setItem('userId', userData.id.toString());

            // Rediriger vers la page de profil
            history.push('/profile');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Inscription - BeUnreal</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonCard>
                    <IonCardContent>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <IonText color="danger">
                                    <p>{error}</p>
                                </IonText>
                            )}

                            <IonItem>
                                <IonLabel position="floating">Nom d'utilisateur</IonLabel>
                                <IonInput
                                    value={username}
                                    onIonChange={(e) => setUsername(e.detail.value!)}
                                    required
                                />
                            </IonItem>

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

                            <IonItem>
                                <IonLabel position="floating">Confirmer le mot de passe</IonLabel>
                                <IonInput
                                    type="password"
                                    value={confirmPassword}
                                    onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                                    required
                                />
                            </IonItem>

                            <div className="ion-padding-top">
                                <IonButton expand="block" type="submit">
                                    S'inscrire
                                </IonButton>
                            </div>

                            <div className="ion-text-center ion-padding-top">
                                <IonText>
                                    Déjà inscrit? <IonButton fill="clear" routerLink="/login">Se connecter</IonButton>
                                </IonText>
                            </div>
                        </form>
                    </IonCardContent>
                </IonCard>

                <IonLoading isOpen={loading} message="Inscription en cours..." />
            </IonContent>
        </IonPage>
    );
};

export default Register;