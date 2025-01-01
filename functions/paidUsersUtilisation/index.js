const functions = require("firebase-functions");
const { initializeApp } = require("firebase/app");
const { google } = require('googleapis');
const {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    where,
    getDoc,
    doc
  } = require("firebase/firestore");
  const { FIREBASE_CONFIG, devFirebaseConfig } = require("../constants/firebase");

const serviceAccount = require('../serviceaccount.json');

const SCHOOL_12MONTHS_PLAN = "SCHOOL_12MONTHS";
const SCHOOL_6MONTHS_PLAN = "SCHOOL_6MONTHS";
const TOURNAMENTS_1 = "TOURNAMENTS_1"
const TOURNAMENTS_3 = "TOURNAMENTS_3"
const TOURNAMENTS_4 = "TOURNAMENTS_4"
const TOURNAMENTS_6 = "TOURNAMENTS_6"
const TOURNAMENTS_8 = "TOURNAMENTS_8"
const TOURNAMENTS_12 = "TOURNAMENTS_12"
const TOURNAMENTS_20 = "TOURNAMENTS_20"

const LONG_TERM_SCHOOL_PLAN_LIST = [
    SCHOOL_12MONTHS_PLAN,
    SCHOOL_6MONTHS_PLAN,
    TOURNAMENTS_1,
    TOURNAMENTS_3,
    TOURNAMENTS_4,
    TOURNAMENTS_6,
    TOURNAMENTS_8,
    TOURNAMENTS_12,
    TOURNAMENTS_20,
  ]

// Create JWT client using the service account key
const jwtClient = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize the Sheets API
const sheets = google.sheets({
  version: 'v4',
  auth: jwtClient,
});

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const CHILDREN_COLLECTION = "children";
const TENANT_COLLECTION = "tenants"
const paidUsersData = [];

