import { setDoc, collection, doc, getDoc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase-config";
import { shareOnWhatsapp } from "../Constants/Commons";
import { DAILY_LIMIT } from "../Constants/GamesArena/MemoryCards";
import { HANGMAN_ROUTE, LOGO_QUIZ_ROUTE, MEMORY_CARDS_ROUTE, MENTAL_MATH_ROUTE, CONNECT_4_ROUTE, ENGLISH_MEANIGS_QUIZ_ROUTE, MEMORY_CARDS_PRO_ROUTE, ARCHERY_ROUTE, MINI_SCRABBLE_ROUTE } from "../Constants/routes";
import { useNavigate } from "react-router-dom";
import { DEFAULT_TENANT_ID } from "../Constants/Commons";
export const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const TOTAL_POINTS_PER_WEEK = 250;

export const TOTAL_POINTS_PER_DAY = 46;

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");

export const addGameDetailsToChild = async (childId, gameId, gameData) => {
    try {
        const childrenCollection = collection(db, `children/${childId}/arenaGames`);
        const gameDocRef = doc(childrenCollection, gameId);
        await setDoc(gameDocRef, gameData, { merge: true });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const isFutureDate = (inputDateString) => {
  // Convert the input date string from "DD_MM_YYYY" format to a Date object
  const [day, month, year] = inputDateString.split('_').map(Number);
  const inputDate = new Date(Date.UTC(year, month - 1, day, -5, -30, 0));

  const now = new Date();
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 330);
  return nowUtc < inputDate;
}

export const checkArenaGamesEmpty = async (childId) => {
    try {
        const childrenCollection = collection(db, `children/${childId}/arenaGames`);
        const gamesSnap = await getDocs(childrenCollection);
        return gamesSnap.empty;
    } catch (error) {
        console.error(error);
        return true;
    }
};

export const getNonDefaultTenantIds = (tenantIds) => {
  if (!tenantIds) {
    return null;
  }
    try {
      const tenantId = tenantIds.filter((tenantId) => tenantId !== DEFAULT_TENANT_ID);
      return tenantId;
    } catch (error) {
      console.error(error);
      return null;
    }
};

export const getUrlByGameType = (gameType,gameId) => {
  switch (gameType) {
    case "memoryCards":
      return `${MEMORY_CARDS_ROUTE}?gameId=${gameId}`;
    case "memoryCardsPro":
      return `${MEMORY_CARDS_PRO_ROUTE}&gameId=${gameId}`;
    case "oneOnOneQuiz":
    return `${MENTAL_MATH_ROUTE}&gameId=${gameId}`;
    case "LogoQuiz":
      return `${LOGO_QUIZ_ROUTE}&gameId=${gameId}`
    case "connect4":
      return `${CONNECT_4_ROUTE}?gameId=${gameId}`;
    case "hangman":
      return `${HANGMAN_ROUTE}?gameId=${gameId}`;
    case "englishMeaningsQuiz":
      return `${ENGLISH_MEANIGS_QUIZ_ROUTE}&gameId=${gameId}`;
    case "archery":
      return `${ARCHERY_ROUTE}?gameId=${gameId}`;
    case "miniScrabble":
      return `${MINI_SCRABBLE_ROUTE}?gameId=${gameId}`;
    default:
      return null;
  }
}

export const updateChildDetails = async (childId, childData) => {
    try {
        const childrenCollection = collection(db, `children`);
        const childDocRef = doc(childrenCollection, childId);
        await setDoc(childDocRef, childData, { merge: true });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const updateChildDetailsUpdateMethod = async (childId, childData) => {
    try {
        const childrenCollection = collection(db, `children`);
        const childDocRef = doc(childrenCollection, childId);
        await updateDoc(childDocRef, ...childData);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const handleShare = async (bodyText) => {
  try {
    const data = {
      title: "",
      text: bodyText,
    };
    navigator.clipboard.writeText(bodyText);
    await shareOnWhatsapp(data);
  } catch (err) {
    console.log(err);
  }
};


export const generateRandomArray = (length, targetSum) => {
  // Validate input parameters
  if (length <= 0 || targetSum <= 0) {
    throw new Error("Length and target sum must be greater than zero.");
  }

  // Initialize the result array
  const resultArray = [];

  // Generate random integers between 0 and 9 and ensure the sum constraint
  for (let i = 0; i < length - 1; i++) {
    const randomNumber = Math.floor(Math.random() * 9); // Generates a random integer between 0 and 9
    resultArray.push(randomNumber);
  }

  // Calculate the last element to ensure the total sum matches the targetSum,
  // is less than 9, and is not negative
  const remainingSum =
    targetSum - resultArray.reduce((acc, num) => acc + num, 0);
  const lastElement = Math.max(0, Math.min(9, remainingSum));
  resultArray.push(lastElement);

  return resultArray;
}

export  const calculateGameCount = (user, currentDateInDDMMYYYY) => {
  const games = { ...user?.arenaGames } ?? {};
  delete games.points;
  const gc = Object.keys(games).reduce((acc, curr) => {
    return acc + (games?.[curr]?.[currentDateInDDMMYYYY] ?? 0);
  }, 0);
  return gc;
};

export const getGameConfig = async (dateString) => {
  const collectionRef = collection(db, "weeklyArenaTournaments");
  const docRef = doc(collectionRef, dateString);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
};

export const getWeeklyArenaTournamentLeaderboard = async (dateString) => {
  const collectionRef = collection(db, "weeklyArenaTournaments");
  const docRef = doc(collectionRef, dateString);
  const leadearboardRef = collection(docRef, "leaderboard");
  const leaderboardSnap = await getDocs(leadearboardRef);
  const leaderboardData = [];
  leaderboardSnap.forEach((doc) => {
    const data = { ...doc.data(), id: doc.id };
    leaderboardData.push(data);
  });
  return leaderboardData;
};

export const getDateOfMonday = () => {
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

export const getDateOfAllDaysFromMondayToSunday = () => {
  const mondayDate = getDateOfMonday();
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const dates = [];
  for (let d = mondayDate; d <= sundayDate; d.setDate(d.getDate() + 1)) {
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    dates.push(`${day}/${month}/${year}`);
  }
  return dates;
}

export const validateAndFormatDate = (dateString) => {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateString.match(dateRegex);

  if (match) {
    const formattedDate = `${match[2]}/${match[1]}/${match[3]}`;
    return new Date(formattedDate);
  } else {
    return null; // Invalid date format
  }
}


export const getDateOfMondayWithUnderscore = () => {
  const mondayDate = getDateOfMonday()
    .toLocaleDateString("en-GB")
    .replaceAll("/", "_");
  return mondayDate;
}

export const getTotalGamesCountFromMondayToToday = (user) => {
  // get the date of Monday for the current week
  const mondayDate = getDateOfMonday();
  // current date
  const currentDate = new Date();
  // check all game counts from Monday to today
  let totalGamesCount = 0;
  let streak = 0;
  for (let d = mondayDate; d <= currentDate; d.setDate(d.getDate() + 1)) {
    let dateString = d.toLocaleDateString("en-IN");

    //if date and month are single digit then add 0 before them
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    dateString = `${day}/${month}/${year}`;
    const gc = calculateGameCount(user, dateString);
    totalGamesCount += gc;
    streak += 1;
    if (gc === 0) {
      streak = 0;
    }
  }
  return { totalGamesCount, streak };
};

export const sortDataPerRankOrPoints = (data, config) => {
  // if rank exist then use rank to sort else sort using pointsWon field and add the rank field to each object
  const sortedData = data.sort((a, b) => {
    /*if (a.Rank && b.Rank) {
      return a.Rank - b.Rank;
    } else {
      return b.points/Won - a.pointsWon;
    }*/
    if (
      a.pointsWon === b.pointsWon
  ) {
    if (
      a.gamesPlayed === b.gamesPlayed
    ) { 
      return a.lastGamePlayedAt - b.lastGamePlayedAt;
    }
    else {
      return b.gamesPlayed - a.gamesPlayed;
    }
  }
  else {
    return b.pointsWon - a.pointsWon;
  }
  });
  // add rank field to each object
  
  sortedData.forEach((obj, index) => {
    obj.Rank = obj.Rank ?? index + 1;
    obj.coins = obj.coins ?? config?.rankCoinsMap?.[obj.Rank] ?? 0;
  });

  return sortedData;
};

export const formatDateForDropdown = (inputDate) => {
  // Parse the input date string
  let dateParts = inputDate.split('_');
  let day = parseInt(dateParts[0], 10);
  let month = parseInt(dateParts[1], 10);
  let year = parseInt(dateParts[2], 10);

  // Create a Date object
  let formattedDate = new Date(year, month - 1, day);

  // Format the date as "1st Jan '24"
  let options = { day: 'numeric', month: 'short', year: '2-digit' };
  let formattedString = formattedDate.toLocaleDateString('en-US', options);

  // Extract the day, month, and year from the formatted string
  let formattedParts = formattedString.split(' ');
  let formattedDay = formattedParts[1].slice(0, -1);
  let formattedMonth = formattedParts[0];
  let formattedYear = `'${formattedParts[2]}`;

  // Add the appropriate suffix to the day
  
  if (formattedDay.endsWith('1') && formattedDay !== '11') {
   formattedDay += 'st';
  } else if (formattedDay.endsWith('2') && formattedDay !== '12') {
    formattedDay += 'nd';
  } else if (formattedDay.endsWith('3') && formattedDay !== '13') {
    formattedDay += 'rd';
  } else {
    formattedDay += 'th';
  }

  // Combine the formatted parts to get the final result
  var finalFormattedDate = formattedDay + ' ' + formattedMonth + ' ' + formattedYear;

  return finalFormattedDate;
}
export const quitGame = async (
  gameId,
  user,
  redirectRoute,
  gameState,
  gameCollectionName,
  setExitGamePopup,
  setQuitGamePopup,
  setGameWonByExit,
  navigate,
  resetStateVariables,
) => {
  if (gameId && user?.createdAt) {
    setExitGamePopup(false);
    setQuitGamePopup(false);
    const numberOfMovesOfCurrentPlayer =
      gameState?.[
        gameState?.playerOne.id === user?.id ? "playerOne" : "playerTwo"
      ]?.numberOfMoves ?? 0;
    const playerOne = gameState?.playerOne;
    const connect4Collection = collection(db, gameCollectionName);
    const gameRef = doc(connect4Collection, gameId);
    if (!numberOfMovesOfCurrentPlayer && gameState?.gameEndedAt) {
      await setDoc(
        gameRef,
        {
          gameEndedAt: new Date(),
          gameExited: user.id,
        },
        { merge: true }
      );
    } else {
      if (!gameState?.winner) {
        setDoc(
          gameRef,
          {
            gameEndedAt: new Date(),
            winner: playerOne.id === user.id ? "playerTwo" : "playerOne",
            gameExited: user.id,
            gameWonByExit: true,
          },
          { merge: true }
        );
        setGameWonByExit(true);
      } else {
        setDoc(
          gameRef,
          {
            gameEndedAt: new Date(),
            gameExited: user.id,
          },
          { merge: true }
        );
      }
    }
    
    resetStateVariables();
    navigate(redirectRoute);
  } else {
    window.location.replace(`/login?redirect=${redirectRoute}`);
  }
};

export const checkUserGameLimit = async (userId) => {
  const childrenCollection = collection(db, "children");
  const childRef = doc(childrenCollection, userId);
  const child = await getDoc(childRef);
  if (child.exists()) {
    const data = child.data();
    const totalGameCount = calculateGameCount(data, currentDateInDDMMYYYY);
    if (totalGameCount >= DAILY_LIMIT) {
      return true;
    }
  }
  return false;
};
