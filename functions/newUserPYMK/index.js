const { initializeApp, getApps } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
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

exports.callPYMLonNewChildDocument = functions.firestore
    .document('children/{userId}')
    .onCreate(async (snapshot, context) => {
        const userId = context.params.userId;
        //const userData = snapshot.data();

        try {
        if(snapshot.data().createdAt){
         await setPeopleYouMayKnow(userId);
        }
        } catch (error) {
            console.error('Error:', error);
        }
    });



async function fetchTournamentRegistrations (tournamentId,peopleMap) {
  //const tournamentRef = FirebaseDb.collection('tournaments').doc(tournamentId).collection('registrations');
  const tournamentRef = collection(db, `tournaments/${tournamentId}/registrations`);
  const tournamentQuerySnapshot = await tournamentRef.get();
  tournamentQuerySnapshot.forEach(doc => {
      const otherPlayerId = doc.data().childId;
      peopleMap.set(otherPlayerId, (peopleMap.get(otherPlayerId) || 0) + 1);
  });
}

async function setPeopleYouMayKnow(userId) {
    try {
        console.log(new Date().toLocaleString());
        console.log("Came inside");
        console.log(userId,"userId");

        const userData = await getDoc(doc(db, 'children', userId));
        const userTenantIds = getNonDefaultTenantIds(userData.data().tenantIds);
        
        const arenaGamesQuery = query(collection(db, 'children', userId, 'arenaGames'), where("pvpGame", "==", true));
        const arenaGamesPromise = getDocsFromQuery(arenaGamesQuery);

        const friendsListPromise = getFriendsList(userId, null, 100);
        const referredByQuery = query(collection(db, 'children'), where("referredBy", "==", userId));
        const referredByPromise = getDocsFromQuery(referredByQuery);
        const gamesQuery = query(collection(db, 'children', userId, 'games'));
        const gamesPromise = getDocsFromQuery(gamesQuery);

        let tenantRefPromise;
        if (userTenantIds && userTenantIds.length !== 0) {
            console.log("TenantIds", userTenantIds);
            console.log("Grade", userData.data().grade);
            const tenantQuery = query(collection(db, 'children'), 
                where("grade", "==", userData.data().grade),
                where("tenantIds", "array-contains-any", userTenantIds));
            tenantRefPromise = getDocsFromQuery(tenantQuery);
        } else {
            tenantRefPromise = Promise.resolve({ empty: true });
        }

        const [arenaGamesSnapshot, friendsList, referredByList, gamesSnapshot, tenantsList] = await Promise.all([
            arenaGamesPromise, friendsListPromise, referredByPromise, gamesPromise, tenantRefPromise
        ]);

        let referralList = [];
        if (userData.data().referredBy) {
            referralList.push(userData.data().referredBy);
        }

        let peopleMap = new Map();
        arenaGamesSnapshot.forEach(doc => {
            let otherPlayerId = doc.data().playerOne.id === userId ? doc.data().playerTwo.id : doc.data().playerOne.id;
            peopleMap.set(otherPlayerId, (peopleMap.get(otherPlayerId) || 0) + 1);
        });

        const arenaTournamentIds = gamesSnapshot.docs.map(doc => doc.data().tournamentId);
        const tidPromises = arenaTournamentIds.map(tournamentId => fetchTournamentRegistrations(tournamentId, peopleMap));
        await Promise.all(tidPromises);

        const sortedPeopleMap = new Map([...peopleMap.entries()].sort((a, b) => b[1] - a[1]));
        const peopleList = [...sortedPeopleMap].filter(([key, value]) => value >= 2).map(([key, value]) => key);

        let friendsSet = new Set(friendsList.data.map(f => f.friendId));
        let referredByIds = referredByList.docs.map(doc => doc.id);

        let peopleYouMayKnowList = [...new Set(referredByIds)].filter(id => id !== userId && !friendsSet.has(id));

        if (tenantsList && tenantsList.docs) {
            peopleYouMayKnowList = peopleYouMayKnowList.concat(tenantsList.docs.map(doc => doc.id));
        }

        if (peopleList && peopleList.length > 0) {
            peopleYouMayKnowList = peopleYouMayKnowList.concat(peopleList);
        }

        peopleYouMayKnowList = [...new Set(peopleYouMayKnowList)];

        for (let otherPlayerId of peopleYouMayKnowList) {
            const friendsRef = collection(db, 'children', userId, 'friends', otherPlayerId);
            const peopleYouMayKnowRef = collection(db, 'children', userId, 'peopleYouMayKnow', otherPlayerId);

            const [docSnapshot, peopleYouMayKnowSnapshot] = await Promise.all([
                getDocsFromQuery(friendsRef), getDocsFromQuery(peopleYouMayKnowRef)
            ]);

            if (docSnapshot.empty && peopleYouMayKnowSnapshot.empty && otherPlayerId !== userId) {
                await setDoc(peopleYouMayKnowRef, {
                    otherPlayerId: otherPlayerId,
                    createdAt: Date.now()
                });
            }
        }

        console.log(new Date().toLocaleString());
        return true;
    } catch (error) {
        console.error("Error setting people you may know:", error);
        throw error;
    }
}

async function getFriendsList(userId, lastDocumentId, retrievelimit) {
    try {
        let docQuery = collection(db, 'children', userId, 'friends')
            .orderBy("createdAt", "desc");

        if (lastDocumentId) {
            const lastDocSnapshot = await getDoc(doc(db, 'children', userId, 'friends', lastDocumentId));
            if (lastDocSnapshot.exists()) {
                docQuery = docQuery.startAfter(lastDocSnapshot);
            } else {
                console.error("Last document ID does not exist in the collection.");
                return;
            }
        }

        docQuery = docQuery.limit(retrievelimit + 1);

        const querySnapshot = await getDocs(docQuery);
        const data = [];
        let isLastBatch = false;

        if (querySnapshot.size <= retrievelimit) {
            isLastBatch = true;
            querySnapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
        } else {
            querySnapshot.docs.slice(0, retrievelimit).forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
        }

        for (let i = 0; i < data.length; i++) {
            const childDoc = await getDoc(doc(db, 'children', data[i].friendId));
            data[i].profileEmoji = childDoc.profileEmoji;
        }

        return {
            data,
            isLastBatch,
        };
    } catch (error) {
        console.error("Error getting friends list:", error);
        throw error;
    }
}

async function getDocsFromQuery(query) {
    try {
        const snapshot = await getDocs(query);
        return snapshot;
    } catch (error) {
        console.error("Error fetching documents from query:", error);
        throw error;
    }
}

async function getNonDefaultTenantIds(tenantIds) {
    if (!tenantIds) {
        return null;
    }
    try {
        const tenantId = tenantIds.filter((tenantId) => tenantId !== "maidaan");
        return tenantId;
    } catch (error) {
        console.error(error);
        return null;
    }
};
