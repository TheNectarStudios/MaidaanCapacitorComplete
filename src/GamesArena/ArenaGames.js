import { useNavigate } from "react-router-dom";
import BackButton from "../Components/Common/BackButton";
import Layout from "../Components/Common/Layout";
import { motion } from "framer-motion";
import axios from "axios";
import mixpanel from 'mixpanel-browser';

import { MEMORY_CARDS_ROUTE,MEMORY_CARDS_PRO_ROUTE, QUIZ_GAME_ROUTE ,MENTAL_MATH_ROUTE,LOGO_QUIZ_ROUTE,CONNECT_4_ROUTE, HANGMAN_ROUTE, ENGLISH_MEANIGS_QUIZ_ROUTE, ARCHERY_ROUTE, MINI_SCRABBLE_ROUTE} from "../Constants/routes";
import { returnEncryptedUserId } from "../Components/utils";
import { db } from "../firebase-config";
import GameLoader from "../Components/PageComponents/GameLoader";
import {  query, where,getDocs } from "firebase/firestore";
import AppButton from "../Components/Common/AppButton";
import { collection, addDoc, onSnapshot, doc, getDoc, setDoc, FieldPath } from "firebase/firestore";

import { MEASURE } from "../instrumentation";
import { INSTRUMENTATION_TYPES } from "../instrumentation/types";
import { gameTypes,gameNamesMap } from "../Constants/Commons";
import useToast from "../hooks/use-toast.js";
import { DAILY_LIMIT } from "../Constants/GamesArena/MemoryCards";
import { useAuth } from "../providers/auth-provider";
import { useEffect, useMemo } from "react";
// import AnimatedNumber from "animated-number-react";
import AnimatedNumber from "react-awesome-animated-number";
import { calculateGameCount ,sortDataPerRankOrPoints} from "./utils";
import { getGameConfig, getWeeklyArenaTournamentLeaderboard,getDateOfMondayWithUnderscore, checkUserGameLimit } from "./utils";
import ArenaHeader from "./Common/ArenaHeader";
import { useState } from "react";

//const gameTypes = ["memoryCards", "LogoQuiz", "oneOnOneQuiz", "connect4"];

const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");

