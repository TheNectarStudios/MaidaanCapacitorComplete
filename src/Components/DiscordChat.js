import WidgetBot from '@widgetbot/react-embed';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import * as FB from "../Components/Firebase/FirebaseFunctions";
import useToast from '../hooks/use-toast';
import { MEASURE } from '../instrumentation';
import { INSTRUMENTATION_TYPES } from '../instrumentation/types';
import { TournamentStatus } from './utils';
import { BASE_URL, DEFAULT_NEGATIVE_SCORE, DEFAULT_POSIIVE_SCORE, ENABLE_SKIP_LS_KEY, NEGATIVE_SCORE_LS_KEY, NEW_FORMAT_TOURNAMENT_GAMES, OPEN_USER_FOR_TOURNAMENT, POSITIVE_SCORE_LS_KEY, getDemoFlowData, getUserTournamentRegistrationType } from '../Constants/Commons';
import { db } from '../firebase-config';
import AppButton from './Common/AppButton';
import Layout from './Common/Layout';
import Loader from './PageComponents/Loader';
import { useAuth } from '../providers/auth-provider';
import { twMerge } from 'tailwind-merge';
import { getTournamentDetails } from '../services/tournament';
import { useApp } from '../providers/app-provider';
import ArenaHeader from '../GamesArena/Common/ArenaHeader';
import mixpanel from 'mixpanel-browser';

