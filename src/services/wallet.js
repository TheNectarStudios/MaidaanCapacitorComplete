import { collection, getDocs, query, where } from "firebase/firestore";
import axios from "../common/axios";
import { db } from "../firebase-config";
import { WALLET_HISTORY_COLLECTION } from "../Constants/Commons";

export const getWallet = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/wallet/get`
  );
  return data.data;
};

export const getCategories = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/rewards/categories`
  );
  return data.data;
}

export const getRewardsByCategory = async (id) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/rewards/categories/${id}`
  );
  return data.data;
}

export const getRewards = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/rewards/get`
  );
  return data.data;
}

export const claimReward = async (rewardIds, address) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/wallet/claim`,
    { rewardIds, address }
  );
  return data.data;
}

export const getPlans = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/wallet/plans`
    );
    return data.data;
  }
  
  export const getPlanDetails = async (planId) => {
    const { data } = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/payment/get-plan-details`,
      { planId }
      );
      return data.data;
    }
    
    
export const getAllSubscriptionPlans = async () => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_NODE_BASE_URL}/payment/get-all-plans`
    );
    return data.data;
  }
  
export const isWalletHistoryCreditMoreThanZero = async (userId) => {
  const walletRef = collection(db, WALLET_HISTORY_COLLECTION);
  const q = query(
    walletRef,
    where("userId", "==", userId),
    where("transactionType", "==", "credit"),
    where("type", "==", "reward"),
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return false;
  }
  // filter the values with tournamentId not empty and points greater than 0
  const walletHistory = querySnapshot.docs.map((doc) => doc.data());
  const filteredWalletHistory = walletHistory.filter((history) => history.tournamentId && history.points > 0);
  return filteredWalletHistory.length > 0;
};