import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { firebaseAuth } from '../firebase-config';
import { useAuth } from '../providers/auth-provider';
import Loader from './PageComponents/Loader';
import { GAME_HOUR_START_TIME ,GAME_HOUR_END_TIME, PRE_REGISTERED_USER_NUMBERS} from '../Constants/Commons';
import { checkGameHour } from '../services/child';
import { ARENA_ROUTES, PUBLIC_ROUTES, INGAME_ROUTES, UPDATE_SCHOOL_DETAILS_ROUTE, NON_DEMO_WIDE_SCREEN_ROUTES } from '../Constants/routes';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import DesktopRestriction from './PageComponents/DesktopRestriction';


export const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { user, isUserLoading, dontShowUpdateDetails } = useAuth();
  const navigate = useNavigate();

  const [searchParams, _] = useSearchParams();
  const [isPreRegisteredUser, setIsPreRegisteredUser] = useState(true);
  const redirectUrl = location.pathname + location.search;
  const arenaInvite = searchParams.get("invite");
  const redirectPathAfterLogin = searchParams.get("redirect") ?? '/lobby';
  const isDemoGame = (searchParams.get("d") === "Y"  && !user || searchParams.get("d") === "S")
  const registerSource = searchParams.get("source");
  const isValidRegisterSource = ["lobby", "new"].includes(registerSource);


  // add an array of arena routes and check if current route is one of them.

  const isArenaRoute = ARENA_ROUTES.includes(location.pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const isGameRoute = INGAME_ROUTES.includes(location.pathname);
  // check if the user.tenentIds has atleast one renentId and does not have default tenantId and the url is /lobby
  // if not, redirect to /school-lobby
  let reedirectToSchoolLobby = false;
  if (user && user?.tenantIds?.length > 0 && !user?.tenantIds?.includes("maidaan") && location.pathname === "/lobby") {
    reedirectToSchoolLobby = true;
  }

  useEffect(() => {
    if (user && user.phoneNumber) {
      // check if user phone starts with any of the pre-registered numbers
      if (user?.dontShowUpdateDetails !== undefined && user?.dontShowUpdateDetails) {
        setIsPreRegisteredUser(false);
        return;
      }
      const preRegistered = PRE_REGISTERED_USER_NUMBERS.some((number) =>
        user.phoneNumber.startsWith(number)
      );
      setIsPreRegisteredUser(
        preRegistered &&
          location.pathname !== UPDATE_SCHOOL_DETAILS_ROUTE &&
          !dontShowUpdateDetails
      );
      if (
        preRegistered &&
        location.pathname !== UPDATE_SCHOOL_DETAILS_ROUTE &&
        !dontShowUpdateDetails
      ) {
        navigate(UPDATE_SCHOOL_DETAILS_ROUTE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user, dontShowUpdateDetails]);

  useEffect(() => {
    const checkUser = () => {
      const userId = localStorage.getItem("userId");
      if (!isDemoGame && !isUserLoading && !ARENA_ROUTES && (!user || !userId || userId !== user?.id)) {
        localStorage.clear();
        signOut(firebaseAuth);
      }
    };
    checkUser();

    const UpdateInGameStatus = async () => {
      if (user?.id && isGameRoute) {
        const userRef = doc(db, "onlineUsers", user?.id);
        await setDoc(userRef, { inGame: true }, { merge: true });
      }
      else if (user?.id && !isGameRoute) {
        const userRef = doc(db, "onlineUsers", user?.id);
        await setDoc(userRef, { inGame: false }, { merge: true });
      }
    }
    UpdateInGameStatus();

    const visibilityChecker = () => {
      if (document.visibilityState === "visible") {
        UpdateInGameStatus();
      } else {
        if (user?.id) {
          const userRef = doc(db, "onlineUsers", user?.id);
          setDoc(userRef, { inGame: false }, { merge: true });
        }
      }
    };

    document.addEventListener("visibilitychange", visibilityChecker);

    if (isArenaRoute) {
      const formData = {
        startTime: GAME_HOUR_START_TIME,
        endTime: GAME_HOUR_END_TIME,
      };

      checkGameHour(formData).then((isGameHour) => {
        if (!isGameHour) {
          if (arenaInvite === "Y") {
            navigate("/arena?invite=Y");
          } else {
            navigate("/arena");
          }
          return <></>;
        } else {
          return children;
        }
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", visibilityChecker);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user,location.pathname]);


  const width = window.screen.width;
  const height = window.screen.height;
  if (width > height && !isDemoGame && !NON_DEMO_WIDE_SCREEN_ROUTES.includes(location.pathname)) {
    return <DesktopRestriction mode="light" />;
  }
  

  if (isDemoGame) {
    return children;
  }

   if (!isUserLoading /*&& !user*/ && isPublicRoute) {
     return children;
   }

   /*if(reedirectToSchoolLobby){
    navigate("/school-lobby");
    return <></>;
    }*/

  if (!isUserLoading && !user && !isDemoGame && !isPublicRoute) {
    navigate(`/login?redirect=${redirectUrl}`);
    return <></>;
    // return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  if (
    !isUserLoading &&
    user &&
    user?.id &&
    isPublicRoute &&
    !isArenaRoute &&
    !isValidRegisterSource &&
    !isPreRegisteredUser
  ) {
    navigate(redirectPathAfterLogin);
    return <></>;
    // return <Navigate to={redirectPathAfterLogin} replace />;
  }

  if ((!isUserLoading && user && !isPreRegisteredUser) || isDemoGame) {
    return children;  
  }

  if (!isUserLoading && !user?.createdAt && !isPublicRoute && !isGameRoute ) {
     signOut(firebaseAuth).then(() => {
       localStorage.removeItem("phoneNumber");
       localStorage.removeItem("token");
       navigate(`/login?redirect=${redirectUrl}`);
     });
     return <></>;
  }
      
  return (
    <div className="flex justify-center items-center w-screen h-screen">
      <Loader />
    </div>
  );
}