export const DiscordChat = () => {
  const SHOW_MONTH_BUTTON = false;
  const [searchParams,] = useSearchParams();
  const { showToast, ToastComponent } = useToast();
  const navigate = useNavigate();

  
  const { isOpenTenantSelected } = useApp();
  const tId = searchParams.get("tId");
  const isDemo = searchParams.get("d") === "S";
  const { user:userTemp } = useAuth();
  let user;
  if(isDemo){
    const userId = localStorage.getItem("userId");
    const firstName = localStorage.getItem("firstName");
    const additionData = getDemoFlowData();
    user = {
        firstName,
        id: userId,
        ...additionData,
    };
  }
  else {
    user = userTemp;
  }
  const backNavigator = searchParams.get("back");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tournamentDetails, setTournamentDetails] = useState(null);
  const infoContainerRef = useRef(null);


  const showYourCLass = !user?.tenantIds?.includes("maidaan");


  var roundFormat = "";

  useEffect(() => {
    if (infoContainerRef && infoContainerRef.current) {
      const height =
        window.innerHeight - infoContainerRef.current.clientHeight - 80; // 80 is the height of the header
      setHeight(height);
    }
    const w = window.innerWidth > 768 ? 768 : window.innerWidth;
    setWidth(w);
  }, []);

  useEffect(() => {
    if (tId) {
      const tournamentDetails = async () => {
        const tournament = await getTournamentDetails(tId);
        if (tournament) {
          setTournamentDetails(tournament);
        }
      }
      tournamentDetails();
    }
  }, [tId]);


  const redirectToLeaderboard = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.ENTER_LEADERBOARD,
      user.id,
      { tournamentId: tId }
    );
    // const gameId = localStorage.getItem("gId");
    let url;
    
    url = `/leaderboard${window.location.search}&ch=1`;

    if( isDemo){
      url += `&d=S`;
    }
    navigate(url);
  };

  const handleBack = () => {
    MEASURE(INSTRUMENTATION_TYPES.COMMON_ROOM_BACK, user.id, {
      tournamentId: tId,
    });
    // const gameId = localStorage.getItem("gId");
    if(isDemo){
      navigate(`/lobby-demo?d=S`);
    }
    else if(!!backNavigator){
      navigate(`/${backNavigator}`);
    } else navigate(-1);
  };

  const redirectToOtherPools = () => {
    let url;
    if(!!backNavigator){
      url = `/leaderboard/cohorts?tId=${tId}&ch=1&back=${backNavigator}`;
    } else {
      url = `/leaderboard/cohorts?tId=${tId}&ch=1`;
    }
    if(isDemo){
      url += `&d=S`;
    }
    navigate(url);
  };
  const redirectToSelectTournament = () => {
    navigate(`/tournament/select?back=${backNavigator}`);
  };

  const checkIfRoundIsActive = async (
    tId,
    activeRound,
    isPractice = false
  ) => {
    const round = await FB.getData(
      `tournaments/${tId}/rounds`,
      String(activeRound)
    );
    if (round) {
      roundFormat = round.format;
      const roundS = TournamentStatus(
        round.startDate.seconds,
        round.endDate.seconds
      );
      const { roundCTA, roundInitImage, roundFact, roundDifficultyPattern, phasePattern, roundDuration } = round;
      if (roundCTA && roundInitImage) {
        localStorage.setItem(
          "roundInfo",
          JSON.stringify({ roundCTA, roundInitImage, roundFact })
        );
      }
      localStorage.setItem("roundTitle", round.title);
      localStorage.setItem("keyboardType", round.keyboardType);
      localStorage.setItem("assertionLogic", round.assertionLogic);
      localStorage.setItem("quizColl", round.quizCollection);
      localStorage.setItem("baseDifficulty", round.baseDifficulty);
      if(phasePattern?.[1]){
        localStorage.setItem("roundDifficultyPattern", phasePattern?.[1]);
      }
      
      
      localStorage.setItem("roundDuration", roundDuration);
      localStorage.setItem(
        POSITIVE_SCORE_LS_KEY,
        round.positiveScore ?? DEFAULT_POSIIVE_SCORE
      );
      localStorage.setItem(
        NEGATIVE_SCORE_LS_KEY,
        round.negativeScore ?? DEFAULT_NEGATIVE_SCORE
      );
      localStorage.setItem(ENABLE_SKIP_LS_KEY, round.enableSkip ?? false);
      if (roundS === "ONGOING" || isPractice) return true;
      else return false;
    } else {
      return false;
    }
  };

  const initialiseGame = async (tournamentId, roundFormat="") => {
    const { activeRound } = tournamentDetails ?? {};
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const roundBaseDifficulty = localStorage.getItem("baseDifficulty");
    //myHeaders.append("Access-Control-Allow-Origin", "*");
    const localStorageChildId = localStorage.getItem("userId");
    const body = JSON.stringify({
      childId: localStorageChildId,
      playerName: localStorageChildId,
      tournamentId,
    });

    let requestOptions = {
      method: "POST",
      headers,
      body,
    };

    try {
      const response = await fetch(`${BASE_URL}/initialize`, requestOptions);
      if (response.status >= 400) {
        // window.location.href = "/error"
        return;
      }
      const result = await response.text();
      let url = `/quiz/tournament?tId=${tournamentId}&rF=${roundFormat}&r=${activeRound}`;
      
      if (NEW_FORMAT_TOURNAMENT_GAMES.includes(roundFormat)) {
        if (roundBaseDifficulty === 6) {
          url = `/quiz/newFormatGame?tId=${tournamentId}&rF=${roundFormat}&r=${activeRound}&pro=Y`;
        } else {
          url = `/quiz/newFormatGame?tId=${tournamentId}&rF=${roundFormat}&r=${activeRound}`;
        }
      }

      if(isDemo){
        url += `&d=S`;
      }

      if(backNavigator){
        
        url = url + `&back=${backNavigator}`;
      }

      localStorage.setItem("gId", result);
      navigate(url);
    } catch (error) {
      console.log("error", error);
    }

  };

  const openGoogleForm = () => {
    const googleFormUrl = 'https://forms.gle/ZtgfqDGJ9Gd2soj98'; // Replace with your Google Form URL
    window.open(googleFormUrl, '_blank');
  };

  const playGame = async () => {
    MEASURE(INSTRUMENTATION_TYPES.PLAY_ROUND, user.id, { tournamentId: tId });
    const { setWeeklyQuiz: isWeeklyQuiz, activeRound } =
      tournamentDetails ?? {};
    setLoading(true);
    const data = [];

    const q = query(
      collection(db, `children/${user.id}/games`),
      where("tournamentId", "==", tId),
      where("round", "==", String(activeRound)),
      where("startTime", "!=", "")
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      data.push({...doc.data(), id: doc.id}); 
    });

    if (!data.length ||  data.length && !data?.[0].endTime && data?.[0].attempts <=1 &&data?.[0]?.results?.length <=1) {
      if(data.length){
        await deleteDoc(doc(collection(db, `children/${user.id}/games`), data[0].id));
        localStorage.removeItem("gameType");

        const gameActionsRef = collection(db, "gameActions");
        const gameActionsQuery = query(
          gameActionsRef,
          where("gameId","==",data[0].id),
          where("actionType", "in", ["START", "END", "INIT"])
        );
  
        const querySnapshot = await getDocs(gameActionsQuery);
        const deletePromises = querySnapshot.docs.map((document) => {
          const docRef = doc(db, "gameActions", document.id);
          return deleteDoc(docRef);
        });

        await Promise.all(deletePromises);

      }
      const status = await checkIfRoundIsActive(tId, activeRound, false);
      if (status) {
        localStorage.setItem("tournamentID", tId);
        localStorage.setItem("roundFormat", roundFormat);
        localStorage.setItem("isWeeklyQuiz", !!isWeeklyQuiz);
        await initialiseGame(tId, roundFormat, activeRound);
      } else {
        // setLoading(false);
        showToast(
          "This round is not active. Please wait for a round to begin."
        );
      }
    } else {
      // setLoading(false);
      showToast(
        "You have already played this round. Please wait for the next round to start."
      );
    }
    setLoading(false);
  };

  const renderTournamentRules = () => {
    return (
      <>
        <div className="py-0 mt-2">
          <div>Follow commentary, Compare notes, Cheer each other on</div>
        </div>
        <div className="mt-3 mb-2">
          <div>
            <span className="text-primary-yellow">Rules:</span> Be respectful |
            No spamming | No foul language
          </div>
          <div>
            <span className="text-[#E3001E]">Penalty:</span> Ban from the tournament
          </div>
        </div>
      </>
    );
  };

  const renderTournamentDetails = () => {
    const showCohorts =
      tournamentDetails?.cohorts?.length;
    const gridClass =
      showCohorts || (SHOW_MONTH_BUTTON && isOpenTenantSelected) || showYourCLass
        ? "grid-cols-3"
        : "grid-cols-2";
    const { name } = tournamentDetails ?? {};
    return (
      <div className="flex flex-col h-auto pt-2" ref={infoContainerRef}>
        <div className="text-lg text-center text-white uppercase">{name}</div>
        <div
          className={twMerge(
            "grid place-items-center mt-2 gap-4 px-4",
            gridClass
          )}
        >
          <AppButton onClick={playGame} className="whitespace-nowrap w-full">
            Play Round
          </AppButton>
          <AppButton onClick={redirectToLeaderboard} className="w-full px-0">
            Leaderboard
          </AppButton>
          {showYourCLass ? (
            <AppButton
            onClick={() => navigate("/class-jam")}
              className="w-full"
            >
              Your Class
            </AppButton>
          ):(isOpenTenantSelected && getUserTournamentRegistrationType(user, tournamentDetails?.tenantIds) === OPEN_USER_FOR_TOURNAMENT && SHOW_MONTH_BUTTON ? (
            <AppButton
            onClick={redirectToSelectTournament}
              className="w-full"
            >
              Next Month
            </AppButton>
          ) : (
            showCohorts ? (
              <AppButton onClick={redirectToOtherPools} className = "w-full px-0">
                View Pools
              </AppButton>
              ) : (
            <></>
          )
          ))}
        </div>
        <div className="my-4 mt-6 flex flex-col justify-center mx-4">
          <span className="uppercase text-primary-yellow text-sm text-center md:text-lg">
            LIVE STUDIO
          </span>
          <div className="bg-[#4a4a4aB3] rounded-lg backdrop-blur-[2px] text-white text-xs md:text-base md:py-2 px-4 md:px-6">
            {renderTournamentRules()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {loading ? (
        <div className="w-full h-screen flex justify-center items-center">
          <Loader />
        </div>
      ) : (
        <Layout
          headerText="Common Room"
          showBack
          showHeader={false}
          onBackClick={handleBack}
        >
          <ArenaHeader goBack={handleBack} headerText="Common Room"  nonArenaRoute={true} />
          <div className="w-full h-full">
            {renderTournamentDetails()}
            <WidgetBot
              server="1131901420883431434"
              channel={tournamentDetails?.discordChannelId}
              width={width}
              height={height}
            ></WidgetBot>
            <ToastComponent />
          </div>
        </Layout>
      )}
    </>
  );
}

export default DiscordChat;