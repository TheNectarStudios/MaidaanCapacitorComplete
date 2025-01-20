import React, { useEffect } from 'react';
import './App.css';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import Routers from './Components/Routers';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { handleReducer } from './Components/Redux/Reducer';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
import { AuthProvider } from './providers/auth-provider';
import { AxiosInterceptor } from './common/axios';
import { AppProvider } from './providers/app-provider';
import "react-awesome-animated-number/dist/index.css";
import "react-circular-progressbar/dist/styles.css";
import mixpanel from 'mixpanel-browser';
import { calculateAppHeight } from './Constants/Commons';
import { PushNotifications } from '@capacitor/push-notifications';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQs24FrZDp6kx6Luf9oq5f5l7Tasw-O-c",
  authDomain: "maidaan-921e1.firebaseapp.com",
  databaseURL: "https://maidaan-921e1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maidaan-921e1",
  storageBucket: "maidaan-921e1.appspot.com",
  messagingSenderId: "1012992519476",
  appId: "1:1012992519476:web:b662e0d9bdb3e5f56a0961",
  measurementId: "G-YLDW0TTPQT"
};
  
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  // Create Redux store
  const store = createStore(handleReducer);

  // MUI Theme customization
  const theme = useTheme({
    palette: {
      primary: {
        main: red[500],
      },
      secondary: {
        main: red[500],
      },
    },
    typography: {
      h1: { fontSize: 12, color: 'red' },
      fontSize: 12,
    },
  });

  useEffect(() => {
    // Mixpanel initialization
    mixpanel.init('de205a0aa382ce63f2ddae13ab9f89b4', {
      debug: true,
      track_pageview: "full-url",
      persistence: 'localStorage'
    });

    // Handle app height recalculations on resize
    const appHeight = () => {
      calculateAppHeight();
    };
    window.addEventListener("resize", appHeight);
    appHeight(); // initial height calculation

    return () => {
      window.removeEventListener("resize", appHeight);
    };
  }, []);

  useEffect(() => {
    // Request Push Notification Permissions and initialize push notifications
    const initializePushNotifications = async () => {
      try {
        const { receive } = await PushNotifications.requestPermissions();
        if (receive === 'granted') {
          await PushNotifications.register();

          // Push notification events
          PushNotifications.addListener('registration', (token) => {
            console.log('Push notification token:', token.value);
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('Push notification registration error:', error);
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Notification received:', notification);
            alert(`Notification: ${notification.title} - ${notification.body}`);
          });

          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Notification action performed:', action);
          });
        } else {
          console.error("Push notifications permission denied.");
        }
      } catch (error) {
        console.error("Error initializing push notifications:", error);
      }
    };

    initializePushNotifications();
  }, []);

  return (
    <Provider store={store}>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider theme={theme}>
            <AxiosInterceptor>
              <div className="App flex flex-col justify-center items-center">
                <Routers />
              </div>
            </AxiosInterceptor>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