exports.paidUsersUtilisation = functions.pubsub.schedule('0 20 * * 0')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const sheetId = "1zwXxq119ahkW0bQupeUNaqIbxfinQxwxUSylv965S3c";
    const optionalTenantGrades = await getOptionalTenantGrades();
    const paidChildIds = await getPaidChildIds(optionalTenantGrades);
    console.log("reached here")
    const messageCollRef = collection(db, `messageStatus`);

    const batchSize = 100; // Process 100 children at a time
    for (let i = 0; i < paidChildIds.length; i += batchSize) {
        const batch = paidChildIds.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} out of ${Math.ceil(paidChildIds.length / batchSize)}`);


    const attemptPromises = batch.map(async (child) => {
        const tournamentResults = await _getAllDocs(`children/${child.id}/tournamentSummary`);

        for (let tournamentSummary of tournamentResults) {
            const tournamentDoc = await getDoc(doc(db, `tournaments/${tournamentSummary.id}`));
            let R1Init = false;
            let R2Init = false;
            let R3Init = false;
            let r1reminder1Status;
            let r1reminder2Status;
            let r1reminder3Status;
            let r2reminder1Status;
            let r2reminder2Status;
            let r2reminder3Status;
            let r3reminder1Status;
            let r3reminder2Status;
            let r3reminder3Status;
            let elimTournament = false;
            let elimPoolId = null;

            if (tournamentDoc.exists()) {
                const tournamentData = tournamentDoc.data();
                
                if (tournamentData.poolIds && Array.isArray(tournamentData.poolIds)) {
                    // Set elim tournament flag to true since poolIds exist
                    elimTournament = true;

                    // Check for a common poolId between tournament poolIds and child's registrations
                    elimPoolId = tournamentData.poolIds.find(poolId => 
                        child.registrations.includes(poolId)
                    );
                }

                const gamesCollRef = collection(db, `children/${child.id}/games`);
                if(elimTournament && elimPoolId){
                    const r1Query = query(gamesCollRef, where("tournamentId","==",elimPoolId), where("round","==","1"));
                    const r2Query = query(gamesCollRef, where("tournamentId","==",elimPoolId), where("round","==","2"));
                    const r3Query = query(gamesCollRef, where("tournamentId","==",tournamentSummary.id));

                    const r1Reminder1Query = query(messageCollRef, where("messageType","==","round1_reminder1"), where("tournamentId","==",elimPoolId), where("userId","==",child.id));
                    const r1Reminder2Query = query(messageCollRef, where("messageType","==","round1_reminder2"), where("tournamentId","==",elimPoolId), where("userId","==",child.id));
                    const r1Reminder3Query = query(messageCollRef, where("messageType","==","round1_reminder3"), where("tournamentId","==",elimPoolId), where("userId","==",child.id));
                    const r2Reminder1Query = query(messageCollRef, where("messageType","==","round2_reminder1"), where("tournamentId","==",elimPoolId), where("userId","==",child.id));
                    const r2Reminder2Query = query(messageCollRef, where("messageType","==","round2_reminder2"), where("tournamentId","==",elimPoolId), where("userId","==",child.id));
                    const r2Reminder3Query = query(messageCollRef, where("messageType","==","round2_reminder3"), where("tournamentId","==",elimPoolId), where("userId","==",child.id));
                    const r3Reminder1Query = query(messageCollRef, where("messageType","==","round3_reminder1"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r3Reminder2Query = query(messageCollRef, where("messageType","==","round3_reminder2"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r3Reminder3Query = query(messageCollRef, where("messageType","==","round3_reminder3"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));

                    r1reminder1Status = await getReminderStatus(r1Reminder1Query);
                    r1reminder2Status = await getReminderStatus(r1Reminder2Query);
                    r1reminder3Status = await getReminderStatus(r1Reminder3Query);
                    r2reminder1Status = await getReminderStatus(r2Reminder1Query);
                    r2reminder2Status = await getReminderStatus(r2Reminder2Query);
                    r2reminder3Status = await getReminderStatus(r2Reminder3Query);
                    r3reminder1Status = await getReminderStatus(r3Reminder1Query);
                    r3reminder2Status = await getReminderStatus(r3Reminder2Query);
                    r3reminder3Status = await getReminderStatus(r3Reminder3Query);

                    const r1Snapshot = await getDocs(r1Query);
                    if (!r1Snapshot.empty) {
                        R1Init = true;  // Set to true if any document is found
                    }

                    const r2Snapshot = await getDocs(r2Query);
                    if (!r2Snapshot.empty) {
                        R2Init = true;  // Set to true if any document is found
                    }

                    const r3Snapshot = await getDocs(r3Query);
                    if (!r3Snapshot.empty) {
                        R3Init = true;  // Set to true if any document is found
                    }
                } else if(!elimTournament){
                    const r1Query = query(gamesCollRef, where("tournamentId","==",tournamentSummary.id), where("round","==","1"));
                    const r2Query = query(gamesCollRef, where("tournamentId","==",tournamentSummary.id), where("round","==","2"));
                    const r3Query = query(gamesCollRef, where("tournamentId","==",tournamentSummary.id), where("round","==","3"));

                    const r1Reminder1Query = query(messageCollRef, where("messageType","==","round1_reminder1"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r1Reminder2Query = query(messageCollRef, where("messageType","==","round1_reminder2"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r1Reminder3Query = query(messageCollRef, where("messageType","==","round1_reminder3"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r2Reminder1Query = query(messageCollRef, where("messageType","==","round2_reminder1"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r2Reminder2Query = query(messageCollRef, where("messageType","==","round2_reminder2"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r2Reminder3Query = query(messageCollRef, where("messageType","==","round2_reminder3"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r3Reminder1Query = query(messageCollRef, where("messageType","==","round3_reminder1"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r3Reminder2Query = query(messageCollRef, where("messageType","==","round3_reminder2"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));
                    const r3Reminder3Query = query(messageCollRef, where("messageType","==","round3_reminder3"), where("tournamentId","==",tournamentSummary.id), where("userId","==",child.id));

                    r1reminder1Status = await getReminderStatus(r1Reminder1Query);
                    r1reminder2Status = await getReminderStatus(r1Reminder2Query);
                    r1reminder3Status = await getReminderStatus(r1Reminder3Query);
                    r2reminder1Status = await getReminderStatus(r2Reminder1Query);
                    r2reminder2Status = await getReminderStatus(r2Reminder2Query);
                    r2reminder3Status = await getReminderStatus(r2Reminder3Query);
                    r3reminder1Status = await getReminderStatus(r3Reminder1Query);
                    r3reminder2Status = await getReminderStatus(r3Reminder2Query);
                    r3reminder3Status = await getReminderStatus(r3Reminder3Query);

                    const r1Snapshot = await getDocs(r1Query);
                    if (!r1Snapshot.empty) {
                        R1Init = true;  // Set to true if any document is found
                    }

                    const r2Snapshot = await getDocs(r2Query);
                    if (!r2Snapshot.empty) {
                        R2Init = true;  // Set to true if any document is found
                    }

                    const r3Snapshot = await getDocs(r3Query);
                    if (!r3Snapshot.empty) {
                        R3Init = true;  // Set to true if any document is found
                    }
                }
                paidUsersData.push([child.id, child.tenantIds[0], child.grade, tournamentSummary.id, tournamentSummary?.status, tournamentSummary?.rank, R1Init, R2Init, R3Init, r1reminder1Status, r1reminder2Status, r1reminder3Status, r2reminder1Status, r2reminder2Status, r2reminder3Status, r3reminder1Status, r3reminder2Status, r3reminder3Status])
                
            }
        }
        console.log(`Added for ${child.id}`)
    });

    await Promise.all(attemptPromises);
}

const request = {
    spreadsheetId: sheetId,
    range: `Sheet1!A2`,
    valueInputOption: 'RAW',
    resource: {
      values: paidUsersData,
    },
  };

  // Update the Google Sheet
  await sheets.spreadsheets.values.update(request);
  })

  const getReminderStatus = async (query) => {
    const querySnapshot = await getDocs(query);
    if (querySnapshot.empty) {
        return "Not Sent";
    } else {
        const doc = querySnapshot.docs[0]; // Get the first document
        const statusArray = doc.data().status || []; // Get the status array
        return statusArray.length > 0 ? statusArray[statusArray.length - 1] : "No Status"; // Return last element or 'No Status'
    }
};


  const getOptionalTenantGrades = async () => {
    const collectionRef = collection(db, TENANT_COLLECTION);
    const q2 = query(collectionRef, orderBy("status"));
    const querySnapshotTenants = await getDocs(q2);

    let tenantGradesMap = {};

    querySnapshotTenants.forEach(doc => {
        const statusMap = doc.data().status;

        // Filter grades with the desired statuses
        const matchingGrades = Object.keys(statusMap).filter(grade =>
            statusMap[grade] === "CONVERTED_PAYTHROUGHSCHOOL" || 
            statusMap[grade] === "CONVERTED_PAYDIRECT"
        );

        // If there are matching grades, add them to the map
        if (matchingGrades.length > 0) {
            tenantGradesMap[doc.id] = matchingGrades.map(grade => Number(grade));;
        }
    });

    // Convert the map to an array of objects
    const tenantGrades = Object.keys(tenantGradesMap).map(tenantId => ({
        tenantId: tenantId,
        grades: tenantGradesMap[tenantId]
    }));
    return tenantGrades;
};

const getPaidChildIds = async (optionalTenantGrades) => {
    const childCollectionRef = collection(db, CHILDREN_COLLECTION);
    const ids = [];

    //optional converted people
    for (tenantGrade of optionalTenantGrades){
        
        const q = query(childCollectionRef, where("grade","in",tenantGrade.grades), where("tenantIds","array-contains",tenantGrade.tenantId))
        const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.currentSubscription?.plan && LONG_TERM_SCHOOL_PLAN_LIST.includes(data.currentSubscription.plan)) {
                ids.push({ ...doc.data(), id: doc.id });}
              });       
    }

    //open paid
    const q1 = query(childCollectionRef, where("currentSubscription.plan","in",["SUPER_12MONTHS","PREMIER_12MONTHS"]))
    const querySnapshotOpen = await getDocs(q1);
        querySnapshotOpen.forEach((doc) => {
            ids.push({ ...doc.data(), id: doc.id });
        }); 
    return(ids);
    
};

const _getAllDocs = async (collectionName) => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({ ...doc.data(), id: doc.id });
    });
  
    return data;
};