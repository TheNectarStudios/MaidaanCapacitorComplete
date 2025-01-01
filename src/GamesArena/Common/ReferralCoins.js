import { doc, getDoc, Timestamp,collection ,setDoc,addDoc} from "firebase/firestore";
import { db } from "../../firebase-config";
import { DEFAULT_WALLET_REWARD_POINTS, REFERRAL_REWARD_POINTS, WALLET_COLLECTION, WALLET_HISTORY_COLLECTION, CHILDREN_COLLECTION } from "../../Constants/Commons";
import { checkArenaGamesEmpty } from "../utils";


export const checkAndUpdateReferralCoins = async (userId, referrerId, userWalletId, referralBonusCredited) => {
  if (referrerId && !referralBonusCredited) {
    const firstArenaGame = await checkArenaGamesEmpty(userId);
    if(firstArenaGame){
    await updateReferrerCoinsCredit(referrerId, userId, userWalletId);
    }
    else{
      await updateChild(userId, {
        referralBonusCredited: true,
      });
    }
  }
}

const updateReferrerCoinsCredit = async (referralId, userId, userWalletId) => {

  const docRef = doc(db, "children", referralId);
  const docSnap = await getDoc(docRef);
  const createdAt = Timestamp.fromDate(new Date());
  if (docSnap.exists()) {
    const data = docSnap.data();
    const { walletId } = data;
    const wallet = await getWallet(walletId);
    const { rewardPoints } = wallet;
    await updateWallet(walletId, {
      rewardPoints: rewardPoints + DEFAULT_WALLET_REWARD_POINTS,
    });
    const historyData = {
      createdAt,
      points: DEFAULT_WALLET_REWARD_POINTS,
      transactionType: "credit",
      type: "referral",
      userId: referralId,
      walletId,
    };
    await addToWalletHistory(historyData);

    const childWallet = await getWallet(userWalletId);
    const { rewardPoints: childRewardPoints } = childWallet;
    await updateWallet(userWalletId, {
      rewardPoints: childRewardPoints + REFERRAL_REWARD_POINTS,
    });
    const childHistoryData = {
      createdAt,
      points: REFERRAL_REWARD_POINTS,
      transactionType: "credit",
      type: "referral",
      userId: userId,
      walletId: userWalletId,
    };
    await addToWalletHistory(childHistoryData);
  }
  await updateChild(userId, {
    referralBonusCredited: true,
  });
}

async function getWallet(id) {
  const docCollection = collection(db, WALLET_COLLECTION);
  const docSnap = await getDoc(doc(docCollection, id));
  return { ...docSnap.data(), id: docSnap.id };
}

async function updateWallet(docId, attrs) {
  const docRef = doc(db, WALLET_COLLECTION, docId);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  await setDoc(docRef, { ...data, ...attrs }, { merge: true });
}

async function addToWalletHistory(attrs) {
  const collectionRef = collection(db, WALLET_HISTORY_COLLECTION);
  await addDoc(collectionRef, attrs);
}

async function updateChild(docId, attrs) {
  const docRef = doc(db, CHILDREN_COLLECTION, docId);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  await setDoc(docRef, { ...data, ...attrs }, { merge: true });
}