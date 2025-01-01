const functions = require("firebase-functions");

const {
    getFirestore,
    collection,
    getDoc,
    setDoc,
    doc,
    updateDoc
  } = require("firebase/firestore");
  const { initializeApp } = require("firebase/app");
  const { FIREBASE_CONFIG, devFirebaseConfig } = require("../constants/firebase");
  
  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);


exports.endArenaTournament = functions.pubsub.schedule('0 22 * * 0')
    .timeZone('Asia/Kolkata') // Runs 10 pm every sunday
    .onRun(async () => {
        const arenaCollection = "weeklyArenaTournaments";
        const fromDocumentId = await getMondayWithUnderscore();
        const toDocumentId = await getNextMondayWithUnderscore();

        const fromDocRef = doc(db, arenaCollection, fromDocumentId);
        const fromDoc = await getDoc(fromDocRef);

        await _setValuesToDoc(arenaCollection, toDocumentId, fromDoc.data());
        await updateDoc(fromDocRef, {isTournamentEnded: true});
});

const getMondayWithUnderscore = async () => {
    const mondayDate = await getDateOfMonday();
    const formattedDate = mondayDate.toLocaleDateString("en-GB").replaceAll("/", "_");
    return formattedDate;
}

const getNextMondayWithUnderscore = async () => {
    const mondayDate = await getDateOfNextMonday();
    const formattedDate = mondayDate.toLocaleDateString("en-GB").replaceAll("/", "_");
    return formattedDate;
}

const getDateOfMonday = async () => {
    // Get the current date
    const currentDate = new Date();
    
    // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDayOfWeek = currentDate.getDay();
    
    // Calculate the difference between the current day and Monday (considering Sunday as the start of the week)
    const daysUntilMonday = (currentDayOfWeek + 6) % 7;
    
    // Subtract the difference to get the date of Monday for the current week
    const mondayDate = new Date(currentDate);
    mondayDate.setDate(currentDate.getDate() - daysUntilMonday);
    
    return mondayDate;
};
        
const getDateOfNextMonday = async () => {
    // Get the current date
    const currentDate = new Date();

    // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDayOfWeek = currentDate.getDay();
    
    // Calculate the difference to the next Monday
    const daysUntilNextMonday = (8 - currentDayOfWeek) % 7;
    
    // Add the difference to get the date of next Monday
    const nextMondayDate = new Date(currentDate);
    nextMondayDate.setDate(currentDate.getDate() + daysUntilNextMonday);
    
    return nextMondayDate;
};
        
const _setValuesToDoc = async (toCollection, toDocumentId, docData) => {
    const toCollRef = collection(db, toCollection);
    setDoc(doc(toCollRef, toDocumentId), docData);
};