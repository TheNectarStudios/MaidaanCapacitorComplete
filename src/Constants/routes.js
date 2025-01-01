export const ARENA_ROUTE = "/arena";
export const MEMORY_CARDS_ROUTE = `${ARENA_ROUTE}/memory-cards`;
export const MEMORY_CARDS_PRO_ROUTE = `${ARENA_ROUTE}/memory-cards?game=pro`;
export const QUIZ_GAME_ROUTE = `${ARENA_ROUTE}/quiz-game`;
export const MENTAL_MATH_ROUTE = `${ARENA_ROUTE}/quiz-game?name=mental-math`;
export const ENGLISH_MEANIGS_QUIZ_ROUTE = `${ARENA_ROUTE}/quiz-game?name=english-meanings-quiz`;
export const LOGO_QUIZ_ROUTE = `${ARENA_ROUTE}/quiz-game?name=logo-quiz`;
export const ARENA_LEADERBOARD_ROUTE = `${ARENA_ROUTE}/leaderboard`;
export const ARENA_GAMES_ROUTE = `${ARENA_ROUTE}/all-games`;
export const CONNECT_4_ROUTE = `${ARENA_ROUTE}/connect-4`;
export const HANGMAN_ROUTE = `${ARENA_ROUTE}/hangman`;
export const LOBBY_ROUTE = "/lobby";
export const QUIZ_ROUTE = "/quiz";
export const ARCHERY_ROUTE = `${ARENA_ROUTE}/archery`;
export const MINI_SCRABBLE_ROUTE = `${ARENA_ROUTE}/mini-scrabble`;

export const TOURNAMENT_OPT_IN_ROUTE = "/tournament-opt-in";
export const CHECKOUT_ROUTE = "/checkout";
export const TOURNAMENT_SELECT_ROUTE = "/tournament/select";

export const PAYMENT_REDIRECT_ROUTE = "/payment/redirect";
export const YOUR_PLAN_ROUTE = "/your-plan";
export const CERTIFICATES_ROUTE = "/certificates";
export const ORDERS_ROUTE = "/orders";

export const UPDATE_SCHOOL_DETAILS_ROUTE = "/update-details";

export const CLASS_JAM_ROUTE = "/class-jam";

export const NON_DEMO_WIDE_SCREEN_ROUTES = [
  "/questionoftheday",
  // "/lobby-demo"
];


export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/enter-phone",
  "arena",
  "/arena/memory-cards",
  "/arena/quiz-game",
  "/arena/all-games",
  CONNECT_4_ROUTE,
  HANGMAN_ROUTE,
  ARCHERY_ROUTE,
  MEMORY_CARDS_PRO_ROUTE,
  MINI_SCRABBLE_ROUTE,
  "/payment-phonenumber",
  "/payment/verify",
  "/payment/redirect",
];

export const ARENA_ROUTES = [
  ARENA_ROUTE,
  MEMORY_CARDS_ROUTE,
  QUIZ_GAME_ROUTE,
  MENTAL_MATH_ROUTE,
  ENGLISH_MEANIGS_QUIZ_ROUTE,
  LOGO_QUIZ_ROUTE,
  ARENA_GAMES_ROUTE,
  CONNECT_4_ROUTE,
  HANGMAN_ROUTE,
  ARCHERY_ROUTE,
  MEMORY_CARDS_PRO_ROUTE,
  MINI_SCRABBLE_ROUTE,
];  

export const INGAME_ROUTES = [
  MEMORY_CARDS_ROUTE,
  QUIZ_GAME_ROUTE,
  MENTAL_MATH_ROUTE,
  ENGLISH_MEANIGS_QUIZ_ROUTE,
  LOGO_QUIZ_ROUTE,
  CONNECT_4_ROUTE,
  HANGMAN_ROUTE,
  QUIZ_ROUTE,
  ARCHERY_ROUTE,
  MEMORY_CARDS_PRO_ROUTE,
  MINI_SCRABBLE_ROUTE,
];
