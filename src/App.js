import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import Routers from './Components/Routers';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { handleReducer } from './Components/Redux/Reducer';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { AuthProvider } from './providers/auth-provider';
import { AxiosInterceptor } from './common/axios';
import { AppProvider } from './providers/app-provider';
import "react-awesome-animated-number/dist/index.css";
import "react-circular-progressbar/dist/styles.css";
import mixpanel from 'mixpanel-browser';
import { calculateAppHeight } from './Constants/Commons';

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

// // Get a list of cities from your database
// async function getCities(db) {
//   const citiesCol = collection(db, 'Words');
//   const citySnapshot = await getDocs(citiesCol);
//   const cityList = citySnapshot.docs.map(doc => doc.data());
//   return cityList;
// }

function App() {
  const store = createStore(handleReducer);
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
    mixpanel.init('de205a0aa382ce63f2ddae13ab9f89b4', {debug: true, track_pageview: "full-url", persistence: 'localStorage'});
    const appHeight = () => {
      calculateAppHeight();
    };
    window.addEventListener("resize", appHeight);
    appHeight();
    return () => {
      window.removeEventListener("resize", appHeight);
    };
  });


  return (
    <Provider store={store}>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider theme={theme}>
            <AxiosInterceptor>
              <div
                className="App flex flex-col justify-center items-center"
              >
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
