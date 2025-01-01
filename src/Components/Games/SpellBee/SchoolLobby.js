import React, { useEffect, useMemo, useState } from "react";
import {
  BASE_URL,
  DEFAULT_NEGATIVE_SCORE,
  DEFAULT_POSIIVE_SCORE,
  demoGameSettings,
  DEMO_BASE_URL,
  ENABLE_SKIP_LS_KEY,
  NEGATIVE_SCORE_LS_KEY,
  POSITIVE_SCORE_LS_KEY,
  PRACTICE_TOURNAMENT_ID,
  REGISTER_URL,
  UPCOMING_TOURNAMENT_BANNER,
  GAME_ARENA_BANNER,
  DEFAULT_TENANT_ID,
  shareOnWhatsapp,
  getWhatsappMessageForInvite,
  extractMonthlyEarnings,
  sortTournamentsByOrder,
  filterTournamentsByTenantId,
  isTournamentStartingIn24Hours,
} from "../../../Constants/Commons";
import * as FB from "../../Firebase/FirebaseFunctions";
import { TournamentStatus } from "../../utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { PRIMARY_COLOR, SECONDARY_COLOR } from "../../../Constants/Commons";
import Loader from "../../PageComponents/Loader";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Button, Typography, Modal, Dialog } from "@mui/material";
import { CarouselComponent } from "../../Utils/Carousel";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { MEASURE } from "../../../instrumentation";
import { signOut } from "firebase/auth";
import { db, firebaseAuth } from "../../../firebase-config";
import AlertSnackbar from "../../Common/AlertSnackbar";
import axios from "axios";
import { useAuth } from "../../../providers/auth-provider";
import { useApp } from "../../../providers/app-provider";
import { ReactComponent as HelpSvg } from "../../../assets/icons/help.svg";
import { ReactComponent as HelpWhiteSvg } from "../../../assets/icons/helpWhite.svg";
import AppButton from "../../Common/AppButton";
import { getTenantDetails } from "../../../services/tenant";
import ReferralModal from "../../Common/ReferralModal";
import { twMerge } from "tailwind-merge";
import { confirmJoinMaidaan } from "../../../services/child";
import LobbyTournamentSection from "../../Common/LobbyTournamentSection";
import { ARENA_ROUTE, MEMORY_CARDS_ROUTE } from "../../../Constants/routes";
import { GAME_HOUR_START_TIME, GAME_HOUR_END_TIME } from "../../../Constants/Commons";
import { checkGameHour } from "../../../services/child";
import { doc, setDoc } from "firebase/firestore";
import ArenaHeader from "../../../GamesArena/Common/ArenaHeader";
import mixpanel from 'mixpanel-browser';


const ColorButtonSmall = styled(Button)(({ theme }) => ({
  color: "black",
  width: "140px",
  height: "30px",
  backgroundColor: PRIMARY_COLOR,
  fontSize: "calc(0.5vw + 12px) !important",
  "&:hover": {
    backgroundColor: PRIMARY_COLOR,
  },
  fontFamily: "avenir",
}));

