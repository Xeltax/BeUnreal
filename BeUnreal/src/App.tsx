import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { person, chatbubbles, search, camera, map } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Pages */
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UserSearch from './pages/UserSearch';
import NearbyUsers from './pages/NearbyUsers';
import ConversationsList from './pages/ConversationsList';
import ChatRoom from './pages/ChatRoom';
import CameraView from './pages/CameraView';

/* Hooks */
import { useAuth } from './hooks/useAuth';
import { initSocket, closeSocket } from './services/message';
import MapView from "./pages/MapView";

setupIonicReact();

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('userToken');
      if (token) {
        initSocket(token);
      }
    } else if (!loading) {
      closeSocket();
    }
  }, [isAuthenticated, loading]);

  return (
      <IonApp>
        <IonReactRouter>
          {!isAuthenticated && !loading ? (
              <IonRouterOutlet>
                <Route exact path="/login" component={Login} />
                <Route exact path="/register" component={Register} />
                <Route exact path="/">
                  <Redirect to="/login" />
                </Route>
                <Route>
                  <Redirect to="/login" />
                </Route>
              </IonRouterOutlet>
          ) : (
              <IonTabs>
                <IonRouterOutlet>
                  <Route exact path="/profile" component={Profile} />
                  <Route exact path="/user-search" component={UserSearch} />
                  <Route exact path="/nearby-users" component={NearbyUsers} />
                  <Route exact path="/conversations" component={ConversationsList} />
                  <Route exact path="/chat/:id" component={ChatRoom} />
                  <Route exact path="/camera" component={CameraView} />
                  <Route exact path="/map" component={MapView} />
                  <Route exact path="/">
                    <Redirect to="/profile" />
                  </Route>
                </IonRouterOutlet>
                <IonTabBar slot="bottom">
                  <IonTabButton tab="profile" href="/profile">
                    <IonIcon icon={person} />
                    <IonLabel>Profil</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="chat" href="/conversations">
                    <IonIcon icon={chatbubbles} />
                    <IonLabel>Messages</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="discover" href="/nearby-users">
                    <IonIcon icon={search} />
                    <IonLabel>Découvrir</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="camera" href="/camera">
                    <IonIcon icon={camera} />
                    <IonLabel>Caméra</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="map" href="/map">
                    <IonIcon icon={map} />
                    <IonLabel>Carte</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              </IonTabs>
          )}
        </IonReactRouter>
      </IonApp>
  );
};

export default App;