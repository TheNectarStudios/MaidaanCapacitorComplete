import { Timestamp } from "firebase/firestore";
import { getNonDefaultTenantIds } from "../GamesArena/utils";
import { getTenantDetails } from "../services/tenant";

export const PRIMARY_COLOR = "#CBF600";
export const SECONDARY_COLOR = "#3A3A3A";

export const PRACTICE_TOURNAMENT_ID = "test-quiz";

export const MAIN_GAME_TIMER = 100;
export const TRIAL_GAME_TIMER = 30;

export const FIRST_DEMO_GAME_TID = "T_NewUsers_Practice_Maps";

export const JAVA_BASE_URL = process.env.REACT_APP_JAVA_BASE_URL;

export const ONLINE_USERS_SHOW_LIMIT = 3;
export const GAME_HOUR_START_TIME = "18:55";
export const GAME_HOUR_END_TIME = "21:00";

export const BASE_URL = `${JAVA_BASE_URL}/quiz`;
export const DEMO_BASE_URL = `${JAVA_BASE_URL}/spell-bee-practice`;


export const gameTypes = ["memoryCards", "memoryCardsPro", "LogoQuiz", "oneOnOneQuiz", "connect4", "hangman", "englishMeaningsQuiz", "archery", "miniScrabble"];

export const gameNamesMap = {
  memoryCards: "Memory Cards",
  memoryCardsPro: "Memory Cards PRO",
  LogoQuiz: "Logo Wars",
  oneOnOneQuiz: "Mental Math",
  connect4: "Connect 4",
  hangman: "Hangman",
  englishMeaningsQuiz: "Word Wars",
  archery: "Balloon Pop",
  miniScrabble: "Mini Scrabble",
};

export const TANGRAM_SOLVING_BONUS = 4;
export const TANGRAM_TILELEFT_BONUS = {
  "MORETHAN50%": 6,
  "LESSTHAN50%": 4,
  "ZERO": 2,
}


export const GOOGLE_FORM_REGISTER_URL = "/register";
export const REGISTER_URL = "/register";

export const DEFAULT_WALLET_REWARD_POINTS = 10;
export const REFERRAL_REWARD_POINTS = 5;
export const WALLET_COLLECTION = "wallets";
export const WALLET_HISTORY_COLLECTION = 'wallet_history';
export const CHILDREN_COLLECTION = 'children';

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCQs24FrZDp6kx6Luf9oq5f5l7Tasw-O-c",
  authDomain: "maidaan-921e1.firebaseapp.com",
  databaseURL:
    "https://maidaan-921e1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maidaan-921e1",
  storageBucket: "maidaan-921e1.appspot.com",
  messagingSenderId: "1012992519476",
  appId: "1:1012992519476:web:b662e0d9bdb3e5f56a0961",
  measurementId: "G-YLDW0TTPQT",
};

export const GAME_FORMATS = {
  JUMBLE: "JUMBLE",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  QUIZ: "QUIZ",
  MCQ: "MCQ",
  AUDIOCLIP: "AUDIOCLIP",
  IMAGE_JUMBLED: "IMAGE_JUMBLED",
  FLASH_IMAGES: "FLASH_IMAGES",
  MEMORY_CARDS: "MEMORY_CARDS",
  MEMORY_CARDS_PRO: "MEMORY_CARDS_PRO",
  CODING_ALGOS: "CODING_ALGOS",
  PAPER_GRADING: "PAPER_GRADING",
  TANGRAM: "TANGRAM",
  GEO_LOCATOR: "GEO_LOCATOR",
  CATEGORIES: "CATEGORIES",
  MATCHING_COLUMNS: "MATCHING_COLUMNS",
};

export const NEW_FORMAT_TOURNAMENT_GAMES = [
  GAME_FORMATS.MEMORY_CARDS,
  GAME_FORMATS.MEMORY_CARDS_PRO,
  GAME_FORMATS.CODING_ALGOS,
  GAME_FORMATS.PAPER_GRADING,
  GAME_FORMATS.TANGRAM,
  GAME_FORMATS.GEO_LOCATOR,
  GAME_FORMATS.CATEGORIES,
  GAME_FORMATS.MATCHING_COLUMNS
];

export const KEYBOARD_TYPES_ENUM = {
  ALPHABETS: 'ALPHABETS',
  NUMERIC: 'NUMERIC',
  BINARY: 'BINARY',
  MCQ: 'MCQ'
}

