import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import MainTabs from './components/Layout/MainTabs';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Styles
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';
import './styles/App.css';

setupIonicReact();

// Composant de route privée qui vérifie l'authentification
const PrivateRoute: React.FC<{
  component: React.ComponentType<any>;
  path: string;
  exact?: boolean;
}> = ({ component: Component, ...rest }) => {
  const { authState } = useAuth();
  return (
      <Route
          {...rest}
          render={(props) =>
              authState.isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
          }
      />
  );
};

const App: React.FC = () => {
  return (
      <AuthProvider>
        <IonApp>
          <IonReactRouter>
            <IonRouterOutlet>
              <Route path="/login" component={Login} exact={true} />
              <Route path="/register" component={Register} exact={true} />
              <Route path="/tabs" component={MainTabs} />
              <Route exact path="/" render={() => <Redirect to="/login" />} />
            </IonRouterOutlet>
          </IonReactRouter>
        </IonApp>
      </AuthProvider>
  );
};

export default App;