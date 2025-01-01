import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { getWallet } from "../services/wallet";
import { useAuth } from "./auth-provider";
import { DEFAULT_TENANT_ID } from "../Constants/Commons";

const initialState = {
  wallet: null,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case "SET_WALLET":
      return {
        ...state,
        wallet: action.payload,
      };
    default:
      return state;
  }
};

const appContext = createContext();
const { Provider } = appContext;


const useAppProvider = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const { user, isUserInMaidaanTenant, nonDefaultTenantId } = useAuth();
    const [selectedTenant, setSelectedTenant] = useState(DEFAULT_TENANT_ID);

    const isOpenTenantSelected = useMemo(
      () => selectedTenant === DEFAULT_TENANT_ID,
      [selectedTenant]
    );


    useEffect(() => {
      if (user?.createdAt) {
        getUserWallet();
          const { tenantIds } = user;
          if (!tenantIds || !tenantIds?.length || tenantIds?.includes(DEFAULT_TENANT_ID)) {
            handleSelectedTenant(DEFAULT_TENANT_ID);
          } else {
            handleSelectedTenant(nonDefaultTenantId);
          }
      }
    }, [nonDefaultTenantId, user]);

    const getUserWallet = async () => {
      try {
        const data = await getWallet();
        dispatch({ type: "SET_WALLET", payload: data });
      } catch (error) {
        console.log("error: ", error);
      }
    };

    const handleSelectedTenant = (tenantId) => {
      setSelectedTenant(tenantId);
    };

    return {
      ...state,
      dispatch,
      getUserWallet,
      selectedTenant,
      handleSelectedTenant,
      isOpenTenantSelected,
    };
};

export const AppProvider = ({ children }) => {
  const app = useAppProvider();
  return <Provider value={app}>{children}</Provider>;
};

export const useApp = () => useContext(appContext);