export const NEW_FORMAT_TOURNAMENT_GAME_TRIAL_TIMER = {
  [GAME_FORMATS.MEMORY_CARDS]: 300,
  [GAME_FORMATS.MEMORY_CARDS_PRO]: 300,
  [GAME_FORMATS.CODING_ALGOS]: 100,
  [GAME_FORMATS.PAPER_GRADING]: 100,
  [GAME_FORMATS.TANGRAM]: 180,
  [GAME_FORMATS.GEO_LOCATOR]: 30,
  [GAME_FORMATS.CATEGORIES]: 100,
  [GAME_FORMATS.MATCHING_COLUMNS]: 30,
};

export const NEW_FORMAT_MAX_ATTEMPTS_LIMIT = {
  [GAME_FORMATS.MEMORY_CARDS]: 30,
  [GAME_FORMATS.MEMORY_CARDS_PRO]: 40,
  [GAME_FORMATS.CODING_ALGOS]: 50,
  [GAME_FORMATS.PAPER_GRADING]: 50,
};

export const NEW_FORMAT_PLAYING_BONUS = {
  [GAME_FORMATS.MEMORY_CARDS]: 3,
  [GAME_FORMATS.MEMORY_CARDS_PRO]: 3,
  [GAME_FORMATS.CODING_ALGOS]: 5,
  [GAME_FORMATS.PAPER_GRADING]: 5,
}

export const MEMORY_CARDS_COMPLETION_CORRECT_ANSWERS = {
  [GAME_FORMATS.MEMORY_CARDS]: 8,
  [GAME_FORMATS.MEMORY_CARDS_PRO]: 12,
  [GAME_FORMATS.CODING_ALGOS]: 3,
  [GAME_FORMATS.PAPER_GRADING]: 3,
}

export const NEW_FORMAT_TOURNAMENT_GAME_TIMER = {
  [GAME_FORMATS.MEMORY_CARDS]: 300,
  [GAME_FORMATS.MEMORY_CARDS_PRO]: 300,
  [GAME_FORMATS.CODING_ALGOS]: 100,
  [GAME_FORMATS.PAPER_GRADING]: 100,
  [GAME_FORMATS.TANGRAM]: 180,
  [GAME_FORMATS.GEO_LOCATOR]: 20,
  [GAME_FORMATS.CATEGORIES]: 100,
  [GAME_FORMATS.MATCHING_COLUMNS]: 30,
};

export const KEYBOARD_TYPES = {
  ALPHABETS: [
    "Q W E R T Y U I O P",
    "A S D F G H J K L",
    "{space} Z X C V B N M {bksp}"
  ],
  NUMERIC: ["1 2 3 + - (", "4 5 6 x ÷ )", "7 8 9 0 . {bksp}"],
  BINARY: ["Right Wrong"],
};

export const ASSERTION_LOGIC = {
  CTA: "CTA",
  CTQ: "CTQ",
  CTH: "CTH",
};

