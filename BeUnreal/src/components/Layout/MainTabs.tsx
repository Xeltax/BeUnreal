import React from 'react';
import {IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs,} from '@ionic/react';
import {Redirect, Route} from 'react-router-dom';
import {cameraOutline, compassOutline, mapOutline, peopleOutline, personOutline} from 'ionicons/icons';
import ConversationList from './ConversationList';
import DiscoverView from './DiscoverView';
import FriendList from '../FriendList/FriendList';
import Profile from './Profile';
import {useAuth} from '../../contexts/AuthContext';
import '../../styles/MainTabs.css';
import MapView from "../../pages/MapView";

const MainTabs: React.FC = () => {
    const { authState } = useAuth();

    if (!authState.isAuthenticated) {
        return <Redirect to="/login" />;
    }

    return (
        <IonTabs>
            <IonRouterOutlet>
                <Route exact path="/tabs/friends" component={FriendList} />
                {/*<Route exact path="/tabs/camera" component={CameraView} /> */}
                <Route exact path="/tabs/discover" component={DiscoverView} />
                <Route exact path="/tabs/profile" component={Profile} />
                <Route exact path="/tabs/map" component={MapView} />
                <Route exact path="/tabs" render={() => <Redirect to="/tabs/camera" />} />
            </IonRouterOutlet>

            <IonTabBar slot="bottom" className="main-tab-bar">
                <IonTabButton tab="map" href="/tabs/map">
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
    );
};

export default MainTabs;