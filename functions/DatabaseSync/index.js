
const { initializeApp, getApps } = require("firebase/app");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} = require("firebase/firestore");
const { FIREBASE_CONFIG, devFirebaseConfig } = require("../constants/firebase");
const functions = require("firebase-functions");

let apps;
if (!getApps().length) {
  apps = initializeApp(FIREBASE_CONFIG);
} else {
  apps = getApps()[0];
}const db = getFirestore(apps);

exports.onUserStatusChanged = functions.database
  .ref('/status/{userId}')
  .onWrite(async (change, context) => {  
    console.log("change.after.val(): ", change.after.val());
    console.log("userId", context.params.userId);
    if (change.after.val() === 'online') {       
      try {
        const oneChild = await getDoc(doc(db, "children", context.params.userId));
        if (oneChild.exists()) {
          await setDoc(doc(db, "onlineUsers", context.params.userId), {
            firstName: oneChild.data()?.firstName,
            school: oneChild.data()?.school,
            grade: oneChild.data()?.grade,
            tenantIds: oneChild.data()?.tenantIds,
            online: true,
            createdAt: new Date(),
          }, { merge: true });
        }
      } catch (error) {
        console.error("Error updating online user:", error);
      }
    } else {
      try {
        console.log("Deleting online user");
        await deleteDoc(doc(db, "onlineUsers", context.params.userId));
      } catch (error) {
        console.error("Error deleting online user:", error);
      }
    }
    return null;
  });