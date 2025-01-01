import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../firebase-config";

const INSTRUMENTATION_COLLECTION = "instrumentation";

export async function MEASURE(action, userId, metaData) {
  const formatedData = _foramtInstrumentationData(action, userId, metaData);
  const dbRef = collection(db, INSTRUMENTATION_COLLECTION);

  return await setDoc(doc(dbRef), formatedData);
}

const _foramtInstrumentationData = (action, userId, metaData) => {
  const formattedData = {
    action,
    userId,
    metaData: JSON.stringify(metaData),
    timestamp: new Date().valueOf(),
  };
  return formattedData;
};
