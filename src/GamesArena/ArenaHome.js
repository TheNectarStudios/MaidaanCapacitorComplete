import { useNavigate } from "react-router-dom";
import BackButton from "../Components/Common/BackButton";
import Layout from "../Components/Common/Layout";
import { motion } from "framer-motion";
import { collection, addDoc, onSnapshot, doc, getDocs, setDoc, FieldPath, query, where, runTransaction } from "firebase/firestore";
import { db, database } from "../firebase-config";
import { MEMORY_CARDS_ROUTE, QUIZ_GAME_ROUTE, MENTAL_MATH_ROUTE, LOGO_QUIZ_ROUTE, ARENA_LEADERBOARD_ROUTE, ARENA_GAMES_ROUTE, CONNECT_4_ROUTE, HANGMAN_ROUTE, ENGLISH_MEANIGS_QUIZ_ROUTE, MEMORY_CARDS_PRO_ROUTE, ARCHERY_ROUTE, MINI_SCRABBLE_ROUTE } from "../Constants/routes";
import { DAILY_LIMIT } from "../Constants/GamesArena/MemoryCards";
import { DEFAULT_TENANT_ID, GAME_HOUR_END_TIME, GAME_HOUR_START_TIME, ONLINE_USERS_SHOW_LIMIT, INTERNAL_TENANT_ID } from "../Constants/Commons";
import { checkGameHour } from "../services/child";
import { useAuth } from "../providers/auth-provider";
import { useEffect, useMemo, useRef, useState } from "react";
import ArenaHeader from "../GamesArena/Common/ArenaHeader.js";
import { ref, get } from "firebase/database";
import { startGameandNavigate, getQuizNotPlayedByBothPlayers, getHangmanQuizNotPlayedByBothPlayers } from "../GamesArena/Common/MatchMaking";
import { ReactComponent as HelpSvg } from "../assets/icons/helpWhite.svg";
// import AnimatedNumber from "animated-number-react";
import AnimatedNumber from "react-awesome-animated-number";
import { calculateGameCount, daysOfWeek, getDateOfAllDaysFromMondayToSunday, getDateOfMonday, getDateOfMondayWithUnderscore, getGameConfig, getWeeklyArenaTournamentLeaderboard, sortDataPerRankOrPoints, validateAndFormatDate, checkUserGameLimit, getUrlByGameType, getNonDefaultTenantIds } from "./utils";
import { twMerge } from "tailwind-merge";
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import ThunderIcon from "./Common/Icons/ThunderIcon";
import SecondPlaceProfileIcon from "./Common/Icons/SecondPlaceProfileIcon";
import Loader from "../Components/PageComponents/GameLoader";
import TrophyIcon from "./Common/Icons/TrophyIcon";
import ThunderIconCircular from "./Common/Icons/ThunderIconCircular";
import AppButton from "../Components/Common/AppButton";
import FirstPlaceProfileIcon from "./Common/Icons/FirstPlaceProfileIcon";
import ThirdPlaceProfileIcon from "./Common/Icons/ThirdPlaceProfileIcon";
import NextTargetProfileIcon from "./Common/Icons/NextTargetProfileIcon";
import NonPodiumProfileIcon from "./Common/Icons/NonPodiumProfileIcon";
import RenderStreakInfo from "./Common/PlayerStreak";
import { Dialog } from "@mui/material";
import axios from "axios";
import GameLoader from "../Components/PageComponents/GameLoader";
import mixpanel from 'mixpanel-browser';
import { ReportSharp } from "@mui/icons-material";
import useToast from "../hooks/use-toast.js";
import { MEASURE } from "../instrumentation";
import { useSearchParams } from "react-router-dom";
import { INSTRUMENTATION_TYPES } from "../instrumentation/types";

import { gameTypes,gameNamesMap } from "../Constants/Commons";
import { BottomNavBar } from "../Components/Games/SpellBee/NewLobby";
import MemoryCards from "./MemoryCards";
import { render } from "@testing-library/react";
import { returnEncryptedUserId } from "../Components/utils";

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");
const mondayToSundayDates = getDateOfAllDaysFromMondayToSunday();

