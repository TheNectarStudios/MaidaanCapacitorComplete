import AppButton from "../../Components/Common/AppButton";
import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, limit, orderBy,doc,setDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase-config";
import Loader from "../../Components/PageComponents/Loader";
import { ARENA_ROUTE, ARENA_GAMES_ROUTE, ARENA_LEADERBOARD_ROUTE } from "../../Constants/routes";
import { TOTAL_POINTS_PER_WEEK, getDateOfMondayWithUnderscore, TOTAL_POINTS_PER_DAY,calculateGameCount} from "../utils";
import { DAILY_LIMIT } from "../../Constants/GamesArena/MemoryCards";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/auth-provider";
import RenderStreakInfo from "./PlayerStreak";
import { motion } from "framer-motion";
import ThunderIcon from "./Icons/ThunderIcon";
import { MEASURE } from "../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../instrumentation/types";
 
const GameEndModal = ({
  gameState,
  isOpen,
  myPlayerId,
  resetGame,
  inviteOthers,
  title,
  icon,
  isGameLost,
  isGameTied = false,
  showSubtitle = true,
  gameCollectionName,
  gameType,
  hintText = "Priya from Class 6 in Pune beat her opponent in just 10 moves. Beat her score!",
  customSubtitle = false,
  subtitleText = <></>,
  gamePoints,
  gameId,
  gameCountsForDates,
  handleFindPlayer,
  gamesLeft=0,
  hideScore = false,
  smallCopy = null,
}) => {
  const navigate = useNavigate();
  const { user,getUserDetails } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gamesRemaining, setGamesRemaining] = useState(0);
  const [topFiveGames, setTopFiveGames] = useState([]);
  const otherPlayerId = myPlayerId === "playerOne" ? "playerTwo" : "playerOne";
  const winnerState = gameState?.[gameState?.winner];
  const name = winnerState?.name;
  const movesSum =
    gameState?.[myPlayerId]?.numberOfMoves +
    gameState?.[otherPlayerId]?.numberOfMoves;
  const score = gameState?.[myPlayerId]?.score;
  const opponentScore = gameState?.[otherPlayerId]?.score;
  const currentDateInDDMMYYYY = new Date().toLocaleDateString("en-GB");
  
  useEffect(() => {
    if(user?.createdAt){
      getUserDetails();
    }
    if (isOpen) {
      const func = async () => {
        setLoading(true);
        const gameCollection = collection(db, gameCollectionName);
        const id = gameState?.[myPlayerId]?.id;
        const playerOneQuery = query(
          gameCollection,
          where("playerOne.id", "==", id),
          orderBy("gameEndedAt", "desc"),
          limit(5)
        );
        const playerTwoQuery = query(
          gameCollection,
          where("playerTwo.id", "==", id),
          orderBy("gameEndedAt", "desc"),
          limit(5)
        );
        const [playerOneSnapshot, playerTwoSnapshot] = await Promise.all([
          getDocs(playerOneQuery),
          getDocs(playerTwoQuery),
        ]);
        const playerOneGames = playerOneSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        const playerTwoGames = playerTwoSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        const games = [...playerOneGames, ...playerTwoGames];
        const sortedGames = games.sort((a, b) => b.createdAt - a.createdAt);
        const topFiveGames = sortedGames.slice(0, 5);
        setTopFiveGames(topFiveGames);
        setLoading(false);
      };
      func();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const navigateLeaderboard = async () => {
    await updateGameDocWithExit();
    const mondayDate = getDateOfMondayWithUnderscore();
      navigate(`${ARENA_LEADERBOARD_ROUTE}?tId=${mondayDate}`);
  }

  const navigateArenaLobby = async () => {
    await updateGameDocWithExit();
    navigate(ARENA_ROUTE);
  }

  const handleNavigateViewAll = async () => {
    await updateGameDocWithExit();
    if (user?.createdAt) {
      navigate(ARENA_GAMES_ROUTE);
    } else {
      navigate(`/login?redirect=${ARENA_GAMES_ROUTE}`);
    }
  }

  const gamesLeftToday = useMemo(() => {
    if (user?.createdAt) {
      const gameCount = calculateGameCount(user, currentDateInDDMMYYYY);
      return DAILY_LIMIT - gameCount;
    }
  },[user]);

  const updateGameDocWithExit = async () => {
    const gameCollection = collection(db, gameCollectionName);
    const gameRef = doc(gameCollection, gameId);
    await setDoc(
      gameRef,
      {
        ...gameState,
        gameEndedAt: new Date(),
        gameExited: user.id,
      },
      { merge: true }
    );
    }
  const renderPointsBar = () => {
    const percentageOfGamePoints = (gamePoints.total / TOTAL_POINTS_PER_DAY) * 100;
    const percentageOfWeeklyWon = ((gamePoints.weeklyPointsWon?? 0) / TOTAL_POINTS_PER_DAY) * 100;
    return (
      
      <div className="h-[10px] w-full max-w-[270px] bg-[#5E5E5E] rounded-lg overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentageOfWeeklyWon}%` }}
          transition={{ duration: 1 }}
          className="h-full bg-[#CCF900] absolute top-0 left-0 z-[1]"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${percentageOfWeeklyWon + percentageOfGamePoints}%`,
          }}
          transition={{ duration: 1 }}
          className="h-full bg-[#0084CE] absolute top-0 left-0 z-[0]"
        />
      </div>
    );
  };

  let gamesPlayed=0;
    if(user?.createdAt){
    const gamesPlayed = calculateGameCount(user, currentDateInDDMMYYYY);
    }
  return (
      !user?.createdAt ? (<div className="relative flex flex-col items-center h-full gap-6 px-8 py-4">
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="flex justify-evenly items-center w-full text-4xl font-bold">
            {!hideScore ? <div className="flex flex-col items-center">
              <div className="text-2xl font-bold">{score}</div>
            </div> : <></>}
            <img src={icon} alt="icon" className="mr-2 h-20" />
            {!hideScore ? <div className="flex flex-col items-center">
              <div className="text-2xl font-bold">{opponentScore}</div>
            </div> : <></>}
          </div>
          <div className="text-center">
            {title}
            {customSubtitle ? (
              <span className="block text-sm mt-2">{subtitleText}</span>
            ) : (
              <></>
            )}
            {showSubtitle ? (
              smallCopy ?
              <span className="block text-sm mt-2">
                {smallCopy}   
              </span>
              : (isGameTied ? (
                <span className="block text-sm mt-2">
                  The game was tied in {movesSum} moves
                </span>
              ) : (
                <span className="block text-sm mt-2">
                  {isGameLost ? name : "You"} won in {movesSum} moves
                </span>
              ))
            ) : (
              <></>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div>Last 5 Games</div>
            <div className="flex justify-center gap-2">
              {Array.from(Array(5)).map((_, index) => {
                const game = topFiveGames[index];
                if (!game) {
                  return (
                    <div
                      key={index}
                      className="h-6 w-6 rounded-full border border-solid border-primary-yellow bg-transparent"
                    />
                  );
                }
                if (game.winner?.toLowerCase() === "tied") {
                  return (
                    <img
                      src="/Assets/Icons/tie.svg"
                      alt=""
                      key={game.id}
                      className="h-6 w-6"
                    />
                  );
                }
                if (game[game.winner]?.id === gameState[myPlayerId]?.id) {
                  return (
                    <img
                      src="/Assets/Icons/like.svg"
                      alt=""
                      key={game.id}
                      className="h-6 w-6"
                    />
                  );
                }
                return (
                  <img
                    src="/Assets/Icons/dislike.svg"
                    alt=""
                    key={game.id}
                    className="h-6 w-6"
                  />
                );
              })}
            </div>
          </div>
          <div className="text-xs italic font-light flex gap-3 justify-center">
            <img
              src="/Assets/Icons/lightbulb-light.svg"
              alt=""
              className="h-6 w-6 flex-shrink-0"
            />
            {/* <LightBulbSvg className="h-6 w-6 flex-shrink-0" /> */}
            <span>{hintText}</span>
          </div>
          <div className="flex flex-col gap-6 justify-center items-center">
            <div className="flex justify-center gap-6">
              <AppButton onClick={resetGame} className="w-[120px]">
                Play Again
              </AppButton>
              <AppButton className="w-[120px]"
                onClick={() => {
                  if (user?.createdAt) {
                    navigate(ARENA_ROUTE);
                  } else {
                    navigate(`/login?redirect=${ARENA_ROUTE}`);
                  }
                }}
              >
                Register
              </AppButton>
            </div>
          </div>
        </>
      )}
    </div>
  )
        : (
    <div className="relative flex flex-col items-center h-full gap-6 px-8 py-4">
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="flex justify-evenly items-center w-full text-4xl font-bold">
            {!hideScore && <div className="flex flex-col items-center">
              <div className="text-2xl font-bold">{score}</div>
            </div>}
            <img src={icon} alt="icon" className="mr-2 h-20" />
            {!hideScore && <div className="flex flex-col items-center">
              <div className="text-2xl font-bold">{opponentScore}</div>
            </div>}
          </div>
          <div className="text-center">
            {title}
            {customSubtitle ? (
              <span className="block text-sm mt-2">{subtitleText}</span>
            ) : (
              <></>
            )}

            {showSubtitle ? (
              smallCopy ?
              <span className="block text-sm mt-2">
                {smallCopy}   
              </span>
              : (isGameTied ? (
                <span className="block text-sm mt-2">
                  The game was tied in {movesSum} moves
                </span>
              ) : (
                <span className="block text-sm mt-2">
                  {isGameLost ? name : "You"} won in {movesSum} moves
                </span>
              ))
            ) : (
              <></>
            )}
          </div>
          {renderPointsBar()}
          <div className="text-xl flex items-center gap-1">
            +{gamePoints.total} <ThunderIcon className="text-primary-yellow h-5 w-5" />{" "}
            <span className="text-sm"> to day's tally</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div>
              
              <div className="flex gap-10 justify-between text-xs font-bold font-montserrat">
                
                {/*<div>TOTAL WON : {gamePoints.total}</div>*/}
                <div className="flex flex-col items-center">
                <div className="text-sm">Gameplay</div>
                <div className="font-bold text-xl"> {gamePoints.played}</div>
                </div>
                <div className="flex flex-col items-center ">
                <div className="text-sm">Streak </div>
                <div className="font-bold text-xl">{gamePoints.discipline}</div>   
                </div>
                <div className="flex flex-col items-center">
                <div className="text-sm">Win Bonus</div>
                <div className="font-bold text-xl">{gamePoints.won}</div>
                </div>
                
              </div>
            </div>
            <div className="flex gap-2 justify-between items-center text-sm font-bold font-montserrat">
              <div >
              Games Left Today: 
              </div>
              <div className="text-primary-yellow text-xl">
                {gamesLeftToday}
            </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 justify-center items-center">
            <div className="flex justify-center gap-6">
              {!gameState?.gameExited && !gameState?.isComputerGame ? (
              <AppButton onClick={()=>{
                MEASURE(INSTRUMENTATION_TYPES.REMATCH_GAME_END, user?.id, {gameId: gameId,gameType:gameType});
                resetGame()}} className="w-[130px]">
                Rematch
              </AppButton>
              ):(
                <AppButton onClick={()=>{
                  MEASURE(INSTRUMENTATION_TYPES.PLAY_AGAIN_GAME_END, user?.id, {gameId: gameId,gameType:gameType});
                  handleFindPlayer()}} className="w-[130px]">
                Play Again
              </AppButton>
              )}
              <AppButton
                onClick={() => {
                  MEASURE(INSTRUMENTATION_TYPES.OTHER_GAMES_GAME_END, user?.id, {gameId: gameId,gameType:gameType});
                  handleNavigateViewAll()}}
                className="w-[130px]"
              >
                Other Games
              </AppButton>
            </div>
            <div className="flex justify-center gap-6 items-center">
            <AppButton onClick={()=>{
                MEASURE(INSTRUMENTATION_TYPES.LEADERBOARD_GAME_END, user?.id, {gameId: gameId,gameType:gameType});
              navigateLeaderboard()}} className="w-[130px]">
                Leaderboard
              </AppButton>
              <AppButton onClick={()=>{
                MEASURE(INSTRUMENTATION_TYPES.ARENA_LOBBY_GAME_END, user?.id, {gameId: gameId,gameType:gameType});
                navigateArenaLobby()}} className="w-[130px]">
                Arena Lobby
              </AppButton>
              
            </div>
          </div>
        </>
      )}
    </div>
  )
  );
};

export default GameEndModal;