const ArenaGames = () => {
    const navigate = useNavigate();
    const { user, getUserDetails, isUserLoading } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState(null);
    const [gameConfig, setGameConfig] = useState(null);

    const [openMatchesList, setOpenMatchesList] = useState([]);
    const [gameLoading, setGameLoading] = useState(false);
    const [computerGameMessage, setComputerGameMessage] = useState("");
    const { ToastComponent, showToast } = useToast();
    const [disableAllTiles, setDisableAllTiles] = useState(false);
    const [buttonClicked, setButtonClicked] = useState(false);


    useEffect(() => {
      getUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const limit = useMemo(() => {
      if (!user || isUserLoading) return 0;
      const gameCount = calculateGameCount(user, currentDateInDDMMYYYY);
      return DAILY_LIMIT - gameCount;
    }, [isUserLoading, user]);

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
      };
      func(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            if(Math.floor((Date.now()-doc.data().createdAt) / 1000) <= 13 && doc.data().userId !== user.id){
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

  const myPlayerData = useMemo(() => {
    if (!leaderboardData || !user) return null;
    return leaderboardData.find((obj) => obj.id === user?.id);
  }, [leaderboardData, user]);

    const goBack = () => {
        navigate("/arena");
    }

    const goToGame = (route) => {
        navigate(route);
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
      if(filteredQuizes.length > 0){
        return true;
      }
      else return false;
    }

    const handleGameTileClick = async (gameTitle,route) =>{

      if( gameTitle == "Logo Wars" || gameTitle == "Mental Math"){
        const quizCollectionName = gameTitle === "Logo Wars" ? "oneOnOneLogoQuizzes" : "quizQuestions"
        const flag = await isQuizesLeftForPlayer(quizCollectionName);
        if(flag){
          goToGame(route);
        }
        else {
          showToast("Congratulations! You have completed all games of this topic. Checkout Connect 4, a new game in the Battleground","success");
          setDisableAllTiles(false);
        }
      }
      else goToGame(route);
    }
    const handleArenaGameTileClick = async (gameType,route,challenge) => {
      setDisableAllTiles(true);
      if(!disableAllTiles){   
        await handleGameTileClick(gameNamesMap[gameType], route);
      }
    }
    const renderGameTile = (icon, gameType, route) => {
        return (
          <motion.div
            className="bg-primary-yellow flex flex-col justify-center items-center rounded-lg text-primary-gray-20 p-4 gap-2 w-[115px] h-[120px] aspect-square"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 0.95 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {MEASURE(INSTRUMENTATION_TYPES.GAME_TILE_CLICK_ALLGAMES, user?.id, { gameTitle: gameNamesMap[gameType] });/*handleGameTileClick(title,route)*/
            handleArenaGameTileClick(gameType,route,false)
          }}
          >
            <img
              alt="icon"
              src={`/Assets/Icons/${icon}.svg`}
              className="w-[60px] h-[60px]"
            />
            {gameType === "memoryCards" ? (
              <div>
            <div className="w-[95px] text-sm text-center">Memory</div>
            <div className="w-[95px] text-sm text-center">Cards</div>
            </div>
            ) : (
            <div className="w-[95px] text-sm text-center">{gameNamesMap[gameType]}</div>
            )}
          </motion.div>
        );
    };
    const DisplayOpenMatches = () => {
      if(openMatchesList.length !== 0){
        return (
          <div className="flex flex-col gap-6 w-full bg-[#4e4e4e] text-white">
            <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
                <div className="flex gap-5 items-center">
                <div className="text-lg">Open Challenges</div>
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
                        <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center" onClick={()=>{
                          MEASURE(INSTRUMENTATION_TYPES.OPENMATCH_ACCEPTED, user?.id, {openMatchDoc: match.id});
                          handleMatching(match)}}>
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
      else{
        return (
          <div className="flex flex-col gap-6 w-full bg-[#4e4e4e]  text-white">
          <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
              <div className="flex gap-5 items-center">
              <div className="text-lg">Open Challenges</div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-sm">No open challenges for you right now, you can click a game above to play</div>
              </div>
            </div>
        </div>
        )
      }
    }

    const getUrlByGameType = (gameType,gameId) => {
      switch (gameType) {
        case "memoryCards":
          return `${MEMORY_CARDS_ROUTE}?gameId=${gameId}`;
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
        case "memoryCardsPro":
          return `${MEMORY_CARDS_PRO_ROUTE}&gameId=${gameId}`;
        case "archery":
          return `${ARCHERY_ROUTE}?gameId=${gameId}`;

        case "miniScrabble":
          return `${MINI_SCRABBLE_ROUTE}?gameId=${gameId}`;
        default:
          return null;
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
      
      let postResponse = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/matching/update-matching-doc`, { userId:user?.id,docId:oneOnOneDocId,status:"matchedByOpenMatch"});
      if(postResponse?.data?.data){
      const openMatchesCollection = collection(db, 'openMatches');
      setGameLoading(true);
      const unsubscribe = onSnapshot(doc(openMatchesCollection, oneOnOneDocId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data?.gameStarted && data?.matchedUserId === user.id) {
            const url = getUrlByGameType(gameType,data.gameId);
                //navigate to the game 
                const otherPlayerName = data?.userName;
                const otherPlayerCity = data?.userCity;

                setTimeout(() => {
                  setGameLoading(false);
                  setComputerGameMessage(
                    `You are playing against ${otherPlayerName} from ${otherPlayerCity}`
                  );
                }, gameType == "memoryCards" ? 3000 :6000);

                setTimeout(() => {
                  setComputerGameMessage("");
                  navigate(url);
                }
                  , gameType == "memoryCards" ? 5000: 10000);
            
            }
          }
        });
    }

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
            <div className="text-white px-8 py-4 flex flex-col  items-center h-full">
          <div className="w-full h-full flex justify-center items-center">
            <GameLoader message="Setting up the game..." />
          </div>
          </div>
          </Layout>
        );
    }
    else{
    return (
      <Layout>
        <div className="flex flex-col h-full w-full relative overflow-auto">
          <ArenaHeader
            goBack={goBack}
            headerText="All Games"
            coins={myPlayerData?.coins ?? 0}
            pointsWon={myPlayerData?.pointsWon ?? 0}
            gamesPlayed={myPlayerData?.gamesPlayed ?? 0}
          />
          <div className="text-white px-8 py-4 flex flex-col items-center justify-center gap-6 h-full">
            <div className="text-2xl">
              Games Left Today:{" "}
              <span className="text-primary-yellow">
                <AnimatedNumber size={24} value={limit} minDigits={1} duration={500} />
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex gap-4 py-2">
                {renderGameTile("connect-4", "connect4", CONNECT_4_ROUTE)}
                {renderGameTile("hangman", "hangman", HANGMAN_ROUTE)}
                
              </div>
              <div className="flex gap-4 py-2">
                {renderGameTile("memory-cards", "memoryCards", MEMORY_CARDS_ROUTE)}
                {renderGameTile("memory-cards", "memoryCardsPro", MEMORY_CARDS_PRO_ROUTE)}
              </div>
              <div className="flex gap-4 py-2">
                {renderGameTile("logo-wars", "LogoQuiz", LOGO_QUIZ_ROUTE)}
                {renderGameTile("english-meanings-quiz", "englishMeaningsQuiz", ENGLISH_MEANIGS_QUIZ_ROUTE)}
              </div>
              <div className="flex gap-4 py-2">
                {renderGameTile("archery", "archery", ARCHERY_ROUTE)}
                {renderGameTile("mini-scrabble", "miniScrabble", MINI_SCRABBLE_ROUTE)}
              </div>
            </div>
          </div>
          <div className="w-full h-full flex justify-center items-center pb-4">
            {DisplayOpenMatches()}
          </div>
        </div>
        <ToastComponent/>
      </Layout>
    );
  }
};

export default ArenaGames;