const ArenaHome = () => {
  const navigate = useNavigate();
  const { user, getUserDetails } = useAuth();
  const { ToastComponent, showToast } = useToast();
  const [leaderboardData, setLeaderboardData] = useState(null);
  // const [myPlayerData, setMyPlayerData] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [isGameHour, setIsGameHour] = useState(true);
  const [progressDialouge, setProgressDialouge] = useState(false);
  const [openMatchesList, setOpenMatchesList] = useState([]);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [showGameSelectionPopup, setShowGameSelectionPopup] = useState(false);
  const [computerGameMessage, setComputerGameMessage] = useState("");
  const [challengeData, setChallengeData] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeExpired, setChallengeExpired] = useState(false);
  const [disableAllTiles, setDisableAllTiles] = useState(false);
  const [challengeButtonLoading, setChallengeButtonLoading] = useState(false);
  const [disableOtherGames, setDisableOtherGames] = useState(false);
  const [acceptButtonLoading, setAcceptButtonLoading] = useState(false);
  const gameHourRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const invite = searchParams.get("invite");
  const userTenantIds = getNonDefaultTenantIds(user?.tenantIds);

  //const gameTypes = ["memoryCards", "LogoQuiz", "oneOnOneQuiz", "connect4"];

  useEffect(() => {
    const func = async () => {
      getUserDetails();
      const mondayDate = getDateOfMondayWithUnderscore();
      const config = await getGameConfig(mondayDate);
      const leaderboardData = await getWeeklyArenaTournamentLeaderboard(
        mondayDate
      );
      const sortedData = sortDataPerRankOrPoints(leaderboardData, config);
      // const myData = sortedData.find((obj) => obj.id === user?.id);
      setLeaderboardData(sortedData);
      // setMyPlayerData(myData);
      setGameConfig(config);
      setLoading(false);

      if (invite == "Y") {
        if (user) {
          const docRef = doc(db, "children", user.id);
          const data = user;
          if (data.tenantIds && !data.tenantIds.includes(DEFAULT_TENANT_ID)) {
            const updatedTenantIds = data.tenantIds ? [...data.tenantIds, DEFAULT_TENANT_ID] : [DEFAULT_TENANT_ID];
            await setDoc(docRef, { tenantIds: updatedTenantIds }, { merge: true });
          }
        }
      }
    };
    setLoading(true);
    func();

    const formData = {
      startTime: GAME_HOUR_START_TIME,
      endTime: GAME_HOUR_END_TIME
    }
    checkGameHour(formData).then(isGameHour => {
      setIsGameHour(isGameHour);
    }
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const myPlayerData = useMemo(() => {
    if (!leaderboardData || !user) return null;
    return leaderboardData.find((obj) => obj.id === user?.id);
  }, [leaderboardData, user]);

  const gameCountsForDates = useMemo(() => {
    if (!user) return {};
    const gameCounts = {};
    const currDate = new Date().getTime();
    mondayToSundayDates.forEach((date) => {
      const gameCount = calculateGameCount(user, date);
      // if future date then set gameCount to null
      const validatedDate = validateAndFormatDate(date);
      gameCounts[date] =
        new Date(validatedDate).getTime() > currDate ? null : gameCount;
    });
    return gameCounts;
  }, [user]);

  useEffect(() => {
    const unsubscribe = gameTypes.map((gameType) => {
      const eloScore = user?.eloScore?.[gameType] ?? 1000;
      const openMatchesCollection = collection(db, 'openMatches');

      const q = query(
        openMatchesCollection,
        where("status", "==", "open"),
        where("gameType", "==", gameType),
        where("eloScore", ">=", eloScore - 1000),
        where("eloScore", "<=", eloScore + 1000),
      );

      return onSnapshot(q, (querySnapshot) => {
        const openMatches = [];
        querySnapshot.forEach((doc) => {
          if (Math.floor((Date.now() - doc.data().createdAt) / 1000) <= 13 && doc.data().userId !== user.id) {
            openMatches.push({ ...doc.data(), id: doc.id });
          }
        });
        setOpenMatchesList((prevOpenMatchesList) => {
          const updatedOpenMatchesList = prevOpenMatchesList.filter(match => match.gameType !== gameType);
          return [...updatedOpenMatchesList, ...openMatches];
        });
      });
    });


    return () => unsubscribe.forEach(unsub => unsub());

  }, []);

  //useeffect to get online users list from onlineUsers collection

  useEffect(() => {
    const onlineUsersCollection = collection(db, "onlineUsers");
    //get the tenentId other than the default one in the tenantIds field of the user
    let q;
    if (!userTenantIds || userTenantIds.length === 0) {
      q = query(
        onlineUsersCollection,
        where("online", "==", true),
        //where("grade", "==", user?.grade),
        //where("tenantId", "==", user?.tenantId),
      );
    }
    else {
      q = query(
        onlineUsersCollection,
        where("online", "==", true),
        //where("tenantIds", "array-contains", DEFAULT_TENANT_ID),
        where("tenantIds", "array-contains-any", userTenantIds),
      );
    }

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const onlineUsersPromises = querySnapshot.docs.map(async (doc) => {
        if (doc.id !== user.id && doc.data().tenantIds.includes(DEFAULT_TENANT_ID)) {
          const userStatusRef = ref(database, `status/${doc.id}`);
          const snapshot = await get(userStatusRef);
          if (snapshot.val() === "online") {
            return { ...doc.data(), id: doc.id };
          }
        }
        return null;
      });

      const onlineUsersResults = await Promise.all(onlineUsersPromises);
      const onlineUsers = onlineUsersResults.filter(user => user !== null);
      const mygrade = user?.grade;
      let top3OnlineUsers = [];
      const { myGradeUsers, otherGradeUsers } = onlineUsers.reduce((acc, user) => {
        if (user.grade === mygrade) {
          acc.myGradeUsers.push(user);
        } else {
          acc.otherGradeUsers.push(user);
        }
        return acc;
      }, { myGradeUsers: [], otherGradeUsers: [] });

      const mygradeListLength = myGradeUsers.length;
      if (mygradeListLength > ONLINE_USERS_SHOW_LIMIT - 1) {
        top3OnlineUsers = myGradeUsers;
      }
      else {
        //add the remaining users from the list of online users
        top3OnlineUsers = [...myGradeUsers, ...otherGradeUsers.slice(0, ONLINE_USERS_SHOW_LIMIT - mygradeListLength)];
      }
      setOnlineUsersList(top3OnlineUsers);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (challengeExpired) {
      setTimeout(() => {
        setDisableAllTiles(false);
        setShowGameSelectionPopup(false);
        setChallengeExpired(false);
      }, 3000);
    }
  }
    , [challengeExpired]);

  const handleChallengOnlineUser = async (onlineuser) => {
    //check if the user has exceeded the game limit
    try {
      const userLimitExceeded = await checkUserGameLimit(user?.id);
      const onlineUSerLimitExceeded = await checkUserGameLimit(onlineuser.id);
      if (userLimitExceeded) {
        showToast("You have exceeded your daily game limit");
        setChallengeButtonLoading(false);
        return;
      }
      else if (onlineUSerLimitExceeded) {
        showToast("Player has exceeded their daily game limit");
        setChallengeButtonLoading(false);
        return;
      }
      setChallengeData(onlineuser);
      setShowGameSelectionPopup(true);
      setChallengeButtonLoading(false);
    }
    catch (error) {
      console.error("Error handling challenge:", error);
    }
  }

  const handleChallengeSent = async (challengedUser, gameType) => {

    //check if both users have quizzes left to play for the gameType.
    setChallengeLoading(true);
    let quiz;
    if (gameType === "oneOnOneQuiz" || gameType === "LogoQuiz" || gameType === "englishMeaningsQuiz") {
      quiz = await getQuizNotPlayedByBothPlayers(db, user?.id, challengedUser.id, gameType);
      if (!quiz) {
        setChallengeLoading(false);
        setDisableAllTiles(false);
        showToast("You dont have quizzes left to play with this user,try another game");
        return;
      }
    }
    else if (gameType === "hangman") {
      quiz = await getHangmanQuizNotPlayedByBothPlayers(db, user?.id, challengedUser.id);
      if (!quiz) {
        setChallengeLoading(false);
        setDisableAllTiles(false);
        showToast("You dont have quizzes left to play with this user,try another game");
        return;
      }
    }

    try {
      //make an api call to /create-open-challenge
      const postResponse = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/matching/create-open-challenge`, { userId: user?.id, userName: user?.firstName, challengeeId: challengedUser.id, challengeeName: challengedUser.firstName, gameType: gameType });

      if (postResponse?.data?.data) {
        //put a listener on the doc and navigate to the game after creating it when the status changes to accepted.
        const { id, challengeCreatedDate } = postResponse.data.data;
        const openChallengesCollection = collection(db, 'openChallenges');
        const openChallengeDoc = doc(openChallengesCollection, id);

        var timer;
        const unsubscribe = onSnapshot(openChallengeDoc, (doc) => {
          if (doc.exists()) {
            //combine doc data and doc id and navigate to the game
            const data = { ...doc.data(), id: doc.id }
            if (data.status === "accepted" && !data.gameId) {
              //startGame and navigate to the game
              clearTimeout(timer);
              startGameandNavigate(db, data, navigate, quiz);
            }
            else if (data.status === "declined" || data.status === "expired") {
              clearTimeout(timer);
              setChallengeLoading(false);
              setChallengeExpired(true);
            }
          }
        });
        const timeleft = 12000 - ((new Date().getTime() - challengeCreatedDate));
        timer = setTimeout(() => {
          if (challengeLoading) {
            setChallengeLoading(false);
            setChallengeExpired(true);
          }
          //set the status to expired and resolve the snapshot listener
          setDoc(openChallengeDoc, { status: "expired" }, { merge: true });
        }
          , timeleft);

      }
      else {
        setChallengeLoading(false);
        setShowGameSelectionPopup(false);
        showToast("Player is busy right now, try again later");
      }
    }
    catch (error) {
      console.error("Error handling challenge:", error);
      // Handle error here, show a toast or log it as necessary
    }

  }

  const handleMatching = async (openDoc) => {

    const userLimitExceeded = await checkUserGameLimit(user?.id);
    if (userLimitExceeded) {
      showToast("You have exceeded your daily game limit");
      return;
    }
    const oneOnOneDocId = openDoc.id;
    const gameType = openDoc.gameType;
    setGameLoading(true);
    let postResponse = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/matching/update-matching-doc`, { userId: user?.id, docId: oneOnOneDocId, status: "matchedByOpenMatch" });
    if (postResponse?.data?.data) {
      const openMatchesCollection = collection(db, 'openMatches');

      const unsubscribe = onSnapshot(doc(openMatchesCollection, oneOnOneDocId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data?.gameStarted && data?.matchedUserId === user.id) {
            const url = getUrlByGameType(gameType, data.gameId);
            //navigate to the game 
            const otherPlayerName = data?.userName;
            const otherPlayerCity = data?.userCity;

            setTimeout(() => {
              setGameLoading(false);
              setComputerGameMessage(
                `You are playing against ${otherPlayerName} from ${otherPlayerCity}`
              );
            }, gameType == "memoryCards" ? 3000 : 6000);
            setTimeout(() => {
              setComputerGameMessage("");
              navigate(url);
            }
              , gameType == "memoryCards" ? 5000 : 10000);

          }
        }
      });
    }

    else {
      setGameLoading(false);
      showToast("Sorry, this Challenge has expired");
      setAcceptButtonLoading(false);
    }

  }


  //function to display open matches list with name gametype  and a button to match


  const DisplayOpenMatches = () => {
    if (openMatchesList.length !== 0) {
      return (
        <div className="flex flex-col gap-6 w-full bg-[#4e4e4e]">
          <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
            <div className="flex gap-5 items-center">
              <div className="text-lg md:text-2xl">Open Challenges</div>
            </div>
            <div className="flex flex-col gap-4">
              {openMatchesList.map((match) => {

                return (
                  <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center" /*onClick={()=> navigate(`/profile/${returnEncryptedUserId(match.userId)}`)}*/>
                        <div className="text-base" style={{ color: '#CCF900' }}>{match.userName}</div>
                        <div className="text-base px-2">-</div>
                        <div className="text-base">{gameNamesMap[match.gameType]}</div>
                      </div>
                      <div className="text-xs">{`Grade ${match.userGrade} | ${match.userSchool}, ${match.userCity}`}</div>
                    </div>
                    <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center" onClick={() => {
                      setAcceptButtonLoading(true);
                      MEASURE(INSTRUMENTATION_TYPES.OPENMATCH_ACCEPTED, user?.id, { openMatch: match });
                      handleMatching(match)
                    }}
                      disabled={acceptButtonLoading}
                      isLoading={acceptButtonLoading}
                    >
                      Accept
                    </AppButton>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }
    //else display a message that no open matches are available
    else {
      return (
        <div className="flex flex-col gap-6 w-full bg-[#4e4e4e]">
          <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
            <div className="flex gap-5 items-center">
              <div className="text-lg md:text-2xl">Open Challenges</div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="text-sm md:text-base">No open challenges for you right now, you can click a game above to play</div>
            </div>
          </div>
        </div>
      )
    }
  }

  //functiont to display online firends/relevant users to play with

  const DisplayOnlineUsers = () => {
    //display only if there are online users
    if (onlineUsersList.length !== 0 && isGameHour) {
      return (
        <div className="flex flex-col gap-6 w-full bg-[#4e4e4e]">
          <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
            <div className="flex gap-5 items-center">
              <div className="text-lg">Battle With Friends</div>
            </div>
            <div className="flex flex-col gap-4">
              {onlineUsersList.map((onlineuser) => {


                return (
                  <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-row items-center">
                      <div >
                        {/**code for displaying status colour */}
                        <img
                          alt="icon"
                          src={onlineuser.inGame ? `/Assets/Icons/in-game.svg` : `/Assets/Icons/online.svg`}
                          className="w-[22px] h-[22px]"
                        />
                      </div>

                      <div className="flex flex-col gap-1 pl-4" /*onClick={()=> navigate(`/profile/${returnEncryptedUserId(onlineuser.id)}`)}*/>
                        <div className="text-base " style={{ color: '#CCF900' }}>{onlineuser.firstName}</div>
                        <div className="text-xs">{onlineuser.online && !onlineuser.inGame ? "Online" : "In-Game"}</div>
                      </div>
                    </div>
                    <div>
                      <AppButton className="w-[110px] h-[36px] min-h-[30px] self-center items-center"
                        onClick={() => {
                          //setChallengeData(user);
                          //setShowGameSelectionPopup(true);
                          MEASURE(INSTRUMENTATION_TYPES.CHALLENGE_CLICK_ARENAHOME, user?.id, { challengee: onlineuser });
                          setChallengeButtonLoading(true);
                          setDisableAllTiles(false);
                          handleChallengOnlineUser(onlineuser)
                        }}
                        disabled={onlineuser.online && onlineuser.inGame || challengeButtonLoading}
                        isLoading={challengeButtonLoading}
                      >
                        Challenge
                      </AppButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }
  }



  const goBack = () => {
    navigate("/lobby");
  }

  const goToGame = (route) => {

    if (isGameHour) {
      navigate(route);
    }
    else {
      showToast("Game hour starts at 7pm");
      //showPopUP
    }
  };

  const handleNavigateViewAll = () => {

    if (isGameHour) {
      navigate(ARENA_GAMES_ROUTE);
    }
    else {
      showToast("Game hour starts at 7pm");
    }
  }

  const goToLeaderboard = () => {
    const mondayDate = getDateOfMondayWithUnderscore();
    navigate(`${ARENA_LEADERBOARD_ROUTE}?tId=${mondayDate}`);
  };

  const goToGameHour = () => {
    gameHourRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const isQuizesLeftForPlayer = async (quizCollectionName) => {
    const playerOneArenaGamesCollection = collection(
      db,
      `children/${user.id}/arenaGames`
    );
    const playerOnePlayedGames = await getDocs(playerOneArenaGamesCollection);
    const playerOneQuizes = playerOnePlayedGames.docs.map(
      (doc) => doc.data().quizId
    );

    const quizCollection = collection(db, quizCollectionName);
    const quizes = await getDocs(quizCollection);
    const quizesData = quizes.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    const filteredQuizes = quizesData.filter(
      (quiz) => !playerOneQuizes.includes(quiz.id)
    );
    if (filteredQuizes.length !== 0) {
      return true;
    }
    else return false;
  }
  const handleGameTileClick = async (gameTitle, route) => {
    if (gameTitle == "Logo Wars" || gameTitle == "Mental Math") {
      const quizCollectionName = gameTitle === "Logo Wars" ? "oneOnOneLogoQuizzes" : "quizQuestions"
      const flag = await isQuizesLeftForPlayer(quizCollectionName);
      if (flag) {
        goToGame(route);
      }
      else {
        setDisableAllTiles(false);
        showToast("Congratulations! You have completed all games of this topic. Checkout Connect 4, a new game in the Battleground", "success")
      }
    }
    else goToGame(route);
  }

  const handleArenaGameTileClick = async (gameType, route, challenge) => {
    setDisableAllTiles(true);

    if (challenge && !disableAllTiles) {
      await handleChallengeSent(challengeData, gameType)
    }
    else if (!disableAllTiles) {

      await handleGameTileClick(gameNamesMap[gameType], route);
    }
  }
  const renderGameTile = (icon, gameType, route, challenge = false) => {

    let height = 60;
    let width = 60;
    let totalWidth = 115;
    let totalHeight = 120;
    let titleSize = 95;
    let padding = 3;
    let titleFont = "text-sm";
    if (challenge) {
      height = 40;
      width = 40;
      totalWidth = 85;
      totalHeight = 85;
      padding = 2;
      titleSize = 85;
    }


    /**width = 60, height = 60,totalWidth=105,totalHeight=105, titleSize = 95,padding=4 */
    return (
      <motion.div
        className={twMerge(
          "bg-primary-yellow flex flex-col justify-center items-center rounded-lg text-primary-gray-20 gap-2 aspect-square md:p-[72px]",
          `p-${padding} w-[${totalWidth}px] h-[${totalHeight}px]`
        )}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 0.95 }}
        whileTap={{ scale: 0.95 }}
        disabled={disableAllTiles}
        onClick={() => {
          MEASURE(INSTRUMENTATION_TYPES.GAME_TILE_CLICK, user?.id, {
            gameTitle: gameNamesMap[gameType],
          });
          handleArenaGameTileClick(gameType, route, challenge);
        }}
      >
        <img
          alt="icon"
          src={`/Assets/Icons/${icon}.svg`}
          className={`w-[${width}px] h-[${height}px] md:w-[80px] md:h-[80px] aspect-square`}
        />
        {gameType === "memoryCards" ? (
          <div>
            <div
              className={`w-[${titleSize}px] ${
                challenge ? "text-xs" : "text-sm"
              } text-center`}
            >
              Memory
            </div>
            <div
              className={`w-[${titleSize}px] ${
                challenge ? "text-xs" : "text-sm"
              } text-center`}
            >
              Cards
            </div>
          </div>
        ) : (
          <div
            className={`w-[${titleSize}px] ${
              challenge ? "text-xs" : "text-sm"
            } text-center`}
          >
            {gameNamesMap[gameType]}
          </div>
        )}
      </motion.div>
    );
  };

  /*const renderStreakInfo = () => {
    return (
      <div className="flex justify-between">
        {mondayToSundayDates.map((date, index) => {
          const isCurrentDayClass =
            currentDateInDDMMYYYY === date ? "scale-[0.85]" : "";
          const noGamesPlayed = gameCountsForDates[date] === 0
          const isFutureDate =
            gameCountsForDates[date] === null;

          const firstLetter = daysOfWeek[index].charAt(0);
              
          const percentage = (gameCountsForDates[date] / DAILY_LIMIT) * 100;
          const textColor = noGamesPlayed
            ? "text-[#3a411b]"
            : isFutureDate
            ? "text-[#898989]"
            : "text-[#ccf900]";
          return (
            <div className={twMerge("relative", textColor)}>
              <div
                className={twMerge(
                  "w-full h-1 bg-primary-yellow absolute top-1/2 -translate-y-[200%] z-0",
                  isFutureDate
                    ? "bg-[#5e5e5e] right-1/2"
                    : index === 0
                    ? "left-1/2"
                    : "left-0"
                )}
              />
              <div
                className={twMerge(
                  "scale-[0.6] relative z-[1]",
                  isCurrentDayClass,
                  textColor
                )}
              >
                <CircularProgressbarWithChildren
                  value={percentage}
                  background
                  styles={buildStyles({
                    trailColor: isFutureDate ? "#898989" : "#3a411b",
                    backgroundColor: isFutureDate ? "#5e5e5e" : "#262e00",
                    pathColor: "#ccf900",
                  })}
                >
                  <ThunderIcon className="w-6 h-6" />
                </CircularProgressbarWithChildren>
              </div>
              <div className="text-white text-center text-xs">
                {firstLetter}
              </div>
            </div>
          );
        })}
      </div>
    );
  };*/

  const renderPodiumBar = (type, data) => {
    if (!data && !myPlayerData) return null;
    let bgColorClass = "";
    let transition = {};
    let heightClass = '';
    let subheader = '';
    let profileIcon = <></>;
    let profileContainerClass = 'top-[-136px]'
    const isMyPodium = myPlayerData && data && data.Rank === myPlayerData?.Rank;
    if (isMyPodium || data?.gamesPlayed === 0) {
      bgColorClass = "bg-[#ccf900] box-shadow-3d-you";
      subheader = "You";
    }
    if (type === "first") {
      transition = { duration: 0.3, delay: 0.4 };
      heightClass = "h-[100px]";
      profileIcon = <FirstPlaceProfileIcon />
      if (!isMyPodium) {
        subheader = "Leader";
      }
    } else if (type === "second") {
      transition = { duration: 0.3, delay: 0.2 };
      heightClass = 'h-[60px]';


      if (!isMyPodium) {
        if (myPlayerData?.Rank === 1 || myPlayerData?.Rank === 3) {
          subheader = "2nd";
          profileIcon = <SecondPlaceProfileIcon />
        } else {
          subheader = "Next Target";
          profileIcon = <img src="/Assets/Icons/nextTarget.svg" alt="next-target"></img>
        }
      }
      else {
        subheader = "2nd";
        profileIcon = <SecondPlaceProfileIcon />
      }
    } else {
      transition = { duration: 0.3 };
      heightClass = "h-[40px]";
      profileContainerClass = "top-[-136px]";
      if ((isMyPodium && myPlayerData?.Rank === 3) || myPlayerData?.Rank === 2 || myPlayerData?.Rank === 1) {
        subheader = "3rd";
        profileIcon = <ThirdPlaceProfileIcon />
      }
      else {
        profileIcon = <NonPodiumProfileIcon />
      }

    }

    return (
      <div className="text-center relative">
        <motion.div
          layout
          initial={{ scaleY: 0, originY: "bottom" }}
          animate={{ scaleY: 1, originY: "bottom" }}
          transition={transition}
          className={twMerge(
            "box-shadow-3d max-xs:w-[105px] w-[115px] bg-[#799400]",
            heightClass,
            bgColorClass
          )}
        >
          <div
            className={twMerge(
              "text-white absolute left-[50%] translate-x-[calc(-50%+8px)]",
              profileContainerClass
            )}
          >
            {profileIcon}
            <div className={twMerge(!isMyPodium ? "opacity-50" : "")}>
              <div className="text-xl md:text-2xl font-bold">{data?.pointsWon}</div>
              <div className="text-sm md:text-base">{data?.firstName}</div>
            </div>
          </div>
          {/* <div className="text-black text-xs">Gained Today</div> */}
        </motion.div>
        <div className="grid place-items-center">
          <div
            className={twMerge(
              "mt-4 rounded text-black py-[2px] px-2 text-xs w-fit md:text-base",
              isMyPodium ? "bg-white" : "bg-[#afafaf]"
            )}
          >
            {subheader}
          </div>
        </div>
      </div>
    );
  };

  const renderLeaderboardPodium = () => {
    let firstBarData = leaderboardData?.[0] ?? null;
    let secondBarData = leaderboardData?.[1] ?? null;
    let thirdBarData = leaderboardData?.[2] ?? null;
    const myRank = myPlayerData?.Rank ?? 0;
    if (myRank > 3 || myRank === 0) {
      const dataToUpdate = {
        firstName: user.firstName,
        lastName: user.lastName,
        schoolName: user.school,
        city: user.city,
        gamesPlayed: 0,
        gamesWon: 0,
        pointsWon: 0,
        specialAwards: [],
      };
      if (myRank === 0) {
        thirdBarData = dataToUpdate;
      } else {
        thirdBarData = myPlayerData;
      }
      // find next player who has pointsWon margin of atleast 20 from leaderboardData
      //const nextPlayer = leaderboardData.find(
      //  (obj) => obj.pointsWon - myPlayerData.pointsWon >= 20
      //);
      let nextPlayer;
      if (leaderboardData) {
        // do a binary search to find the next player whose pointsWon is myPlayerData.pointsWon + 20
        let high;
        if (myPlayerData?.Rank) {
          high = myPlayerData?.Rank - 2;
        }
        else {
          high = leaderboardData?.length - 1;
        }
        let low = 0;
        const myPointsWon = myPlayerData?.pointsWon ?? 0;
        while (high > low) {
          let mid = Math.floor((high + low) / 2);
          if (leaderboardData[mid].pointsWon === myPointsWon + 20) {
            nextPlayer = leaderboardData[mid];
            break;
          }
          else if (leaderboardData[mid].pointsWon > myPointsWon + 20) {
            low = mid + 1;
          }
          else {
            high = mid - 1;
          }
        }
        if (!nextPlayer) {
          if (low === 0) {
            nextPlayer = leaderboardData[1];
          }
          else {
            nextPlayer = leaderboardData[low];
          }
        }
        secondBarData = nextPlayer;
      }
      //map through leaderboardData and get 3 distinct ranked docs.chek if there is a tie in top 3 docs of leaderboardData
      /*let podiumList = [];
      let initialRank = 0;
      let i=0;
      let podiumTie = false;
      while(i<leaderboardData.length && podiumList.length<3){
        if(leaderboardData[i].Rank>initialRank){
          initialRank = leaderboardData[i].Rank;
          podiumList.push(leaderboardData[i]);
          i++;
        }
        else{
          podiumTie = true;
          i++;
        }
      }*/
    }

    return (
      <div className="flex flex-col gap-6 w-full p-4 bg-[#4e4e4e]">
        <div className="flex items-center justify-between">
          <div className="text-lg md:text-2xl">Hall of Fame</div>
          <div
            className="text-sm md:text-lg underline text-primary-yellow"
            onClick={() => { MEASURE(INSTRUMENTATION_TYPES.ARENA_LEADERBOARD, user?.id, {}); goToLeaderboard() }}
          >
            View Leaderboard
          </div>
        </div>
        <div className="flex justify-center items-end relative mt-[115px] md:mt-[150px]">
          {loading ? (
            <Loader message="Calculating ranks" />
          ) : (
            <>
              {renderPodiumBar("third", thirdBarData)}
              {renderPodiumBar("second", secondBarData)}
              {renderPodiumBar("first", firstBarData)}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderGameHourSection = () => {
    return (
      <div className="flex flex-col gap-6 w-full p-4 bg-[#4e4e4e]" ref={gameHourRef}>
        <div className="flex flex-row items-center justify-between">
          <div className="text-lg md:text-2xl">Games</div>
          <div className="text-sm md:text-lg text-primary-yellow underline" onClick={handleNavigateViewAll}>View All </div>
        </div>
        <div>
          <div className="flex justify-center gap-7 py-2">
            {/*renderGameTile("logo-wars", "LogoQuiz", LOGO_QUIZ_ROUTE)*/}
            {renderGameTile("mini-scrabble", "miniScrabble", MINI_SCRABBLE_ROUTE)}
            {renderGameTile("archery", "archery", ARCHERY_ROUTE)}
            {/*renderGameTile("connect-4", "connect4", CONNECT_4_ROUTE)*/}
          </div>
          <div className="flex justify-center gap-7 py-2">
            {renderGameTile("memory-cards", "memoryCards", MEMORY_CARDS_ROUTE)}
            {renderGameTile("memory-cards", "memoryCardsPro", MEMORY_CARDS_PRO_ROUTE)}
          </div>
        </div>
      </div>
    );
  };

  const renderGameSelectionPopup = () => {
    //if challenLoading is true, show a  loader
    if (challengeLoading) {
      return (
        <Dialog
          open={showGameSelectionPopup}
          //onClose={() => setShowGameSelectionPopup(false)}
          className="register-success"
        >
          <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">
            <div className="flex justify-center items-center">
              <div>
                <GameLoader message="Challenge sent" />
                <div>Waiting for {challengeData.firstName} to accept</div>
              </div>
            </div>
          </div>
        </Dialog>
      );
    }
    else if (challengeExpired) {
      return (
        <Dialog
          open={showGameSelectionPopup}
          //onClose={() => setShowGameSelectionPopup(false)}
          className="register-success"
        >
          <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">
            <div className="flex justify-center items-center">
              <div>
                <img
                  alt="icon"
                  src={`/Assets/Icons/cross-icon.svg`}
                  className={`w-[30px] h-[30px]`}
                />

              </div>
              <div className="text-lg pl-4">Challenge Expired</div>
            </div>
          </div>
        </Dialog>
      );
    }



    return (
      <Dialog
        open={showGameSelectionPopup}
        //onClose={() => setShowGameSelectionPopup(false)}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">

          <div className="flex flex-col items-center pb-2">
            <div className="text-lg">Select a game to play</div>
            <div className="flex gap-4 py-2">
              {renderGameTile("connect-4", "connect4", CONNECT_4_ROUTE, true)}
              {renderGameTile("memory-cards", "memoryCards", MEMORY_CARDS_ROUTE, true)}
            </div>
            <div className="flex gap-4 py-2">
              {renderGameTile("logo-wars", "LogoQuiz", LOGO_QUIZ_ROUTE, true)}
              {renderGameTile("english-meanings-quiz", "englishMeaningsQuiz", ENGLISH_MEANIGS_QUIZ_ROUTE, true)}
            </div>
            <div className="flex justify-center gap-4 py-2">
              {renderGameTile("hangman", "hangman", HANGMAN_ROUTE, true)}
              {renderGameTile("memory-cards", "memoryCardsPro", MEMORY_CARDS_PRO_ROUTE, true)}
            </div>
            <div className="flex justify-center gap-4 py-2">
              {renderGameTile("archery", "archery", ARCHERY_ROUTE, true)}
              {renderGameTile("mini-scrabble", "miniScrabble", MINI_SCRABBLE_ROUTE, true)}
            </div>

          </div>
          <div className="self-center items-center pt-4">
            <AppButton
              onClick={() => setShowGameSelectionPopup(false)}
              className="rounded-[115px] min-w-[159px] w-[159px] h-[35px] min-h-[35px] self-center items-center"
            >
              Go Back
            </AppButton>
          </div>
        </div>
      </Dialog>
    );
  }

  const renderProgressDialouge = () => {

    return (
      <Dialog
        open={progressDialouge}
        onClose={() => setProgressDialouge(false)}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">
          <div className="text-primary-yellow text-center font-semibold text-lg">How to Progress</div>

          <ul className="my-3 mx-0">
            <p className="my-3 mx-0 ml-[-20px]">Earn Points For</p>
            <li>Each game played</li>
            <li>Each game won</li>
            <li>Playing all 5 games daily</li>
            <li>Playing all 7 days of the week</li>
            <p className="my-3 mx-0 ml-[-20px]">Play regularly and climb the leaderboard!</p>
          </ul>

          <AppButton
            onClick={() => setProgressDialouge(false)}
            className="rounded-[115px] min-w-[159px] w-[159px] h-[35px] min-h-[35px] self-center items-center"
          >
            Understood
          </AppButton>
        </div>
      </Dialog>
    );
  }

  if (computerGameMessage) {
    return (
      <Layout>
        <div className="w-full text-white h-full flex justify-center items-center">
          <div className="text-center">{computerGameMessage}</div>
        </div>
      </Layout>
    );
  }
  else if (gameLoading) {
    return (
      <Layout>
        <div className="text-white px-8 py-4 flex flex-col items-center h-full">
          <div className="w-full h-full flex justify-center items-center">
            <GameLoader message="Setting up the game..." />
          </div>
        </div>
      </Layout>
    );
  }
  else {
    return (
      <Layout>
        <div className="flex flex-col h-full w-full relative bg-primary-gray-20">
          <ArenaHeader
            goBack={goBack}
            headerText="BattleGround"
            coins={myPlayerData?.coins ?? 0}
            pointsWon={myPlayerData?.pointsWon ?? 0}
            gamesPlayed={myPlayerData?.gamesPlayed ?? 0}
          />
          <div className="text-white py-4 flex flex-col items-center gap-6 h-full overflow-auto">
            <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
              <div className="flex gap-5 items-center">
                <div className="text-lg md:text-2xl">Your Progress</div>
                <HelpSvg
                  className="text-black w-4 aspect-square md:w-6 "
                  onClick={() => setProgressDialouge(true)}
                />
                {renderProgressDialouge()}
              </div>

              <RenderStreakInfo gameCountsForDates={gameCountsForDates} />
              <AppButton className="w-full md:text-lg" onClick={() => { MEASURE(INSTRUMENTATION_TYPES.ARENA_HELP, user?.id, {}); goToGameHour() }}>
                {isGameHour ? 'Play now to win more' : 'Game hour starts at 7 pm'}
              </AppButton>
            </div>
            {renderLeaderboardPodium()}
            {renderGameHourSection()}
            {DisplayOnlineUsers()}
            {DisplayOpenMatches()}
            {renderGameSelectionPopup()}
          </div>
         
        </div>
        <ToastComponent />
        {/*<div className="w-full">
        <BottomNavBar  userId={user?.id} />
      </div>*/}
      </Layout>
      
    );
  }
};

export default ArenaHome;