const SchoolLobby = (props) => {
  const navigate = useNavigate();

  const { user, getUserDetails, isUserInMaidaanTenant, nonDefaultTenantId } =
    useAuth();

  const { wallet, handleSelectedTenant } =
    useApp();
  //handleSelectedTenant(DEFAULT_TENANT_ID);  
  const [searchParams, setSearchParams] = useSearchParams();
  const isDemoGame = searchParams.get("d") === "Y";
  const group = searchParams.get("group") ?? "";
  const [selectedTenant, setSelectedTenant] = useState(nonDefaultTenantId);
  const isOpenTenantSelected = false;

  const [childData, setChildData] = useState();
  const [completedTournaments, setCompletedTournaments] = useState([]);
  const [ongoingTournaments, setOngoingTournaments] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [weeklyQuizTournament, setweeklyQuizTournament] = useState([]);
  const [quizes, setQuizes] = useState([]);
  const [practiceTournaments, setPracticeTournaments] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openCoinsDialog, setOpenCoinsDialog] = useState(false);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [openReferralModal, setOpenReferralModal] = useState(false);
  const [gameHourDialouge, setGameHourDialouge] = useState(false);
  const [isGameHour, setIsGameHour] = useState(true);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [tenantSwitchLoading, setTenantSwitchLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(
    "You have already played this round. Please wait for the next round to start."
  );
  const [open, setOpen] = useState(false);
  const formData = {
    startTime: GAME_HOUR_START_TIME,
    endTime: GAME_HOUR_END_TIME
  }

  let roundFormat = '';

  const initialiseGame = (tournamentId) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    //myHeaders.append("Access-Control-Allow-Origin", "*");
    const localStorageChildId = localStorage.getItem("userId");
    const body = JSON.stringify({
      childId: localStorageChildId,
      playerName: localStorageChildId,
      tournamentId,
      group: (isDemoGame && group) ? group : undefined,
    });

    let requestOptions = {
      method: "POST",
      headers,
      body,
    };

    const url = isDemoGame ? DEMO_BASE_URL : BASE_URL;
    fetch(`${url}/initialize`, requestOptions)
      .then((response) => {
        if (response.status >= 400) window.location.href = "/error";
        else {
          return response.text();
        }
      })
      .then((result) => {
        let url = `/quiz/tournament?tId=${tournamentId}&rF=${roundFormat}&back=school-lobby`;
        if (isDemoGame) {
          url += `&d=Y&gId=${result}`;
          if (group) {
            url += `&group=${group}`;
          }
        }
        localStorage.setItem("gId", result);
        navigate(url);
      })
      .catch((error) => {
        window.location.href = "/error";
      });
  };

  const getAllRegisteredTournaments = async (tournaments) => {
    if (tournaments) {
      let data = await Promise.all(
        tournaments.map((tId) => FB.getData("tournaments", tId))
      );
      return data;
    }
    return [];
  };

  const redirectToLeaderboard = (tId) => {
    if (!isDemoGame) {
      MEASURE(INSTRUMENTATION_TYPES.ENTER_LEADERBOARD, user.id, {
        tournamentId: tId,
      });
    }
    const gameId = localStorage.getItem("gId");
    let url = `/leaderboard?tId=${tId}&back=school-lobby`;
    if (isDemoGame) {
      url += `&d=Y&gId=${gameId}`;
      if (group) {
        url += `&group=${group}`;
      }
    }
    navigate(url);
    // window.location.href = `/leaderboard?tId=${tId}`;
  };

  const checkIfRoundIsActive = async (tId, activeRound, isPractice = false) => {
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
      const { roundCTA, roundInitImage, roundFact } = round;
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
      localStorage.setItem(POSITIVE_SCORE_LS_KEY, round.positiveScore ?? DEFAULT_POSIIVE_SCORE);
      localStorage.setItem(NEGATIVE_SCORE_LS_KEY, round.negativeScore ?? DEFAULT_NEGATIVE_SCORE);
      localStorage.setItem(ENABLE_SKIP_LS_KEY, round.enableSkip ?? false);
      if (roundS === "ONGOING" || isPractice) return true;
      else return false;
    } else {
      return false;
    }
  };

  const playGame = async (tId, activeRound, isWeeklyQuiz = false, isPractice = false, isQuiz = false) => {
    setLoading(true);
    const data = [];
    if (!isPractice) {
      const localStorageChildId = localStorage.getItem("userId");

      const q = query(
        collection(db, `children/${localStorageChildId}/games`),
        where("tournamentId", "==", tId),
        where("round", "==", String(activeRound)),
        where("startTime", "!=", "")
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        data.push(doc.data());
      });
    }

    if (!data.length || isPractice) {
      checkIfRoundIsActive(tId, activeRound, isPractice).then((status) => {
        if (status) {
          localStorage.setItem("tournamentID", tId);
          localStorage.setItem("roundFormat", roundFormat);
          localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
          localStorage.setItem("isQuiz", isQuiz);
          initialiseGame(tId);
        } else {
          setLoading(false);
          setToastMessage(
            "This round is not active. Please wait for a round to begin."
          );
          setOpen(true);
        }
      });
    } else {
      setLoading(false);
      setToastMessage(
        "You have already played this round. Please wait for the next round to start."
      );
      setOpen(true);
    }
  };

  // const playPractise = (tournament) => {
  //   setLoading(true);
  //   // const { id: tId } = tournament;
  //   // localStorage.setItem("tournamentID", tId);
  //   // localStorage.setItem("roundFormat", roundFormat);
  //   // localStorage.setItem("quizColl", demoCollection);
  //   // localStorage.setItem("keyboardType", demoKeyboardType);
  //   // localStorage.setItem("assertionLogic", demoAssertion);
  //   // localStorage.setItem("roundTitle", demoRoundTitle);
  //   // localStorage.setItem(POSITIVE_SCORE_LS_KEY, demoPositiveScore);
  //   // localStorage.setItem(NEGATIVE_SCORE_LS_KEY, demoNegativeScore);
  //   // localStorage.setItem(ENABLE_SKIP_LS_KEY, demoEnableSkip);
  //   initialiseGame(tId);
  // };
  const handleLogout = async () => {
    await setDoc(doc(db, "children", user.id), {
      online: false,
    }, { merge: true });
    await signOut(firebaseAuth);
    localStorage.clear();
    let redirectUrl = "/login";
    if (isDemoGame) {
      redirectUrl += "?d=Y";
      if (group) {
        redirectUrl += `&group=${group}`;
      }
    }
    navigate(redirectUrl);
  };

  const getPracticeTournaments = async () => {
    setLoading(true);
    const { data } = await axios.get(`${process.env.REACT_APP_NODE_BASE_URL}/tournament/get-practice-tournaments`);
    setLoading(false);
    return data.data;
  };

  const getRegisteredTournaments = async (tournamentList) => {
    setTournamentsLoading(true);
    const tournaments = await getAllRegisteredTournaments(tournamentList);
    let comTour = [],
      ongTour = [],
      upcomTour = [],
      weeklyQuizTour = [];
    let quizes = [];
    let showTenantTab = false;


    tournaments.forEach((tour) => {
      const status = TournamentStatus(
        tour.startDate.seconds,
        tour.endDate.seconds
      );
      if (status === "COMPLETED" && tour.setWeeklyQuiz !== true &&
        !tour.isQuiz) comTour.push(tour);
      if (
        status === "ONGOING" &&
        tour.setWeeklyQuiz !== true &&
        !tour.isQuiz
      )
        ongTour.push(tour);
      if (status === "UPCOMING") upcomTour.push(tour);
      if (tour.setWeeklyQuiz === true) weeklyQuizTour.push(tour);
      if (tour.isQuiz) quizes.push(tour);
    });

    if (tenantSwitchLoading) {
      const isUpcomingTourStartingInLessThan24Hours = upcomTour.some(
        (tour) => {
          return isTournamentStartingIn24Hours(tour.startDate.seconds);
        }
      );
      if (ongTour.length || isUpcomingTourStartingInLessThan24Hours) {
        handleSelectedTenant(nonDefaultTenantId);
        showTenantTab = true;
        /*} else if (isUserInMaidaanTenant) {
          handleSelectedTenant(DEFAULT_TENANT_ID);
          showTenantTab = false;
        }*/
      }
    }
    if (!showTenantTab && isOpenTenantSelected) {
      comTour = filterTournamentsByTenantId(comTour, user, DEFAULT_TENANT_ID);
      ongTour = filterTournamentsByTenantId(ongTour, user, DEFAULT_TENANT_ID);
      upcomTour = filterTournamentsByTenantId(upcomTour, user, DEFAULT_TENANT_ID);
      weeklyQuizTour = filterTournamentsByTenantId(
        weeklyQuizTour,
        user,
        DEFAULT_TENANT_ID
      );
      quizes = filterTournamentsByTenantId(quizes, user, DEFAULT_TENANT_ID);

    } else {
      comTour = filterTournamentsByTenantId(comTour, user, nonDefaultTenantId);
      ongTour = filterTournamentsByTenantId(ongTour, user, nonDefaultTenantId);
      upcomTour = filterTournamentsByTenantId(upcomTour, user, nonDefaultTenantId);
      weeklyQuizTour = filterTournamentsByTenantId(
        weeklyQuizTour,
        user, 
        nonDefaultTenantId
      );
      quizes = filterTournamentsByTenantId(quizes, user, nonDefaultTenantId);
    }
    setCompletedTournaments(sortTournamentsByOrder(comTour));
    setOngoingTournaments(sortTournamentsByOrder(ongTour));
    setUpcomingTournaments(sortTournamentsByOrder(upcomTour));
    setweeklyQuizTournament(sortTournamentsByOrder(weeklyQuizTour));
    setQuizes(sortTournamentsByOrder(quizes));

    setTournamentsLoading(false);
    if (tenantSwitchLoading) setTenantSwitchLoading(false);

    checkGameHour(formData).then(isGameHour => {
      setIsGameHour(isGameHour);
    }
    )
  };

  useEffect(() => {
    const fetchDetails = async () => {
      const storedUserId = localStorage.getItem("userId");
      const storedToken = localStorage.getItem("token");
      const gameId = localStorage.getItem("gId");
      // const selectedTenantLS = localStorage.getItem("selectedTenant");
      localStorage.clear();
      localStorage.setItem("userId", storedUserId);
      localStorage.setItem("token", storedToken);
      // localStorage.setItem("selectedTenant", selectedTenantLS);
      if (isDemoGame && gameId) {
        localStorage.setItem("gId", gameId);
      }
      if (!isDemoGame) {
        setLoading(true);
        setChildData(user);
        if ( user && user.id !== "null" && !user.verifiedOTP) {
          const phoneNumber = user.phoneNumber.substring(3);
          localStorage.setItem("phoneNumber", phoneNumber);
          navigate("/register?source=lobby");
        } else if ( !user || user?.id === "null") {
          localStorage.clear();
          navigate("/login");
        }
      } else {
        const practiceTour = await getPracticeTournaments();
        setPracticeTournaments(practiceTour);
      }
      setLoading(false);
    };

    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTenantDetails = async (tenantId) => {
    if (tenantId) {
      const tenantDetails = await getTenantDetails(tenantId);
      setTenantDetails(tenantDetails);
    }
  };

  useEffect(() => {
    if (nonDefaultTenantId) {
      fetchTenantDetails(nonDefaultTenantId);
    }
  }, [nonDefaultTenantId]);

  useEffect(() => {
    getRegisteredTournaments(user?.registrations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, user?.registrations, nonDefaultTenantId]);

  const handleTournamentRegister = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.REGISTER_TOURNAMENT,
      user.id,
      {}
    );
    navigate("/tournament/select");
  };

  const renderCards = (type) => {
    const currentTime = Math.ceil(new Date().getTime() / 1000);
    if (type === "COMPLETED") {
      return completedTournaments.map((ct, idx) => (
        <div
          key={`com-${idx}`}
          style={{
            width: "100%",
            height: "46vh",
            fontSize: "20px",
            boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
            backgroundColor: "rgba(58,58,58,0.9)",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
              height: "30vh",
              backgroundSize: "cover",
            }}
          />
          <div
            style={{
              margin: "10px",
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {ct.name}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: "16px 10px 16px 10px",
            }}
          >
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => redirectToLeaderboard(ct.id)}
            >
              Leaderboard
            </AppButton>
          </div>
        </div>
      ));
    }
    if (type === "UPCOMING") {
      return upcomingTournaments.map((ct, idx) => (
        <div
          key={`up-${idx}`}
          style={{
            width: "100%",
            height: "40vh",
            fontSize: "20px",
            backgroundColor: "rgba(58,58,58,0.9)",
            boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
              height: "30vh",
              backgroundSize: "cover",
            }}
          />
          <div
            style={{
              margin: "20px 50px 16px 50px",
              color: "white",
              textAlign: "center",
            }}
          >
            {Math.ceil((ct.startDate.seconds - currentTime) / 86400)}{" "}
            {Math.ceil((ct.startDate.seconds - currentTime) / 86400) === 1
              ? "DAY"
              : "DAYS"}{" "}
            TO GO
          </div>
        </div>
      ));
    }
    if (type === "WEEKLYQUIZ") {
      return weeklyQuizTournament.map((ct, idx) => (
        <div
          key={`weekly-${idx}`}
          style={{
            width: "100%",
            height: "50vh",
            fontSize: "20px",
            boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
            backgroundColor: "rgba(58,58,58,0.9)",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
              height: "30vh",
              backgroundSize: "cover",
            }}
          />
          <div
            style={{
              margin: "10px",
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {ct.name}
          </div>
          <div
            style={{
              margin: "10px",
              marginTop: 0,
              color: "white",
              fontSize: "16px",
            }}
          >
            ROUND: {ct.activeRound}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: "16px 10px 16px 10px",
            }}
          >
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => redirectToLeaderboard(ct.id)}
            >
              Your Stats
            </AppButton>
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => playGame(ct.id, ct.activeRound, ct.setWeeklyQuiz)}
            >
              Play Round
            </AppButton>
          </div>
        </div>
      ));
    }
    if (type === "ONGOING") {
      return ongoingTournaments.map((ct, idx) => (
        <div
          key={`ong-${idx}`}
          className="w-full h-full text-xl shadow-[rgba(0,0,0,0.35)] 0px 5px 15px] bg-[rgba(58,58,58,0.9)]"
        >
          <div
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
              height: "30vh",
              backgroundSize: "cover",
            }}
          />
          <div className="md:flex md:justify-between md:px-12 md:py-4">
            <div>
              <div
                style={{
                  margin: "10px",
                  color: "white",
                  textTransform: "uppercase",
                }}
              >
                {ct.name}
              </div>
              <div
                style={{
                  margin: "10px",
                  marginTop: 0,
                  color: "white",
                  fontSize: "16px",
                }}
              >
                ROUND: {ct.activeRound}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                margin: "16px 10px 16px 10px",
              }}
            >
              <AppButton
                className="rounded-lg uppercase"
                onClick={() => enterTournament(ct)}
              >
                Enter Tournament
              </AppButton>
            </div>
          </div>
        </div>
      ));
    }
    if (type === "PRACTICE") {
      return practiceTournaments.map((ct, idx) => (
        <div
          key={`${ct.id}-${idx}`}
          style={{
            width: "100%",
            height: "50vh",
            fontSize: "20px",
            boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
            backgroundColor: "rgba(58,58,58,0.9)",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
              height: "30vh",
              backgroundSize: "cover",
            }}
          />
          <div
            style={{
              margin: "10px",
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {ct.name}
          </div>
          <div
            style={{
              margin: "10px",
              marginTop: 0,
              color: "white",
              fontSize: "16px",
            }}
          >
            ROUND: {ct.activeRound}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: "16px 10px 16px 10px",
            }}
          >
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => redirectToLeaderboard(ct.id)}
            >
              Leaderboard
            </AppButton>
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => playGame(ct.id, ct.activeRound)}
            >
              Play Round
            </AppButton>
          </div>
        </div>
      ));
    }
    if (type === "QUIZES") {
      return quizes.map((ct, idx) => (
        <div
          key={`quiz-${idx}`}
          style={{
            width: "100%",
            height: "50vh",
            fontSize: "20px",
            boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
            backgroundColor: "rgba(58,58,58,0.9)",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
              height: "30vh",
              backgroundSize: "cover",
            }}
          />
          <div
            style={{
              margin: "10px",
              color: "white",
              textTransform: "uppercase",
              margin: "16px 10px 16px 10px"
            }}
          >
            {ct.name}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: "16px 10px 16px 10px",
            }}
          >
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => redirectToLeaderboard(ct.id)}
            >
              Leaderboard
            </AppButton>
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => playGame(ct.id, ct.activeRound, false, false, ct.isQuiz)}
            >
              Play Quiz
            </AppButton>
          </div>
        </div>
      ));
    }
  };

  const renderCoinsDialog = () => {
    return (
      <Dialog
        open={openCoinsDialog}
        onClose={() => setOpenCoinsDialog(false)}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-10 leading-6">
          <div className="text-primary-yellow">How Maidaan Coins work:</div>
          <ul>
            <li>Win Coins by participating in tournaments every month</li>
            <li>Subscribe to transfer winnings to your Vault</li>
            <li>Redeem Coins against prizes of your choice!</li>
          </ul>
          <AppButton
            onClick={() => setOpenCoinsDialog(false)}
            className="rounded-[115px] min-w-[159px] w-[159px] h-[35px] mt-8 min-h-[35px] self-center"
          >
            Understood
          </AppButton>
        </div>
      </Dialog>
    );
  }

  const renderGameHourDialouge = () => {
    return (
      <Dialog
        open={gameHourDialouge}
        onClose={() => setGameHourDialouge(false)}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">
          <div className="text-primary-yellow text-center font-semibold text-lg">BattleGround</div>
          <div className="text-primary-yellow text-center text-base">7 PM - 9 PM | Mon - Sun</div>

          <ul className="my-3 mx-0">
            <p className="my-2 mx-0 ml-[-20px]">Weekly Contest</p>
            <li>LIVE 1-on-1 games, 7 PM - 9 PM</li>
            <li>Play Daily and Earn Points</li>
            <li>Climb up the Leaderboard</li>
            <li>Win Coins at the end of the week</li>
            <p className="my-3 mx-0 ml-[-20px]">Every week, top players win Coins!</p>
          </ul>

          <AppButton
            onClick={() => setGameHourDialouge(false)}
            className="rounded-[115px] min-w-[159px] w-[159px] h-[35px] min-h-[35px] self-center items-center"
          >
            Understood
          </AppButton>
        </div>
      </Dialog>
    );
  }

  /**Weekly Contest
LIVE 1-on-1 games, 7 PM - 9 PM
Play Daily and Earn Points
Climb up the Leaderboard
Win Coins at the end of the week */

