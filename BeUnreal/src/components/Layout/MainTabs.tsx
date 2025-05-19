import React from 'react';
import {
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import {peopleOutline, cameraOutline, compassOutline, personOutline, mapOutline} from 'ionicons/icons';
// import CameraView from './CameraView';
import FriendsList from './FriendList';
import DiscoverView from './DiscoverView';
import Profile from '../../pages/Profile';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/MainTabs.css';

const MainTabs: React.FC = () => {
    const { authState } = useAuth();

    console.log('MainTabs authState:', authState);

    if (!authState.isAuthenticated) {
        return <Redirect to="/login" />;
    }

    return (
        <IonReactRouter>
            <IonTabs>
                <IonRouterOutlet>
                    <Route path="/tabs/friends" component={FriendsList} exact={true} />
                    {/*<Route path="/tabs/camera" component={CameraView} exact={true} />*/}
                    <Route path="/tabs/discover" component={DiscoverView} exact={true} />
                    <Route path="/tabs/profile" component={Profile} exact={true} />
                    <Route exact path="/tabs" render={() => <Redirect to="/tabs/camera" />} />
                </IonRouterOutlet>

                <IonTabBar slot="bottom" className="main-tab-bar">
                    <IonTabButton tab="friends" href="/tabs/friends">
                        <IonIcon icon={mapOutline} />
                        <IonLabel>Carte</IonLabel>
                    </IonTabButton>

                    <IonTabButton tab="friends" href="/tabs/friends">
                        <IonIcon icon={peopleOutline} />
                        <IonLabel>Amis</IonLabel>
                    </IonTabButton>

                    <IonTabButton tab="camera" href="/tabs/camera">
                        <div className="camera-tab-button">
                            <IonIcon icon={cameraOutline} />
                        </div>
                    </IonTabButton>

                    <IonTabButton tab="discover" href="/tabs/discover">
                        <IonIcon icon={compassOutline} />
                        <IonLabel>Découvrir</IonLabel>
                    </IonTabButton>

                    <IonTabButton tab="profile" href="/tabs/profile">
                        <IonIcon icon={personOutline} />
                        <IonLabel>Profil</IonLabel>
                    </IonTabButton>
                </IonTabBar>
            </IonTabs>
        </IonReactRouter>
    );
};

export default MainTabs;