import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { firebaseAuth, database } from "../firebase-config";
import { getChildDetials } from "../services/child";
import { DEFAULT_TENANT_ID, PREMIER_TIER_LIST } from "../Constants/Commons";
import { signInAnonymously, signOut } from "firebase/auth";
import { db } from "../firebase-config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { gameNamesMap } from  "../Constants/Commons";
import { Dialog } from "@mui/material";
import GameLoader from "../Components/PageComponents/GameLoader";
import AppButton from "../Components/Common/AppButton";
import {
  getDatabase,
  ref,
  onValue,
  off,
  onDisconnect,
  set,
} from "firebase/database";
import { doc, setDoc } from "firebase/firestore";
import useToast from "../hooks/use-toast.js";
import { getUrlByGameType } from "../GamesArena/utils";
const authContext = createContext({
  user: null,
  isUserLoading: true,
  isUserInMaidaanTenant: false,
  nonDefaultTenantId: undefined,
  isPremierPlan: false,
  logout: async () => {},
  dontShowUpdateDetails: false,
  setDontShowUpdateDetails: (val) => {},
  getUserDetails: async () => {},
});
const { Provider } = authContext;

const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserInMaidaanTenant, setIsUserInMaidaanTenant] = useState(false);
  const [nonDefaultTenantId, setNonDefaultTenantId] = useState();
  const [isPremierPlan, setIsPremierPlan] = useState(false);
  const [dontShowUpdateDetails, setDontShowUpdateDetails] = useState(false);


  const getUserDetails = async () => {
    try {
      const data = await getChildDetials();
      setUser({ ...data });
      const isPremierPlan = PREMIER_TIER_LIST.includes(data.currentSubscription?.plan);
      setIsPremierPlan(isPremierPlan);
      const isMaidaanTenant =
        !data?.tenantIds ||
        data?.tenantIds?.length === 0 ||
        data?.tenantIds?.includes(DEFAULT_TENANT_ID);
      const nonDefaultTenantId = data?.tenantIds?.find(
        (id) => id !== DEFAULT_TENANT_ID
      );
      setIsUserInMaidaanTenant(isMaidaanTenant);
      setNonDefaultTenantId(nonDefaultTenantId);
      return data;
    } catch (error) {
      console.log("error: ", error);
      setUser(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onlineRef = ref(database, ".info/connected");
    const usersRef = collection(db, "children");

    const listener = firebaseAuth.onAuthStateChanged(async (authUser) => {
      const searchParams = new URLSearchParams(window.location.search);
      const isDemoGame = searchParams.get("d") === "Y";
      setIsLoading(true);
      if (!isDemoGame) {

        if (authUser) {
          const idToken = await authUser.getIdToken(true);
          localStorage.setItem("token", idToken);
          const userDetails = await getUserDetails();
          if (userDetails?.createdAt) {
            setUser({ ...userDetails, idToken });
            onValue(onlineRef, async (snapshot) => {

              if (snapshot.val() === false) {
                return;
              }
              const statusRef = ref(database, `/status/${userDetails.id}`);
              onDisconnect(statusRef)
                .set("offline")
                .then(() => {
                  set(ref(database, `/status/${userDetails.id}`), "online");
                });
            });
        
          }
        } else {
          localStorage.clear();
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      off(onlineRef, "value"); // Remove the listener when component unmounts
      listener(); // Remove the auth state change listener when component unmounts
    };
  }, []);

  const signInAnonymouslyWithFirebase = async () => {
    try {
      const authUser = await signInAnonymously(firebaseAuth);
      const idToken = await authUser.user.getIdToken(true);
      localStorage.setItem("token", idToken);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const logout = async () => {
    await signOut(firebaseAuth);
    localStorage.clear();
    setUser(null);
    setDontShowUpdateDetails(false);
  };

  return {
    user,
    isUserLoading: isLoading,
    getUserDetails,
    isUserInMaidaanTenant,
    nonDefaultTenantId,
    signInAnonymouslyWithFirebase,
    logout,
    isPremierPlan,
    dontShowUpdateDetails,
    setDontShowUpdateDetails,
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthProvider();
  const [showPopup, setShowPopup] = useState(false);
  const { ToastComponent, showToast, hideToast } = useToast();
  const [listener, setListener] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const user = auth.user;
  //const navigate = useNavigate();

  useEffect(() => {
    //setup listener for the challenge

    if (!listener) return;
    const unsubscribe = onSnapshot(doc(db, "openChallenges", listener), (doc) => {
      const challengeData = doc.data();
      if(challengeData.status === "accepted") { 
        setCustomLoading(true);
      }
      if (challengeData.gameId) {
        const url = getUrlByGameType(challengeData.gameType, challengeData.gameId);
        
        window.location.href = url;
        setCustomLoading(false);
      }
    });

    return () => unsubscribe();
  }, [listener]);

  const renderLoading = (isLoading) => {
    return (
      <Dialog
        open={isLoading}
        //onClose={() => setShowGameSelectionPopup(false)}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">
          <div className="flex justify-center items-center">
            <div>
            <GameLoader message="setting up the game.." />
          </div>
        </div>
        </div>
      </Dialog>
    );
  };


  const CustomToast = ({ closeToast, challenge }) => {
    const [secondsLeft, setSecondsLeft] = useState(10);

    useEffect(() => {
      const timeoutId = setTimeout(() => {
        setSecondsLeft(prevSeconds => prevSeconds - 1);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }, [secondsLeft]);

    useEffect(() => {
      // Update challenge status when secondsLeft becomes 0
      if (secondsLeft === 0) {
        hideToast();
        setDoc(
          doc(db, "openChallenges", challenge.id),
          { status: "expired" },
          { merge: true }
        );
      }
    }, [secondsLeft]);

    return (
      <div className="p-2">
        <div><span><b>{challenge.userName}</b></span> has challenged you to a game of <span><b>{gameNamesMap[challenge.gameType]} </b></span></div>
        <div className="p-4 flex justify-center space-x-4">
          <div>
            <AppButton
              className="bg-[#3a3a3a] text-[#ccf900]"
              onClick={() => {
                hideToast();
                setDoc(
                  doc(db, "openChallenges", challenge.id),
                  { status: "accepted" },
                  { merge: true }
                );
                setListener(challenge.id);
              }}
            >
              Accept
            </AppButton>
          </div>
          <div>
            <AppButton
              className="bg-[#3a3a3a] text-[#ccf900]"
              onClick={() => {
                hideToast();
                setDoc(
                  doc(db, "openChallenges", challenge.id),
                  { status: "declined" },
                  { merge: true }
                );
              }}
            >
              Decline
            </AppButton>
          </div>
        </div>
        <div>Challenge will expire in {secondsLeft} seconds</div>
      </div>
    );
  };

  useEffect(() => {
    if (user?.createdAt) {
      window.onfocus = function () {
        set(ref(database, `/status/${user.id}`), "online");
      };

      window.onblur = function () {
        set(ref(database, `/status/${user.id}`), "offline");
      };

      return () => {
        window.onfocus = null;
        window.onblur = null;
      };
    }
  }, [user]);

  useEffect(() => {
    const openChallengesRef = collection(db, "openChallenges");
    let unsubscribe;
    if (!user) {
      return;
    }
    const q = query(
      openChallengesRef,
      where("challengeeId", "==", user?.id)
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
      // Logic to check for changes and show popup
      //get the data from snapshot and show the popup

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().status === "open") {
          //add doc data and doc id to the toast

          const ToastData = {
            ...change.doc.data(),
            id: change.doc.id,
          };
          setPopupData(ToastData);
          setShowPopup(true);
          showToast(<CustomToast challenge={ToastData} />,"success",10000);
        }
        else if (change.type === "modified" && change.doc.data().status === "expired") {
          hideToast();
        }
      }
      );
      //});
    });

    return () => {
      unsubscribe();
    };

  }, [user])

  return (
    <Provider value={auth} >
      <ToastComponent />
      {renderLoading(customLoading)}
      {children}
    </Provider>
  );
};

export const useAuth = () => useContext(authContext);
