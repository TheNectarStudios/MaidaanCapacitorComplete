const { initializeApp, getApps } = require("firebase/app");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  where,
  query,
  collection,
  limit,
  orderBy,
} = require("firebase/firestore");
const { FIREBASE_CONFIG, devFirebaseConfig } = require("../constants/firebase");
const functions = require("firebase-functions");

let apps;
if (!getApps().length) {
  apps = initializeApp(FIREBASE_CONFIG);
} else {
  apps = getApps()[0];
}const db = getFirestore(apps);

exports.scheduledFunctionCrontab = functions.pubsub.schedule('every 60 minutes')
  .onRun( async (context) => {

    const querySnapshot = await getDocs(query(collection(db, `children`), where('tenantIds', 'array-contains', 'maidaan'), limit(2)));

    const promises = [];

    // Loop through each document and create promise for setPeopleYouMayKnow function
    querySnapshot.forEach((doc) => {
        console.log('doc:', doc.id);
        promises.push(setPeopleYouMayKnow(doc.id))
    });

    // Run all promises in parallel
    await Promise.all(promises);

    console.log('This will be run every day at 12:05 AM IST!');
    return null;
});

async function setPeopleYouMayKnowApi(userId) {
    //make an API call to the /profile/set-people-you-may-know endpoint
    //with the userId as the request body
    //return the response

    return await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/set-people-you-may-know`, { userId });
}



async function setPeopleYouMayKnow(userId) {
    try {
        
        console.log(new Date().toLocaleString());
        console.log("Came inside");
        console.log(userId);

        const userData = await getDoc(doc(db, 'children', userId));
        //console.log(userData,"userData");
        console.log(userData.data(),"userDataTenantIds");
        const userTenantIds = await getNonDefaultTenantIds(userData.data().tenantIds);
        
        const arenaGamesQuery = query(collection(db, 'children', userId, 'arenaGames'), where("pvpGame", "==", true));
        const arenaGamesPromise = await getDocsFromQuery(arenaGamesQuery);

        const friendsListPromise = await getFriendsList(userId, 100);
        const referredByQuery = query(collection(db, 'children'), where("referredBy", "==", userId));
        const referredByPromise = await getDocsFromQuery(referredByQuery);
        const gamesQuery = query(collection(db, 'children', userId, 'games'));
        const gamesPromise = await getDocsFromQuery(gamesQuery);

        let tenantRefPromise;
        console.log(userTenantIds,"userTenantIds");
        if (userTenantIds && userTenantIds.length !== 0) {
            const tenantQuery = query(collection(db, 'children'), 
                where("grade", "==", userData.data().grade),
                where("tenantIds", "array-contains-any", userTenantIds));
            tenantRefPromise = await getDocsFromQuery(tenantQuery);
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
            const friendsRef = collection(db, 'children', userId, 'friends');
            const peopleYouMayKnowRef = collection(db, 'children', userId, 'peopleYouMayKnow');

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

async function getFriendsList(userId, retrievelimit) {
    try {
        
        let docQuery = query(
            collection(db, 'children', userId, 'friends'),
            orderBy("createdAt", "desc"),
            limit(retrievelimit + 1)
          );


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


async function fetchTournamentRegistrations (tournamentId,peopleMap) {
    //const tournamentRef = FirebaseDb.collection('tournaments').doc(tournamentId).collection('registrations');
    const tournamentRef = collection(db, `tournaments/${tournamentId}/registrations`);
    const tournamentQuerySnapshot = await getDocs(tournamentRef);
    tournamentQuerySnapshot.forEach(doc => {
        const otherPlayerId = doc.data().childId;
        peopleMap.set(otherPlayerId, (peopleMap.get(otherPlayerId) || 0) + 1);
    });
}