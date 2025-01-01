import { doc, setDoc } from "firebase/firestore";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { ref } from "firebase/storage";
import { db, storage } from "../../firebase-config";

export async function sendData(coll, docdata, data) {
  // const collectionData =  collection(db, coll);
  // Add a new document in collection "cities"
  return await setDoc(doc(db, coll, docdata), data);
}

export async function getData(coll, uid) {
  //const dataCol = collection(db, coll);
  const dataSnapshot = doc(db, coll, uid);
  const docSnap = await getDoc(dataSnapshot);
  const output = { ...docSnap.data(), id: docSnap.id };
  return output;
}

export async function getDocuments(coll, docu) {
  const docRef = doc(db, coll, docu);
  const docSnap = await getDoc(docRef);
  const dataList = docSnap.data();
  return dataList;
}

export async function getAllDocs(coll, isDemoFlow = false, userId) {
  const querySnapshot = await getDocs(collection(db, coll));
  const data = [];
  querySnapshot.forEach((doc) => {
    if(isDemoFlow){
      if(doc.id === userId || doc.data().isDemoFlow){
        data.push({ ...doc.data(), id: doc.id });
      }
    }
    else{
      data.push({ ...doc.data(), id: doc.id });
    }
  });

  return data;
}

export async function getAllDocsWithQuery(coll, { field, operator, value }) {
  const q = query(collection(db, coll), where(field, operator, value));
  const querySnapshot = await getDocs(q);
  const data = [];
  querySnapshot.forEach((doc) => {
    data.push(doc.data());
  });

  return data;
}

export const getImageRef = async (url) => {
  const gsReference = ref(storage, url);
  return gsReference;
};