const renderLogoutPopup = () => {
  return (
    <Dialog
      open={showLogoutPopup}
      onClose={() => setShowLogoutPopup(false)}
      className="register-success"
    >
      <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">
       
         <ul className="my-3 mx-0">
        <p className="my-2 mx-0 ml-[-30px] text-center">Are you sure you </p>
          <p className="my-3 mx-0 ml-[-30px] text-center">want to logout?</p>
        </ul>
        
        <div className='flex items-center justify-center w-full h-full'>

        <AppButton
          onClick={handleLogout}
          className="rounded-[115px] min-w-[100px] w-[100ppx] h-[35px] min-h-[35px] self-center items-center mr-2"
        >
          Yes
        </AppButton>
        <AppButton
          onClick={() => setShowLogoutPopup(false)}
          className="rounded-[115px] min-w-[100px] w-[100ppx] h-[35px] min-h-[35px] self-center items-center"
        >
          No
        </AppButton>
        </div>
      </div>
    </Dialog>
  );
}

  const handleTransferToVault = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.TRANSFER_TO_VAULT,
      user.id,
      {}
    );
    navigate("/subscribe");
  };
  const handleCheckRewards = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.VIEW_REWARDS,
      user.id,
      {}
    );
    navigate("/wallet");
  };
  const handleRedeemRewards = () => {
    MEASURE(
      INSTRUMENTATION_TYPES.REDEEM_REWARDS,
      user.id,
      {}
    );
    navigate("/wallet");
  };

  const openGoogleForm = () => {
    const googleFormUrl = 'https://forms.gle/ZtgfqDGJ9Gd2soj98'; // Replace with your Google Form URL
    window.open(googleFormUrl, '_blank');
  };

  const enterTournament = (ct) => {
    MEASURE(INSTRUMENTATION_TYPES.ENTER_TOURNAMENT, user.id, { tournamentId: ct.id });
    const url = `/chat?tId=${ct.id}&back=school-lobby`;
    navigate(url);
  };

  const tenantItems = useMemo(() => {
    if (user) {
      const nonDefaultTenantId = user?.tenantIds?.find((id) => id !== DEFAULT_TENANT_ID);
      const items = [
        {
          name: "All-India",
          id: DEFAULT_TENANT_ID,
        },
        {
          name: "School Arena",
          id: nonDefaultTenantId,
        },
      ];
      return items;
    }
    return [];
  }, [user]);

  const handleTenantChange = (tenantId) => {
    handleSelectedTenant(tenantId);
  };

  const joinMaidaan = async () => {
    setTournamentsLoading(true);
    const success = await confirmJoinMaidaan();
    if (success) {
      window.location.reload();
    } else {
      setTournamentsLoading(false);
    }
  };

  const handleNavigateBack = () => {
    //check if the user has maidaan tenant and then navigate to lobby. else navigate to tournament-lobby
    const isMaidaanTenant = user?.tenantIds.includes(DEFAULT_TENANT_ID);
    if (isMaidaanTenant) {
      navigate('/lobby');
    } else {
      navigate('/tournament-lobby');
    }
  };

  /*const renderTenantSwitch = () => {
    const { tenantIds } = user;
    if (!tenantIds || !tenantIds.length || (tenantIds.length === 1 && tenantIds[0] === DEFAULT_TENANT_ID)) return <></>;
    return (
      <div className="w-full h-auto bg-white border-b-primary-gray-10 border-b border-x-0 border-t-0 border-solid flex sticky top-0 z-[1001]">
        {tenantItems.map((item) => {
          const isActive = item.id === selectedTenant;
          return (
            <div
              key={item.id}
              className={twMerge(
                "w-1/2 text-center py-4 font-bold first:border-r first:border-solid first:border-l-0 first:border-y-0 md:text-lg cursor-pointer",
                isActive && "bg-primary-yellow"
              )}
              onClick={() => handleTenantChange(item.id)}
            >
              {item.name}
            </div>
          );
        })}
      </div>
    );
  };*/

  const renderWalletSection = () => {
    if (wallet && isOpenTenantSelected && !tournamentsLoading) {
      const currentMonthFirstThreeLetters = new Date().toLocaleString(
        "default",
        { month: "short" }
      );
      const { isSubscriptionActive } = user;
      const earnings = extractMonthlyEarnings(wallet.monthlyEarnings);

      return (
        <div className="mx-2 mt-4 md:w-full md:flex md:flex-col md:items-center">
          <div className="flex gap-2 items-center mb-2">
            <h3 className="uppercase my-0 mt-1">
              <b>Maidaan Coins</b>
            </h3>
            <HelpSvg
              className="text-black"
              onClick={() => setOpenCoinsDialog(true)}
            />
            {renderCoinsDialog()}
          </div>
          <div className="p-2.5 grid grid-cols-3 bg-primary-gradient text-white rounded-lg max-w-[578px] w-full">
            <div className="space-y-2 flex flex-col justify-center">
              <div className="uppercase text-primary-yellow text-xs text-center">
                {currentMonthFirstThreeLetters} Winnings
              </div>
              <div className="flex justify-center items-center text-xl">
                <img
                  src="/Assets/Icons/trophy.svg"
                  alt="trophy"
                  className="mr-2 h-7"
                />
                {earnings}
              </div>
            </div>
            <div className="flex flex-col justify-evenly gap-2">
              <AppButton
                className="rounded-lg px-[6px] py-[5px] text-xs w-full"
                onClick={() => setOpenReferralModal(true)}
              >
                Invite Friends
              </AppButton>
              {isSubscriptionActive ? (
                <AppButton
                  variant="secondary"
                  className="rounded-lg px-[6px] py-[5px] text-xs w-full"
                  onClick={handleRedeemRewards}
                >
                  Redeem Rewards
                </AppButton>
              ) : (
                <>
                  <AppButton
                    variant="secondary"
                    className="rounded-lg px-[6px] py-[5px] text-xs w-full"
                    onClick={handleCheckRewards}
                  >
                    Check Rewards
                  </AppButton>
                </>
              )}
            </div>
            <div className="space-y-2 flex flex-col justify-center">
              <div className="uppercase text-primary-yellow text-xs text-center">
                Vault Balance
              </div>
              <div className="flex justify-center items-center text-xl">
                <img
                  src="/Assets/Icons/vault.svg"
                  alt="trophy"
                  className="mr-2 h-8"
                />
                {wallet.rewardPoints}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return <></>;
  };

  const renderTournamentCards = () => {
    if (selectedTenant === DEFAULT_TENANT_ID && !isUserInMaidaanTenant && !isDemoGame) {
      return (
        <div className="flex flex-col justify-center items-center h-[calc(100%-52px)] gap-4 px-10">
          <span className="font-bold text-lg">Level-Up!</span>
          <span className="text-left">
            <div>
              Want to battle others across India and win awards?
            </div>
            <div>
            Stay tuned for an exciting update coming soon.
            </div>
          </span>
          {/*<AppButton onClick={joinMaidaan} className="mt-6 w-full">Join the Open Arena</AppButton>*/}
          <AppButton
            //variant="secondary"
            //className="border-primary-gray-20 text-primary-gray-20 w-full"
            onClick={() => handleTenantChange(tenantItems[1].id)}
          >
            Back to School
          </AppButton>
        </div>
      );
    }
    return (
      <>
      {renderLogoutPopup()}
        {!isDemoGame && renderWalletSection()}
        {isDemoGame && practiceTournaments.length ? (
          <>
            <LobbyTournamentSection
              tournaments={practiceTournaments}
              type="PRACTICE"
              title="PRACTICE ARENA"
              playGame={playGame}
              redirectToLeaderboard={redirectToLeaderboard}
              enterTournament={enterTournament}
            />
            <div className="mx-[10px] mt-8">
              <h3 className="md:text-center">
                <b>UPCOMING</b>
              </h3>
              <div className="md:flex md:justify-center">
                <div className="max-w-[578px] w-full h-full text-xl shadow-[rgba(0,0,0,0.35)_0px_5px_15px] bg-[rgba(58,58,58,0.9)]">
                  <div
                  className="banner-card bg-cover"
                    style={{
                      backgroundImage: `url(${UPCOMING_TOURNAMENT_BANNER})`,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-around",
                      margin: "16px 10px 16px 10px",
                    }}
                  >
                    <AppButton
                      className="rounded-lg uppercase"
                      onClick={() => (window.location.href = REGISTER_URL)}
                    >
                      Register
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
        {ongoingTournaments.length ? (
          <LobbyTournamentSection
            tournaments={ongoingTournaments}
            type="ONGOING"
            title="ONGOING"
            itemsPerPage={1}
            playGame={playGame}
            redirectToLeaderboard={redirectToLeaderboard}
            enterTournament={enterTournament}
          />
        ) : null}
        {/* Memory cards game card */}
        {isOpenTenantSelected && !isDemoGame ? (
          <div className="mx-[10px] mt-8">
            <div className="flex gap-2 items-center mb-2">
              <h3 className="uppercase my-0 mt-1">
                <b>BattleGround</b>
              </h3>
              <HelpSvg
                className="text-black"
                onClick={() => setGameHourDialouge(true)}
              />
            </div>
            <div

              className="w-full h-full text-xl shadow-[rgba(0,0,0,0.35)] 0px 5px 15px] bg-[rgba(58,58,58,0.9)]"
            >
              <div
                style={{
                  backgroundImage: `url(${GAME_ARENA_BANNER})`,
                  height: "30vh",
                  backgroundSize: "cover",
                }}
              />
              <div className="md:flex md:justify-between md:px-12 md:py-4">
                <div>
                  <div className="flex justify-between gap-2 items-center mb-2" style={{
                    margin: "10px",
                    color: "white",
                    textTransform: "uppercase",
                  }}>
                    <h3 className="text-white text-sm uppercase my-0 mt-1">
                      {isGameHour ? (
                        <b>Game Hour Ends at 9:00 PM IST</b>
                      ) : (
                        <b>Game Hour starts at 7:00 PM IST</b>
                      )}                    </h3>
                    <HelpWhiteSvg
                      className="text-black"
                      onClick={() => setGameHourDialouge(true)}
                    />
                    {renderGameHourDialouge()}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    padding: "0px 10px 16px 10px",
                  }}
                >
                  <AppButton
                    className="rounded-lg uppercase"
                    onClick={() => {
                      MEASURE(INSTRUMENTATION_TYPES.ARENA_PLAY, user.id, { createdAt: new Date() });
                      navigate(ARENA_ROUTE)
                    }}
                  >
                    Play Now
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
        {/* Memory cards game card */}
        {weeklyQuizTournament.length ? (
          <LobbyTournamentSection
            tournaments={weeklyQuizTournament}
            type="WEEKLYQUIZ"
            title="PRACTICE ARENA"
            playGame={playGame}
            redirectToLeaderboard={redirectToLeaderboard}
            enterTournament={enterTournament}
          />
        ) : null}
        {quizes.length ? (
          <LobbyTournamentSection
            tournaments={quizes}
            type="QUIZES"
            title="TRIVIA CORNER"
            redirectToLeaderboard={redirectToLeaderboard}
            playGame={playGame}
            enterTournament={enterTournament}
          />
        ) : null}
        {upcomingTournaments.length ? (
          <LobbyTournamentSection
            tournaments={upcomingTournaments}
            type="UPCOMING"
            title="UPCOMING"
            playGame={playGame}
            redirectToLeaderboard={redirectToLeaderboard}
            enterTournament={enterTournament}
          />
        ) : null}
        {!isDemoGame && (
          <>
            <div className="mx-[10px] mt-8">
              <h3 className="md:text-center">
                {isOpenTenantSelected ? (
                  <b>REGISTER FOR TOURNAMENTS</b>
                ) : (
                  <b>WEEKEND TIMESLOTS</b>
                )}
              </h3>
              <div className="md:flex md:justify-center">
                <div className="max-w-[578px] w-full h-full text-xl shadow-[rgba(0,0,0,0.35)_0px_5px_15px] bg-[rgba(58,58,58,0.9)]">
                  <div
                    className="w-full bg-cover banner-card"
                    style={{
                      backgroundImage: `url(${!isOpenTenantSelected
                        ? tenantDetails?.scheduleBanner
                        : UPCOMING_TOURNAMENT_BANNER
                        })`,
                    }}
                  />
                  {isOpenTenantSelected && (
                    <div className="p-4 flex justify-around">
                      <AppButton
                        className="rounded-lg uppercase"
                        onClick={handleTournamentRegister}
                      >
                        Register
                      </AppButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {completedTournaments.length ? (
              <LobbyTournamentSection
                tournaments={completedTournaments}
                type="COMPLETED"
                title="COMPLETED"
                playGame={playGame}
                redirectToLeaderboard={redirectToLeaderboard}
                enterTournament={enterTournament}
              />
            ) : null}
          </>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl justify-center relative bg-white">
      {/* <img
        src="/Assets/Images/pattern-light-desktop.svg"
        alt="vector-pattern"
        className="absolute -z-[1] h-full hidden md:block"
      /> */}
      <ArenaHeader
        goBack={handleLogout}
        headerText={user?.firstName}
        nonArenaRoute={true}
        backIcon="logout.svg"
        showDoorIcon={true}
        handleNavigateBack={handleNavigateBack}
        showLogoutPopup={showLogoutPopup}
        setShowLogoutPopup={setShowLogoutPopup}
      />

  
      {/*<div
        id="header"
        className="sticky top-0 w-full h-[50px] bg-[#3a3a3a] flex justify-between items-center z-[999]"
      >
        <div
          style={{
            height: "28px",
            width: "28px",
            backgroundImage: "url('/Assets/Icons/Back.svg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            marginLeft: "4px",
          }}
          onClick={handleNavigateBack}
        />
        <h2 style={{ color: PRIMARY_COLOR }}>LOBBY</h2>
        <div
          style={{
            height: "28px",
            width: "28px",
            backgroundImage: "url('/Assets/Icons/Help.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            marginRight: "4px",
          }}
          onClick={() => {
            setOpenModal(true);
          }}
        ></div>
      </div>*/}
      {loading ? (
        <div className="w-full h-full flex justify-center items-center">
          <Loader />
        </div>
      ) : (


        <div className="relative pb-[90px] w-full h-full overflow-auto overflow-x-hidden">


<div className="w-screen px-[5vw] justify-center">
</div>
          {/*!isDemoGame && !tenantSwitchLoading && renderTenantSwitch()*/}
          {tournamentsLoading ? (
            <div className="w-full h-full flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            renderTournamentCards()
          )}
        </div>
      )}
      <AlertSnackbar
        isOpen={open}
        setIsOpen={setOpen}
        toastMessage={toastMessage}
      />
      <Modal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "70%",
            bgcolor: "#3a3a3a",
            color: "white",
            boxShadow: 24,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography id="modal-modal-title" variant="p" component="h4">
            Please reach out to us about your issue on the tournament WhatsApp
            group or message on +918618006284
          </Typography>
        </Box>
      </Modal>
      <ReferralModal
        open={openReferralModal}
        handleClose={() => setOpenReferralModal(false)}
      />
      
    </div>
  );
};

export default SchoolLobby;