export const GAME_FORMAT_IMAGE_MAP = {
  [`${GAME_FORMATS.AUDIO}-${KEYBOARD_TYPES_ENUM.ALPHABETS}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Faud-alph.JPG?alt=media&token=803e4590-060e-49e0-8db3-10a4db6b9d69',
  [`${GAME_FORMATS.AUDIO}-${KEYBOARD_TYPES_ENUM.MCQ}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Faud-mcq.JPG?alt=media&token=f1bb38eb-7b72-4453-9e66-bc8572328e09',
  [`${GAME_FORMATS.AUDIO}-${KEYBOARD_TYPES_ENUM.NUMERIC}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Faud-quiz.JPG?alt=media&token=175abcf3-bc62-4369-a4c2-489cd0e98c8a',
  [`${GAME_FORMATS.IMAGE}-${KEYBOARD_TYPES_ENUM.ALPHABETS}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fimg-alph.JPG?alt=media&token=23ab7e0a-8222-41d0-84e2-e3b2ed2841e2',
  [`${GAME_FORMATS.IMAGE}-${KEYBOARD_TYPES_ENUM.MCQ}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fimg-mcq.JPG?alt=media&token=a0104bdc-b665-40b6-9dcd-76fd323593d7',
  [`${GAME_FORMATS.IMAGE}-${KEYBOARD_TYPES_ENUM.NUMERIC}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fimg-num.JPG?alt=media&token=49670b6a-88bf-4962-9ad9-9220e3ac56c1',
  [`${GAME_FORMATS.JUMBLE}-${KEYBOARD_TYPES_ENUM.ALPHABETS}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fjumb-alph.JPG?alt=media&token=743327b0-7614-4a93-9f33-31cdcb2eaeb1',
  [`${GAME_FORMATS.JUMBLE}-${KEYBOARD_TYPES_ENUM.MCQ}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fjumb-mcq.JPG?alt=media&token=b300b6c3-929a-4ddb-a0b2-1903947464a7',
  [`${GAME_FORMATS.JUMBLE}-${KEYBOARD_TYPES_ENUM.NUMERIC}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fjumb-num.JPG?alt=media&token=987ef781-5de5-4d56-bf20-519781a909b4',
  [`${GAME_FORMATS.QUIZ}-${KEYBOARD_TYPES_ENUM.ALPHABETS}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fquiz-alph.JPG?alt=media&token=c0cdff50-1720-403b-b183-9c1c70944b64',
  [`${GAME_FORMATS.QUIZ}-${KEYBOARD_TYPES_ENUM.MCQ}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fquiz-mcq.JPG?alt=media&token=9e0e83e4-9580-415d-b2a4-ff3bab84ef78',
  [`${GAME_FORMATS.QUIZ}-${KEYBOARD_TYPES_ENUM.NUMERIC}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fquiz-num.JPG?alt=media&token=9d20b841-4470-4411-8604-1b5c66c8f942',
  [`${GAME_FORMATS.IMAGE_JUMBLED}-${KEYBOARD_TYPES_ENUM.ALPHABETS}`]: 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/trialPage_Images%2Fimgjumb-alpha.JPG?alt=media&token=5cdccdb8-90e5-47fc-b876-ae26cd7fb4cd',
}

export const TRIAL_GAME_STRING = "trailGame";
export const FULL_GAME_STRING = "fullGame";

export const SCHOOL_USER_FOR_TOURNAMENT = "SCHOOL";
export const OPEN_USER_FOR_TOURNAMENT = "OPEN";

export const getJumbledWord = (str) => {
  if (str.length < 3) return { wordFormated: str, word: str };
  const firstLetter = str[0];
  const lastLetter = str[str.length - 1];

  const fixLast = str.length > 5 ? true : false;
  const lastIdx = fixLast ? str.length - 2 : str.length - 1;
  const stringToJumble = str.substr(1, lastIdx);
  let newArr;
  let jumbleUp = true;
  while (jumbleUp) {
    newArr = [];
    let neww = "";
    const text = stringToJumble
      .replace(/[\r\n]/g, "")
      .trim()
      .split(" ");

    text.map((v) => {
      v.split("").map(() => {
        const hash = Math.floor(Math.random() * v.length);
        neww += v[hash];
        v = v.replace(v.charAt(hash), "");
      });
      newArr.push(neww);
      neww = "";
    });
    newArr.unshift(firstLetter);
    let a = fixLast ? newArr.push(lastLetter) : null;

    jumbleUp = str !== newArr.join("") ? false : true;
  }

  const word = newArr.join("");
  const wordFormated = word;
  return { wordFormated, word };
};


export const formatTime = (date) => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours < 12 ? "AM" : "PM";
  hours %= 12;
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutes} ${ampm}`;
};

export const getDateDetails = (date) => {
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = formatTime(date);
  const dayName = date.toLocaleString("default", { weekday: "short" });
  return { month, day, year, time, dayName };
};

export const getDatefromFirebaseTimeStamp = (timestamp) => {
  let startSeconds, startNanoseconds;

  if (!isNaN(timestamp._seconds) && !isNaN(timestamp._nanoseconds)) {
    startSeconds = timestamp._seconds;
    startNanoseconds = timestamp._nanoseconds;
  } else if (!isNaN(timestamp.seconds) && !isNaN(timestamp.nanoseconds)) {
    startSeconds = timestamp.seconds;
    startNanoseconds = timestamp.nanoseconds;
  } else {
    return null;
  }
  const firebaseTimestamp = new Timestamp(startSeconds, startNanoseconds);
  return firebaseTimestamp.toDate();
};

export const getDateStringFromFirebaseTimestamp = (startDate, endDate) => {
  const startDateObj = getDatefromFirebaseTimeStamp(startDate);
  const endDateObj = getDatefromFirebaseTimeStamp(endDate);
  const {
    day: startDay,
    month: startMonth,
    year: startYear,
    time: startTime,
  } = getDateDetails(startDateObj);
  const {
    day: endDay,
    month: endMonth,
    year: endYear,
    time: endTime,
  } = getDateDetails(endDateObj);
  if (startMonth === endMonth && startDay === endDay && startYear === endYear) {
    return `${startDay} ${startMonth} ${startYear} - ${endTime}`;
  }
  return `${startDay} ${startMonth} ${startYear}, ${startTime} - ${endDay} ${endMonth} ${endYear}, ${endTime}`;
};

export const getDateObject = (date) => {
  const dateObject = getDatefromFirebaseTimeStamp(date);
  const dateDetails = getDateDetails(dateObject);
  return dateDetails;
};

export const DEFAULT_POSIIVE_SCORE = 1;
export const DEFAULT_NEGATIVE_SCORE = 0;

export const POSITIVE_SCORE_LS_KEY = "_ps";
export const NEGATIVE_SCORE_LS_KEY = "_ns";
export const ENABLE_SKIP_LS_KEY = "_enSk";

export const demoGameSettings = {
  roundFormat: "QUIZ",
  demoCollection: "eng_VocabFormatTest",
  demoKeyboardType: "ALPHABETS",
  demoAssertion: "CTA",
  demoRoundTitle: "Quiz Test Round",
  demoPositiveScore: 1,
  demoNegativeScore: 0,
  demoEnableSkip: false,
}

export const GRADE_OPTIONS = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "5th" },
  { value: "6", label: "6th" },
  { value: "7", label: "7th" },
  { value: "8", label: "8th" },
  { value: "9", label: "9th" },
  { value: "10", label: "10th" },
  { value: "11", label: "11th" },
  { value: "12", label: "12th" }
];

export const shareOnWhatsapp = async (data) => {
  try {
    if (navigator.canShare && (!data.files || (data.files && navigator.canShare({ files: data.files })))) {
      await navigator.share(data);
      return;
    }
    window.alert("can't share over whatsapp");
  } catch (err) {
    console.error(err);
  }
};

export const addAndToLastItem = (items) => {
  if (items.length === 1) return items[0];
  const lastItem = items.pop();
  return `${items.join(",")} and ${lastItem}`;
};

export const UPCOMING_TOURNAMENT_BANNER =
  "https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FDemo%20Lobby%20Jun%2024.png?alt=media&token=8e06c6b3-dee1-4e54-9d4e-620f77da9682";

export const GAME_ARENA_BANNER = "https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FGaming%20Arena%20Primary.png?alt=media&token=c7457d54-f0a8-4d59-9cc4-e8bc041835fd";

export const DEFAULT_TENANT_ID = "maidaan";

export const getWhatsappMessageForInvite = (registerUrl) => {
  const bodyText = `Hey hey!\n\nI'm a member of this *super-fun club called Maidaan.*\n\nWant to join me here in battling others across India in fun quiz *tournaments* for a *merit rank* and *exciting awards*?\n\nAccept my Invite: ${registerUrl}.\n\n- Play on mobile from home.\n- Only 10 mins needed on Sat & Sun.\n\nJoin students from 100+ Schools & 20+ Cities in a super-encouraging & thrilling environment for discovering your talents.\n\nQueries: 8618006284`;
  return {
    title: "",
    text: bodyText,
  };
};

export const extractMonthlyEarnings = (earnings) => {
  const jsDate = new Date();
  const currentYear = jsDate.getFullYear();
  const currentMonthName = jsDate
    .toLocaleString("default", { month: "long" })
    .toLowerCase();
  const currentMonthsTotalPoints =
    earnings?.[currentYear]?.[currentMonthName] ?? 0;
  return currentMonthsTotalPoints;
};

export const sortTournamentsByOrder = (tournaments) => {
  const sortedTour = tournaments.sort((a, b) => {
    if (a.order && b.order) {
      return a.order - b.order;
    } else if (a.order) {
      return -1;
    } else if (b.order) {
      return 1;
    } else {
      return 0;
    }
  });
  return sortedTour;
};

export const filterTournamentsByTenantId = (tournaments, user, tenantId) => {
  if (tenantId === DEFAULT_TENANT_ID) {
    return tournaments.filter(
      (t) => getUserTournamentRegistrationType(user, t.tenantIds) === OPEN_USER_FOR_TOURNAMENT
    );
  }
  return tournaments.filter((t) => getUserTournamentRegistrationType(user, t.tenantIds) === SCHOOL_USER_FOR_TOURNAMENT);
}

export const getUserTournamentRegistrationType = async (user, tournamentTenantIds) => {

  //check for school case..
  const userTenantStatus = user?.tenantStatus;

  const userTenantIds = user?.tenantIds;
  const nonDefaultTenantIds = getNonDefaultTenantIds(user?.tenantIds);
  if (nonDefaultTenantIds && nonDefaultTenantIds.length > 0 && tournamentTenantIds && tournamentTenantIds.length > 0) {
    //if tournamentTenantIds contain atleast one of the userTenantIds then return school
    if (nonDefaultTenantIds?.some(tenantId => tournamentTenantIds?.includes(tenantId)) && userTenantStatus !== "OPEN") {
      return SCHOOL_USER_FOR_TOURNAMENT;
    }
  }
  //check for open case
  if (userTenantIds?.includes(DEFAULT_TENANT_ID) || userTenantStatus === "OPEN") {
    //check if the tournamentTenantIds contain maidaan or tournamentTenantIds does not exist then return maidaan
    if ((tournamentTenantIds?.includes(DEFAULT_TENANT_ID)) || (!tournamentTenantIds || tournamentTenantIds?.length === 0)) {
      return OPEN_USER_FOR_TOURNAMENT;
    }
  }

  return "OTHER";
}

export const getUserTenantStatus = async (user) => {
  //return consider as open or tenant;

  const nonDefaultTenantIds = getNonDefaultTenantIds(user?.tenantIds);
  if (nonDefaultTenantIds && nonDefaultTenantIds.length > 0) {
    const { currentSubscription, grade } = user;
    const nonDefaultTenantId = nonDefaultTenantIds[0];
    const tenantDetails = await getTenantDetails(nonDefaultTenantId);
    const { status } = tenantDetails;
    const gradeStatus = tenantDetails?.[grade];
    if (gradeStatus === "OPEN") {
      return "OPEN";
    }
    if (status === "CONVERTED_PAYTHROUGHSCHOOL" || status === "CONVERTED_PAYDIRECT") {
      //check user subscription status;
      if (LONG_TERM_SCHOOL_PLAN_LIST.includes(currentSubscription?.plan)) {
        return "TENANT";
      }
      else {
        return "TENANT_UNPAID";
      }
    }
    return "TENANT";
  }
  else {
    return "OPEN";
  }

}

export const getNumberWithOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const ALLOWED_ATTEMPTS_PER_ROUND = 50;

export const DISCOUNT_REWARD_COINS_PERCENTAGE = 0;

export const getCoinsAfterDiscount = (coins) => {
  return Math.ceil(
    coins - (coins * DISCOUNT_REWARD_COINS_PERCENTAGE) / 100
  );
}

export const isTournamentStartingIn24Hours = (tournamentStartDateInSeconds) => {
  // Get the current date and time in seconds since the Unix epoch
  const currentUnixTimeInSeconds = Math.floor(Date.now() / 1000);

  // Calculate the difference in seconds between the tournament start date and the current date
  const timeDifferenceInSeconds =
    tournamentStartDateInSeconds - currentUnixTimeInSeconds;

  // Calculate the number of hours left until the tournament starts
  const hoursUntilStart = timeDifferenceInSeconds / 3600;

  // Check if the tournament is starting in the next 24 hours
  return hoursUntilStart <= 24 && hoursUntilStart >= 0;
}

export const TOURNAMENT_TYPE = {
  ELIMINATOR: 'elimination_final',
}

export const FREE_USER_PLAN = "FREE";
export const NEW_USER_PLAN = "NEW";
export const SUPER_1TOURNAMENT_PLAN = "SUPER_1TOURNAMENT";
export const PREMIER_1TOURNAMENT_PLAN = "PREMIER_1TOURNAMENT";
export const PREMIER_3MONTHS_PLAN = "PREMIER_3MONTHS";
export const PREMIER_12MONTHS_PLAN = "PREMIER_12MONTHS";
export const SUPER_3MONTHS_PLAN = "SUPER_3MONTHS";
export const SUPER_12MONTHS_PLAN = "SUPER_12MONTHS";
export const SCHOOL_12MONTHS_PLAN = "SCHOOL_12MONTHS";
export const SCHOOL_6MONTHS_PLAN = "SCHOOL_6MONTHS";

export const TOURNAMENTS_1 = "TOURNAMENTS_1"
export const TOURNAMENTS_3 = "TOURNAMENTS_3"
export const TOURNAMENTS_4 = "TOURNAMENTS_4"
export const TOURNAMENTS_6 = "TOURNAMENTS_6"
export const TOURNAMENTS_8 = "TOURNAMENTS_8"
export const TOURNAMENTS_12 = "TOURNAMENTS_12"
export const TOURNAMENTS_20 = "TOURNAMENTS_20"




export const FREE_TIER_LIST = [FREE_USER_PLAN, NEW_USER_PLAN];

export const PREMIER_TIER_LIST = [
  PREMIER_1TOURNAMENT_PLAN,
  PREMIER_3MONTHS_PLAN,
  PREMIER_12MONTHS_PLAN,
];

export const LONG_TERM_PLAN_LIST = [
  PREMIER_12MONTHS_PLAN,
  PREMIER_3MONTHS_PLAN,
  SUPER_12MONTHS_PLAN,
  SUPER_3MONTHS_PLAN,
];

export const LONG_TERM_SCHOOL_PLAN_LIST = [
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

//per tournament tiers to distinguish users..
export const FREE_USER_TOURNAMENT_TIER = "FREE";
export const PREMIER_USER_TOURNAMENT_TIER = "PREMIUM";
export const SUPER_USER_TOURNAMENT_TIER = "BASE";
export const UNREGISTERED_USER_TOURNAMENT_TIER = "UNREGISTERED";

export const getDateStringForTournament = (startDate, endDate) => {
  let dateString = "";
  const sDate = startDate.getDate();
  const eDate = endDate.getDate();
  const sMonth = startDate.toLocaleString("en-us", { month: "short" });
  const eMonth = endDate.toLocaleString("en-us", { month: "short" });
  // if month is not same then show month name for both dates else only for end date
  dateString =
    startDate.getMonth() !== endDate.getMonth()
      ? `${sDate} ${sMonth} - ${eDate} ${eMonth}`
      : `${sDate} - ${eDate} ${eMonth}`;
  return dateString;
};

export const getDateStringFromStartEndDates = (TournamentStartDate, TournamentEndDate, tournamentHeader = "") => {

  let dateString = '';

  if (TournamentStartDate && TournamentEndDate && tournamentHeader !== "Play Your First Game") {
    const startDate = getDatefromFirebaseTimeStamp(TournamentStartDate);
    const endDate = getDatefromFirebaseTimeStamp(TournamentEndDate);

    if (startDate && endDate) {
      dateString = getDateStringForTournament(startDate, endDate);
    }
  }
  return dateString;
}

export const getTournamentDaysToGo = (startDate) => {
  const numberOfDaysToGo = Math.ceil(
    (startDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  return numberOfDaysToGo;
};

export const calculateGSTDisCountedAndPrincipal = (finalAmount, gstPercentage, amount) => {
  // Convert GST percentage to decimal
  const gstRate = gstPercentage / 100;
  // Calculate GST amount

  const gstAmount = finalAmount - finalAmount / (1 + gstRate);

  // Calculate discounted amount

  const discountAmount = finalAmount - gstAmount;

  const principalAmount = amount / (1 + gstRate);

  return {
    gstAmount: gstAmount.toFixed(0), // Round to 2 decimal places
    principalAmount: principalAmount.toFixed(0), // Round to 2 decimal places
    discountAmount: discountAmount.toFixed(0), // Round to 2 decimal places
  };
}

export const calculateGSTAndPrincipal = (finalAmount, gstPercentage) => {
  // Convert GST percentage to decimal
  const gstRate = gstPercentage / 100;

  // Calculate GST amount
  const gstAmount = finalAmount - finalAmount / (1 + gstRate);

  // Calculate Principal amount
  const principalAmount = finalAmount - gstAmount;

  return {
    gstAmount: gstAmount.toFixed(0), // Round to 2 decimal places
    principalAmount: principalAmount.toFixed(0), // Round to 2 decimal places
  };
}

export const backButtonHandler = (navigate, location) => {
  const history = window.history;
  if (
    history.length === 1 ||
    history.state === null ||
    location?.state?.from === "login"
  ) {
    navigate("/lobby");
    return;
  }
  navigate(-1);
};

export const NEW_FORMAT_TOURNAMENT_HEADERS_CONFIG = {
  [GAME_FORMATS.CODING_ALGOS]: [
    "SCORE",
    "PROBLEMS FACED",
    "TOTAL BONUS",
    "STEPS BONUS",
    "ACCURACY BONUS",
  ],
  [GAME_FORMATS.GEO_LOCATOR]: [
    "SCORE",
    "< 50 KMS",
    "50-100 KMS",
    "100-200 KMS",
    "200-500 KMS"
  ],
  [GAME_FORMATS.MEMORY_CARDS]: [
    "SCORE",
    "MATCHES FOUND",
    "TOTAL BONUS",
    "COMPLETION BONUS",
    "MOVES BONUS"
  ],
  [GAME_FORMATS.MEMORY_CARDS_PRO]: [
    "SCORE",
    "MATCHES FOUND",
    "TOTAL BONUS",
    "COMPLETION BONUS",
    "MOVES BONUS"
  ],
  [GAME_FORMATS.TANGRAM]: [
    "SCORE",
    "PUZZLES SOLVE",
    "COMPLETION BONUS",
    "PUZZLES FACED",
    "TIME BONUS"
  ],
  [GAME_FORMATS.CATEGORIES]: [
    "SCORE",
    "PUZZLES SOLVED",
    "ACCURACY",
    "GROUPS FOUND",
    "ATTEMPTS"
  ],
  [GAME_FORMATS.MATCHING_COLUMNS]: [
    "SCORE",
    "QUESTIONS SOLVED",
    "ACCURACY",
    "CORRECT MATCHES",
    "ATTEMPTS"
  ],
  ["DEFAULT"]: [
    "SCORE",
    "CORRECT",
    "PACE",
    "ATTEMPTS",
    "ACCURACY"
  ]
};

export const HIDE_SKIP_TRIAL_FORMATS = [GAME_FORMATS.CODING_ALGOS, GAME_FORMATS.GEO_LOCATOR, GAME_FORMATS.PAPER_GRADING, GAME_FORMATS.CATEGORIES, GAME_FORMATS.MATCHING_COLUMNS];

const PATHS_TO_IGNORE = ["/", "/about-Us"];
const PATHS_TO_IGNORE_HEIGHT = ["/login?d=Y"];

export const calculateAppHeight = () => {
  const path = window.location.pathname + window.location.search;
  const doc = document.documentElement;
  const height = `${window.innerHeight}px`;
  doc.style.setProperty("--app-height", height);
  if (
    window.innerWidth > window.innerHeight &&
    window.innerWidth > 768 &&
    window.innerHeight < 700 &&
    PATHS_TO_IGNORE_HEIGHT.includes(path)
  ) {
    const bodyElem = document.body;
    bodyElem.style.removeProperty("height");
    doc.style.removeProperty("height");
  } else if (!PATHS_TO_IGNORE.includes(path)) {
    const bodyElem = document.body;
    const rootElem = document.getElementById("root");
    doc.style.height = height;
    bodyElem.style.height = height;
    rootElem.style.height = "100%";
  }
};

export const DEMO_REGISTRATION_TOURNAMENTS = ["Demo_Pitch_A", "Demo_Pitch_Final", "NewUser_Apr24_Personalities_G67", "NewUser_Apr24_Maps_G67", "NewUser_Apr24_Maths_G89", "NewUser_Apr24_Logic_G89"];
export const getDemoFlowData = () => {
  const demoData = {
    lastName: "",
    createdAt: new Date(),
    currentSubscription: {
      plan: "FREE",
    },
    tenantIds: ["maidaan"],
    grade: 6,
    registrations: DEMO_REGISTRATION_TOURNAMENTS,
  }
  return demoData;
}

export const getDemoRoundOneData = () => {
  const demoData = {
    "attempts": 12,
    "responses": [
      "order",
      "ready",
      "dance",
      "hungry",
      "shiny",
      "fullfill",
      "narrow",
      "supply",
      "defination",
      "argument",
      "blanket",
      "absent"
    ],
    "correctAttempts": 10,
    "sentWords": [
      "Co19XrvlzmxveEQhO0KW",
      "zfggG2Naejx61rJi845o",
      "5G6H7vwddnJl3tyK1OdB",
      "01MF1BAi8g57MEP58cOB",
      "TD8IARidi5btdb7XdMgG",
      "xil8p1VylwtIt84KDcR5",
      "dM6dhc7KKKS6wC7A74N9",
      "jTUv8QXdxykgoRSwakML",
      "epflTR5V6GNjxVfI2ueF",
      "wfOBnc10xQPpeXvNsLyd",
      "B7tuSfTTzStxsAzVYiDG",
      "b0qFL9Ct12jayH4UN9gR",
      "dKZDaB4VCsu9uIuQR1id",
      "tPeQI9ZxcBBKXQNLz8mo",
      "wanoDcnqnEepienKgscH",
      "HNl6aLR9rjop4wdb0igW",
      "lGWhg9Hbaz8iMRxStT75"
    ],
    "round": "1",
    "initTime": {
      "seconds": 1720195497,
      "nanoseconds": 562000000
    },
    "jumbledString": [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "sentWordsDifficulty": [
      "4,",
      "6,4,4,6,6,4,4,6,6,4,4,6,"
    ],
    "format": "IMAGE",
    "score": 10,
    "endTime": {
      "seconds": 1720195675,
      "nanoseconds": 183000000
    },
    "tournamentId": "Demo_Pitch_A",
    "results": [
      true,
      true,
      true,
      true,
      true,
      false,
      true,
      true,
      false,
      true,
      true,
      true
    ],
    "startTime": {
      "seconds": 1720195571,
      "nanoseconds": 216000000
    },
    "attemptedWords": [
      "{ \"question\":\"Which of these words is correctly spelled?\",\"answer\":\"Order\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F219.jpg?alt=media&token=b585a92f-448e-4651-9f3e-d2756fe7e13f\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Identify the correct spelling.\",\"answer\":\"Ready\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F227.jpg?alt=media&token=a8d111ef-811d-4249-b8c3-8cd1015fdde1\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Identify the correct spelling.\",\"answer\":\"Dance\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F194.jpg?alt=media&token=caf2c644-ebb5-4a61-9d30-69c50347f1fd\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Which of these words is correctly spelled?\",\"answer\":\"Hungry\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F209.jpg?alt=media&token=fbded198-1ab4-4a9c-b4c9-8254c56a3a1b\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Choose the correct spelling.\",\"answer\":\"Shiny\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F231.jpg?alt=media&token=15fe9402-e81d-4af8-8f5d-211c9a68a6a3\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Identify the accurately spelled word.\",\"answer\":\"Fulfill\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F026.jpg?alt=media&token=c4e7f5fe-0a42-47bd-8db2-8fd3988436bb\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Choose the correctly spelled word.\",\"answer\":\"Narrow\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F216.jpg?alt=media&token=058a015e-c637-4353-8837-47a0a7a42aaf\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Identify the correct spelling.\",\"answer\":\"Supply\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F237.jpg?alt=media&token=8800f39e-505b-4972-bc7c-fc425c2a7b88\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Which of these is the correct spelling?\",\"answer\":\"Definition\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F002.jpg?alt=media&token=fb1dee19-ef58-4414-a8e2-14ef8a771998\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Choose the correct spelling.\",\"answer\":\"Argument\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F015.jpg?alt=media&token=3f0c7645-fcb2-46a8-b4c4-f242c6b28df2\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Select the correctly spelled word.\",\"answer\":\"Blanket\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F184.jpg?alt=media&token=f9c082c8-1075-44e7-a08f-cd4954113840\",\"audioClip\":\"null\"}",
      "{ \"question\":\"Identify the correct spelling\",\"answer\":\"Absent\",\"hint\":\"\",\"solution\":\"\",\"imageUrl\":\"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Eng_Literature_Images%2FEng_identifyCorrectSpelling%2F181.jpg?alt=media&token=749abc93-44cf-417f-86e4-d1c147ed76e3\",\"audioClip\":\"null\"}"
    ],
    "latencyInMs": 0
  }
  return demoData;
}

export const PRE_REGISTERED_USER_NUMBERS = ["+9110001"];
