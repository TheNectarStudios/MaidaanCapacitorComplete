import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DEFAULT_TENANT_ID,
  MAIN_GAME_TIMER,
  PRIMARY_COLOR,
  REGISTER_URL,
  SCHOOL_USER_FOR_TOURNAMENT,
  SECONDARY_COLOR,
  TOURNAMENT_ID,
  TOURNAMENT_TYPE,
  extractMonthlyEarnings,
  getDemoFlowData,
  getUserTournamentRegistrationType,
} from "../../../Constants/Commons";
import * as FB from "../../Firebase/FirebaseFunctions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import { TournamentStatus, returnEncryptedUserId } from "../../utils";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import _, { round, set } from "lodash";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../Loader";
import FormControl from "@mui/material/FormControl";
import InputBase from "@mui/material/InputBase";
import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import InsightsIcon from "@mui/icons-material/Insights";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Box from "@mui/material/Box";
import { UserStats } from "./UserStats";
import "./index.css";
import { useAuth } from "../../../providers/auth-provider";
import { useApp } from "../../../providers/app-provider";
import { MEASURE } from "../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import AppButton from "../../Common/AppButton";
import { twMerge } from "tailwind-merge";
import ArenaHeader from "../../../GamesArena/Common/ArenaHeader";
import mixpanel from 'mixpanel-browser';
import { addDoc, collection, doc, getDocs, query } from "firebase/firestore";
import { db } from "../../../firebase-config";
import { Dialog } from "@mui/material";
import CustomizedRating from "../StarRating";

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(3),
  },
  "& .MuiInputBase-input": {
    borderRadius: 4,
    position: "relative",
    background: "rgba(0,0,0,0)",
    color: PRIMARY_COLOR,
    border: "1px solid #ced4da",
    fontSize: 12,
    padding: "6px 26px 6px 12px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {
      borderRadius: 4,
      borderColor: "#80bdff",
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
    },
  },
}));

const ColorButton = styled(Button)(({ theme }) => ({
  color: "black",
  borderRadius: "30px",
  width: "200px",
  backgroundColor: PRIMARY_COLOR,
  fontSize: "calc(0.5vw + 10px) !important",
  "&:hover": {
    backgroundColor: PRIMARY_COLOR,
  },
  fontFamily: "avenir",
}));

const pageHeaders = ["LEADERBOARD", "YOUR STATS"];

const Leaderboard = (props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tId");
  const weeklyQuizParam = searchParams.get("wq");
  const roundParam = searchParams.get("r");
  const tournamentTitleParam = searchParams.get("t");
  const isDemoGame = searchParams.get("d") === "Y";
  const demoGameId = searchParams.get("gId");
  const redirectToChat = searchParams.get("back");
  const ch1 = searchParams.get("ch");
  const userId = localStorage.getItem("userId");
  const group = searchParams.get("group") ?? "";
  const playedRound = searchParams.get("round");
  const hidePlayedRoundPopup = localStorage.getItem("hidePlayedRoundPopup") === "true";

  const hideQualificationPopup = localStorage.getItem("hideQualificationPopup") === "true";

  const isDemo = searchParams.get("d") === "S";
  const { user: userTemp } = useAuth();
  let user;

  if (isDemo) {
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
  const { wallet } = useApp();

  const [data, setData] = useState([]);
  const [roundStatus, setRoundStatus] = useState("COMPLETED");
  const [aggregateOption, setAggregateOption] = useState(0);
  const [aggregateOptionFinal, setAggregateOptionFinal] = useState(3);
  const [tournamentData, setTournamentData] = useState({});
  const [tournamentStatus, setTournamentStatus] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [roundData, setRoundData] = useState({ startDate: {}, endDate: {} });
  const [allRoundData, setAllRoundData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [navValue, setNavValue] = useState(0);
  const [didNotPlayError, setDidNotPlayError] = useState(false);
  const [leaderboardLimit, setLeaderboardLimit] = useState(0);
  const [poolLeaderboardData, setPoolLeaderboardData] = useState([]);
  const [pooTournamentData, setPooTournamentData] = useState({});
  const [poolTournamentId, setPoolTournamentId] = useState("");
  const [userPoolData, setUserPoolData] = useState({});
  const [demoUserPlayedRoundOne, setDemoUserPlayedRoundOne] = useState(false);
  const [showPopup, setShowPopup] = useState({ show: false, type: "" });
  const [roundPlayedPopup, setRoundPlayedPopup] = useState({ show: false, header: "", body1: "", body2: "", playedRound: "" });
  const [selectedRating, setSelectedRating] = useState(0); // Initialize with a default value if needed


  const ELIMINATINFINAL_DROPDOWN_INDEX = 3;
  const QUALIFIERS_DROPDOWN_INDEX = 2;
  const NONELIM_OVERALL_DROPDOWN_INDEX = 0;
  const isTenantIdInTournament = useMemo(() => {

    return getUserTournamentRegistrationType(user, tournamentData?.tenantIds) === SCHOOL_USER_FOR_TOURNAMENT;

  }, [tournamentData, user]);

  const fetchRoundDetails = async (tData) => {
    const rounds = [];
    for (let i = 1; i <= +tData.activeRound; i++) {
      let tournamentId = tData.id;
      if (tData.eliminationFinal && (i == 1 || i == 2)) {
        const poolIds = tData.poolIds;
        tournamentId = poolIds.find((p) => user?.registrations.includes(p));
      }
      const data = await getSingleRoundData(i, tournamentId);
      rounds.push(data);
    }
    setAllRoundData(rounds);
  };

  useEffect(() => {
    if (data && data.length > 0 && isDemo && demoUserPlayedRoundOne && !hideQualificationPopup) {
      const userRank = data.find((d) => d.id === user.id);
      if (userRank && ['Demo_Pitch_A'].includes(tournamentId)) {
        const rank = userRank?.rank;
        if (rank <= 5) {
          setShowPopup({
            show: true,
            type: "success",
          })
        }
        else {
          setShowPopup({
            show: true,
            type: "failure",
          })
        }
      }
    }
  }, [data, isDemo, demoUserPlayedRoundOne, hideQualificationPopup]);

  useEffect(() => {
    if (allRoundData && allRoundData.length > 0 && !hidePlayedRoundPopup && playedRound) {
      //get the element in allRoundData with id = playedRound
      const roundData = allRoundData.find((r) => r.id === playedRound);
      if (!roundData?.endRatingPopup) {
        return;
      }
      let header = ""
      let body1 = ""
      let body2 = ""

      switch (playedRound) {
        case "1":
          header = "Round 1 Played"
          body1 = "Ranks may change as more contestants attempt."
          body2 = "Round 2 timings are 10 AM - 1 PM tomorrow."

          break;
        case "2":
          header = "Round 2 Played"
          body1 = "Ranks may change before 1 PM as more contestants attempt."
          body2 = "Finalists will be declared at 1:30 PM"
          break;
        case "3":
          header = "Final Played"
          body1 = "Ranks may change before 5 PM as more contestants attempt."
          body2 = "Merit list will be declared at 6 PM"
          break;
        default:
          break;
      }
      setRoundPlayedPopup({
        show: true,
        header,
        body1,
        body2,
        playedRound,
      })
    }
  }, [allRoundData, playedRound, hidePlayedRoundPopup]);

  const handleRatingChange = (newValue) => {
    setSelectedRating(newValue);
  };


  const handleStoreRating = async (rating) => {
    if (!rating) return;
    const userRating = {
      rating,
      userId: user.id,
      tournamentId,
      round: playedRound,
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'roundRatings'), userRating);
  };


  const renderRoundPlayedPopup = () => {
    return (
      <Dialog
        open={roundPlayedPopup.show}
        onClose={() => {
          setRoundPlayedPopup({ show: false, header: "", body1: "", body2: "", playedRound: "" });
          localStorage.setItem("hidePlayedRoundPopup", "true");
          handleStoreRating(selectedRating);
        }}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-base">

          <ul className="my-6 mx-0 flex flex-col mb-0">
            <p className="my-2 mx-0 ml-[-30px] text-center text-[18px] text-[#ccf900]">{roundPlayedPopup.header}</p>
            <p className="my-0 mx-0 ml-[-30px] text-center">{roundPlayedPopup.body1}</p>
            <p className="my-0 mx-0 ml-[-30px] text-center text-bold">{roundPlayedPopup.body2}</p>
          </ul>

          <div className='flex items-center justify-center w-full h-full'>
            <CustomizedRating onRatingChange={handleRatingChange} />
          </div>
          <div className='flex items-center justify-center w-full h-full'>
            <AppButton
              onClick={() => { setRoundPlayedPopup({ show: false, header: "", body1: "", body2: "", playedRound: "" }); localStorage.setItem("hidePlayedRoundPopup", "true"); handleStoreRating(selectedRating); }}
              className="rounded-[115px] min-w-[100px] w-[100px] h-[35px] min-h-[35px] self-center items-center  mt-4"
            >
              Proceed
            </AppButton>
          </div>
        </div>
      </Dialog>
    );
  }


  const renderRoundOnePopup = () => {
    return (
      <Dialog
        open={showPopup.show}
        onClose={() => {
          setShowPopup({ show: false, type: "" });
          localStorage.setItem("hideQualificationPopup", "true");
        }}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-base">

          <ul className="my-6 mx-0 flex flex-col gap-4">
            <p className="my-2 mx-0 ml-[-30px] text-center text-[18px] text-[#ccf900]">{showPopup.type === "success" ? " You're in the Finals!" : "Well fought but missed out!"}</p>
            <p className="my-2 mx-0 ml-[-30px] text-start">{showPopup.type === "success" ? "MEGA JOB! Absolutely aced this round. Find yourself on the leaderboard and flex those brain muscles." : (<>Gave it your all but narrowly missed out! We're sure you'll be back with a bang in the next one.<br />True greats are those who keep showing up at the starting line no matter what!</>)}</p>
          </ul>
          <div className='flex items-center justify-center w-full h-full'>
            <AppButton
              onClick={() => { setShowPopup({ show: false, type: "" }); localStorage.setItem("hideQualificationPopup", "true"); }}
              className="rounded-[115px] min-w-[100px] w-[100px] h-[35px] min-h-[35px] self-center items-center"
            >
              Proceed
            </AppButton>
          </div>
        </div>
      </Dialog>
    );
  }

  const getTournamentDetails = async () => {
    const tData = await FB.getData("tournaments", tournamentId);
    setTournamentData(tData);
    await fetchRoundDetails(tData);
    // FB.getData("tournaments", tournamentId).then((t) => {
    //   setTournamentData(t);
    //   console.log("t", t);
    //   fetchRoundDetails();
    //   // t.setWeeklyQuiz && onNavChange(1);
    // });
  };

  const getSingleRoundData = async (activeRound, tournamentId) => {
    const data = await FB.getData(
      `tournaments/${tournamentId}/rounds`,
      String(activeRound)
    );
    // setRoundData(data);
    return data;
  };

  const setDataByAggregateOption = (idx, data, tournamentData, roundData = null, eliminationFinal = false) => {
    const result = [];
    if (eliminationFinal && (idx === ELIMINATINFINAL_DROPDOWN_INDEX + 1 || idx === QUALIFIERS_DROPDOWN_INDEX + 1) || (!eliminationFinal && idx === NONELIM_OVERALL_DROPDOWN_INDEX)) {
      data.forEach((d) => {
        const aggScore = d.score.reduce((pv, cv) => pv + cv, 0);
        const aggCorrectAttempts = d.correctAttempts.reduce((pv, cv) => pv + cv, 0);
        const aggAttempt = d.attempts.reduce((pv, cv) => pv + cv, 0);
        const aggDaysPlayed = d.daysPlayed?.length ?? 0;
        const aggPoints = d.points?.reduce((pv, cv) => pv + cv, 0);
        let finalRoundScore = 0;
        let round1And2Score = 0;
        let finalAccuracy = 0;
        if (tournamentData?.eliminationFinal) {
          finalRoundScore = d.score[d.score.length - 1];
          round1And2Score = aggScore - finalRoundScore;
          finalAccuracy = Math.floor((Number(d.correctAttempts[d.correctAttempts.length - 1]) * 100) / Number(d.attempts[d.attempts.length - 1]));
        }
        else {
          finalAccuracy = Math.floor((Number(aggCorrectAttempts) * 100) / Number(aggAttempt));
        }
        if (!tournamentData?.eliminationFinal || d.round.includes("3")) { // condition to check if elimination final round have been played
          result.push({
            name: isDemoGame ? d.playerName : `${d.firstName} ${d.lastName}`,
            grade: d.grade,
            correctAttempts: aggCorrectAttempts,
            city: d.city,
            score: aggScore,
            school: d.school,
            attempts: aggAttempt,
            daysPlayed: aggDaysPlayed,
            pace: Math.floor(
              (MAIN_GAME_TIMER * aggDaysPlayed) / Number(aggAttempt)
            ),
            accuracy: finalAccuracy,
            id: d.id,
            points: aggPoints ?? 0,
            finalRoundScore,
            round1And2Score,
          });
        }
      });
    } else {
      data.forEach((d) => {
        const indexPosition = d.round.indexOf(String(idx));
        if (indexPosition > -1) {
          const qId = indexPosition;
          result.push({
            name: isDemoGame ? d.playerName : `${d.firstName} ${d.lastName}`,
            grade: d.grade,
            city: d.city,
            score: d.score[qId],
            attempts: d.attempts[qId],
            correctAttempts: d.correctAttempts[qId],
            daysPlayed: 0,
            pace: Math.floor(MAIN_GAME_TIMER / d.attempts[qId]),
            accuracy: Math.floor(
              (Number(d.correctAttempts[qId]) * 100) / Number(d.attempts[qId])
            ),
            id: d.id,
            points: d.points?.[qId] ?? 0,
          });
        }
      });
    }

    const aggregator = tournamentData?.leaderboardAggregator ?? "score";
    const orderedValue = _.orderBy(
      result,
      [aggregator, "accuracy"],
      ["desc", "desc"]
    );

    let rank = 1;
    let diff = 0;
    orderedValue.forEach((d, index) => {
      if (index > 0) {
        if (
          orderedValue[index - 1][aggregator] === d[aggregator] &&
          orderedValue[index - 1].accuracy === d.accuracy
        ) {
          d.rank = rank;
          diff++;
        } else {
          rank = rank + 1 + diff;
          d.rank = rank;
          diff = 0;
        }
      } else {
        d.rank = 1;
      }
      d.coins = tournamentData?.rewardPointsMap?.[d.rank] ?? 0;
      const roundStatus = allRoundData.find((r) => r.status === "IN_PROGRESS");
      let finalPoints = d.points ?? 0;
      if (idx === 0 || roundStatus?.id === String(idx)) {
        const dynamicPoints = roundStatus?.pointsRankMap?.[d.rank] ?? 0;
        finalPoints += dynamicPoints;
      }
      d.points = finalPoints;
    });
    setData(orderedValue);
    const leaderboardLimit = getLeaderboardShowLimit(orderedValue, tournamentData.leaderboardLimit);
    setLeaderboardLimit(leaderboardLimit);
    setLoading(false);
  };

  const getLeaderboardShowLimit = (data, limit) => {
    let showLimit = limit;
    while (showLimit < data.
      length && data[showLimit].rank == data[showLimit - 1].rank) {
      showLimit++;
    }
    return showLimit;
  }

  const fetchLeaderboardDetails = async () => {
    const leaderboardData = await FB.getAllDocs(
      `tournaments/${tournamentId}/leaderboard`, isDemo, userId
    );
    setLeaderboardData(() => { setLoadingLeaderboard(false); return leaderboardData });
    // setDataByAggregateOption(0, leaderboardData);
    // setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setLoadingLeaderboard(true);
    getTournamentDetails();
    fetchLeaderboardDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchDemoUserPlayedRoundOne = async () => {
      if (isDemo) {
        //check if player has played round 1
        const queryRef = query(collection(db, 'children', userId, 'games'));
        const querySnapshot = await getDocs(queryRef);
        if (querySnapshot.empty) {
          setDemoUserPlayedRoundOne(false);
        } else {
          const games = querySnapshot.docs.map(doc => ({
            ...doc.data(), id: doc.id
          }));
          const game = games.find(g => g.tournamentId === "Demo_Pitch_A" && g.round === "2");
          if (!!game && game.endTime) {
            setDemoUserPlayedRoundOne(true);
          }
          else {
            setDemoUserPlayedRoundOne(false);
          }
        }
      }
    };

    fetchDemoUserPlayedRoundOne();
  }, [isDemo]);


  useEffect(() => {
    if (tournamentData && leaderboardData.length && allRoundData.length && loading) {
      const index = tournamentData?.eliminationFinal ? ELIMINATINFINAL_DROPDOWN_INDEX : 0;
      setDataByAggregateOption(index, leaderboardData, tournamentData, null, !!tournamentData.eliminationFinal);
    } else if (!leaderboardData.length && !allRoundData.length && loading && !loadingLeaderboard) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentData, leaderboardData, allRoundData, loading, loadingLeaderboard]);

  useEffect(() => {
    if (roundData.startDate.seconds) {
      const roundS = TournamentStatus(
        roundData.startDate.seconds,
        roundData.endDate.seconds
      );
      setRoundStatus(roundS);
    }
  }, [roundData]);

  useEffect(() => {
    if (tournamentData && tournamentData.name) {
      const tStatus = TournamentStatus(
        tournamentData.startDate.seconds,
        tournamentData.endDate.seconds
      );
      setTournamentStatus(tStatus);
    }

    const getPoolLeaderboardData = async () => {
      if (user && tournamentData?.poolIds) {
        const poolTournamentId = tournamentData.poolIds.find((p) => user?.registrations.includes(p));
        const poolLeaderboardData = await FB.getAllDocs(
          `tournaments/${poolTournamentId}/leaderboard`, isDemo, userId
        );
        const pooTournamentData = await FB.getData("tournaments", poolTournamentId);
        setPoolTournamentId(poolTournamentId);
        setPoolLeaderboardData(poolLeaderboardData);
        setUserPoolData(poolLeaderboardData.find((d) => d.id === user?.id));
        setPooTournamentData(pooTournamentData);
      }
    };
    getPoolLeaderboardData();
  }, [tournamentData]);


  const handleChange = async (event) => {
    setAggregateOption(event.target.value);
    let roundData = null;
    if (event.target.value > 0) {
      roundData = allRoundData[event.target.value - 1]
      setRoundData(roundData);
    } else {
      // setDataByAggregateOption(event.target.value, leaderboardData);
      setRoundStatus("COMPLETED");
    }
    setDataByAggregateOption(event.target.value, leaderboardData, tournamentData, roundData);
  };

  const handleFinalChange = async (event) => {
    setAggregateOptionFinal(event.target.value);
    let roundData = null;
    if (event.target.value != 2 && event.target.value != 3) {
      roundData = allRoundData[event.target.value]
      setRoundData(roundData);
    }
    else {
      setRoundStatus("COMPLETED");
    }
    if (event.target.value !== 3) {
      setDataByAggregateOption(event.target.value + 1, poolLeaderboardData, pooTournamentData, roundData, true);
    }
    else {
      roundData = allRoundData[event.target.value - 1];
      setRoundData(roundData);
      setDataByAggregateOption(event.target.value + 1, leaderboardData, tournamentData, roundData, true);
    }
  }

  const goToCohorts = () => {
    let url = `/leaderboard/cohorts?tId=${tournamentId}`;
    if (redirectToChat) {
      url += `&back=${redirectToChat}&ch=1`;
    }

    if (isDemo) {
      url += `&d=S`;
    }
    navigate(url);
  };

  const onNavChange = (event, newValue) => {
    setNavValue(newValue);
  };

  const getPageTitle = () => {
    if (navValue === 0 && tournamentData.setWeeklyQuiz) {
      return "YOUR STATS";
    }
    return "LEADERBOARD";
  };

  const getUserStatsData = useCallback(() => {
    if (isDemoGame && demoGameId) {
      return leaderboardData.find((d) => d.id === demoGameId) ?? [];
    }
    if (tournamentData.eliminationFinal && userPoolData) {
      //concatinate the data of user from pool and main tournament
      const lData = leaderboardData.find((d) => d.id === user?.id) ?? [];
      const pLData = poolLeaderboardData.find((d) => d.id === user?.id) ?? [];
      for (const [key, value] of Object.entries(pLData)) {
        if (Array.isArray(value)) {
          lData[key] = (lData[key] || []).concat(value);
        }
      }
      return { ...lData };
    }
    else {
      const lData = leaderboardData.find((d) => d.id === user?.id) ?? [];
      return { ...lData };
    }
  }, [isDemoGame, leaderboardData, userPoolData, tournamentData]);

  const userRankData = useMemo(
    () => data.find((d) => d.id === user?.id),
    [data]
  );

  const didNotPay = useMemo(() => {
    if (userRankData && aggregateOption > 0) {
      return userRankData?.round?.includes(String(aggregateOption));
    }
    return true;
  }, [aggregateOption, userRankData, aggregateOptionFinal]);

  const handleCheckRewards = () => {
    MEASURE(INSTRUMENTATION_TYPES.VIEW_REWARDS, user.id, {});
    navigate("/wallet");
  };

  const handleBack = () => {
    if (user) {
      MEASURE(INSTRUMENTATION_TYPES.LEADERBOARD_BACK, user.id, {
        tournamentId,
      });
    }
    let url = "";
    if (redirectToChat && ch1 === "1" && !isDemoGame) {
      //url = `/chat?back=${redirectToChat}`;
      url = `/chat?tId=${tournamentId}&back=${redirectToChat}`;
    }
    else if (redirectToChat && !isDemoGame) {
      url = `/${redirectToChat}`;
    } else {
      url = "/tournament-lobby";
      if (isDemoGame) {
        url += "?d=Y";
        if (group) {
          url += `&group=${group}`;
        }
      }
    }
    if (isDemo) {
      if (redirectToChat === "pop-quiz-lobby") {
        url = `/pop-quiz-lobby?d=S`;
      }
      else if (demoUserPlayedRoundOne || !redirectToChat) {
        url = `/lobby-demo?d=S`;
      }
      else {
        url += `&d=S`;
      }
    }
    navigate(url);
  };

  const isPremierTournament = useMemo(() => {
    return user?.premierOpenTournaments?.includes(
      tournamentData?.tournamentNumber
    );
  }, [tournamentData?.tournamentNumber, user?.premierOpenTournaments]);

  const renderRewardsBanner = () => {
    return (
      <div className="mx-2 mt-4">
        <div className="flex gap-2 items-center mb-2">
          <span className="my-0 mt-1">
            <b className="uppercase">Reward system</b>&nbsp;
          </span>
        </div>
        <div className="p-2.5 grid grid-cols-6 bg-primary-gradient text-white rounded-lg items-center">
          <img
            src="/Assets/Icons/trophy.svg"
            alt="trophy"
            className="mr-2 h-12"
          />
          <div className="flex flex-col col-span-3 text-xs text-primary-yellow justify-center">
            <div>Qualify for the finals</div>
            <div>Win Coins</div>
            <div>Redeem against Rewards</div>
          </div>
          <div className="col-span-2 justify-self-end">
            <button
              className=" bg-primary-yellow outline-none border border-solid border-primary-yellow rounded-lg px-[6px] py-[5px] !text-xs w-auto text-[#3a3a3a]"
              onClick={handleCheckRewards}
            >
              Check Rewards
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWalletSection = () => {
    if (
      !wallet ||
      isTenantIdInTournament ||
      tournamentData?.isQuiz === true ||
      tournamentData?.setWeeklyQuiz === true ||
      !isPremierTournament
    )
      return <></>;
    if (!tournamentData?.rewardPointsMap) {
      if (!isTenantIdInTournament) {
        return renderRewardsBanner();
      }
    }
    const currentMonthFirstThreeLetters = new Date().toLocaleString("default", {
      month: "short",
    });
    let istournamentEnded = tournamentData.isTournamentEnded;
    const { id, isSubscriptionActive } = user;
    const userPointsForToday = data.find((d) => d.id === id)?.coins ?? 0;
    const { monthlyEarnings, rewardPoints } = wallet;
    const earnings = extractMonthlyEarnings(monthlyEarnings);
    const currentMonthsTotalPoints = earnings + userPointsForToday;
    let totalVaultPoints = parseInt(currentMonthsTotalPoints) + parseInt(rewardPoints);
    if (isSubscriptionActive) {
      totalVaultPoints = parseInt(rewardPoints) + parseInt(userPointsForToday);
    }
    let endGamePoints;
    if (isSubscriptionActive) {
      endGamePoints = rewardPoints;
    } else {
      endGamePoints = parseInt(earnings) + parseInt(rewardPoints);
    }
    return istournamentEnded ? (

      <div className="mx-2 mt-4 md:w-full md:flex md:flex-col md:items-center">
        <div className="flex gap-2 items-center mb-2">
          <span className="my-0 mt-1">
            <b className="uppercase">Your Winnings</b>&nbsp;
          </span>
        </div>
        <div className="p-2.5 grid grid-cols-2 bg-primary-gradient text-white rounded-lg max-w-[578px] w-full justify-around">
          <div className="space-y-2 ">
            <div className="uppercase text-primary-yellow text-xs text-center">
              This Tournament
            </div>
            <div className="flex justify-center items-center text-xl">
              <img
                src="/Assets/Icons/trophy.svg"
                alt="trophy"
                className="mr-2 h-7"
              />
              {userPointsForToday}
            </div>
          </div>

          <div className="space-y-2">
            <div className="uppercase text-primary-yellow text-xs text-center">
              Vault Balance
            </div>
            <div className="flex justify-center items-center text-xl">
              <img
                src="/Assets/Icons/vault.svg"
                alt="trophy"
                className="mr-2 h-8"
              />
              {rewardPoints}
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center justify-between mt-4">
          <span className="text-sm uppercase" style={{ fontSize: 12 }}>
            Use vault balance for prizes
          </span>
          <AppButton
            onClick={handleCheckRewards}
          >
            Check Rewards
          </AppButton>
        </div>
      </div>


    ) : (<div className="mx-2 mt-4 md:w-full md:flex md:flex-col md:items-center">
      <div className="flex gap-2 items-center mb-2">
        <span className="my-0 mt-1">
          <b className="uppercase">Projected Winnings</b>&nbsp;
          <span className="text-[10px]">(Based on current rank)</span>
        </span>
      </div>
      <div className="p-2.5 grid grid-cols-2 bg-primary-gradient text-white rounded-lg max-w-[578px] w-full">
        <div className="space-y-2">
          <div className="uppercase text-primary-yellow text-xs text-center">
            Current Rank
          </div>
          <div className="flex justify-center items-center text-xl">
            <img
              src="/Assets/Icons/trophy.svg"
              alt="trophy"
              className="mr-2 h-7"
            />
            {userRankData?.rank ? userRankData?.rank : "--"}
          </div>
        </div>
        <div className="space-y-2">
          <div className="uppercase text-primary-yellow text-xs text-center">
            This Tournament
          </div>
          <div className="flex justify-center items-center text-xl">
            <img
              src="/Assets/Icons/dollar.svg"
              alt="trophy"
              className="mr-2 h-7"
            />
            {userPointsForToday}
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center justify-between mt-4">
        <span className="text-sm uppercase" style={{ fontSize: 12 }}>
          Use vault balance for prizes
        </span>
        <AppButton
          // className=" bg-primary-yellow outline-none border border-solid border-primary-yellow rounded-lg px-[6px] py-[5px] !text-xs w-[140px] text-[#3a3a3a]"
          onClick={handleCheckRewards}
        >
          Check Rewards
        </AppButton>
      </div>
    </div>
    )
  };

  const renderRegisterButtonSection = () => {
    return (
      <div
        style={{
          margin: "20px 10px 10px 10px",
          color: SECONDARY_COLOR,
        }}
        className={twMerge(
          "flex items-center",
          isDemoGame && demoGameId ? "justify-between" : "justify-center"
        )}
      >
        <b>
          <span className="uppercase md:text-xl">
            {tournamentData.name}
            {tournamentData?.cohorts?.length && !(isDemo && tournamentData?.eliminationFinal)
              ? `: ${tournamentData?.cohortName}`
              : ""}
          </span>
        </b>
        {isDemoGame && demoGameId ? (
          <ColorButton
            onClick={() => {
              window.location.href = REGISTER_URL;
            }}
            variant="contained"
          >
            Register
          </ColorButton>
        ) : null}
      </div>
    );
  };

  const renderFourthColumn = (row) => {
    if (!isDemoGame && isPremierTournament) {
      if (tournamentData?.rewardPointsMap && aggregateOption === 0) {
        return <>{row.coins}</>;
      }
      if (tournamentData?.leaderboardAggregator === "points") {
        return <>{row.points}</>;
      }
    }
    return (
      <>
        {Number.isFinite(row.accuracy) ? row.accuracy : 0}{" "}
        <span style={{ fontSize: 11 }}>%</span>
      </>
    );
  };

  const renderScoreOrPace = (row) => {
    if (!isDemoGame && aggregateOption !== 0) {
      return (
        <td className="text-center">
          {row.score}
        </td>
      );
    }
    if (tournamentData?.leaderboardAggregator === "points") {
      return <td>{row.points}</td>;
    }
    if (tournamentData.carryOverPoints && Object.keys(tournamentData.carryOverPoints)?.length && aggregateOptionFinal === ELIMINATINFINAL_DROPDOWN_INDEX) {
      return (
        <>
          <td className="text-center">{row.round1And2Score}</td>
          <td className="text-center">{row.finalRoundScore}</td>
          <td className="text-center">{row.score}</td>
        </>
      );
    }
    return (
      <td className="text-center">
        {row.score}
      </td>
    );
  };

  const renderThirdColumnHeader = () => {
    let colSpan = 1;
    if (tournamentData?.carryOverPoints && Object.keys(tournamentData.carryOverPoints)?.length && aggregateOptionFinal === ELIMINATINFINAL_DROPDOWN_INDEX) {
      colSpan = 3;
    };
    return (
      <th className="bg-primary-yellow text-black px-1" colSpan={colSpan}>
        {!isDemoGame && aggregateOption !== 0 ? (
          "Score"
        ) : tournamentData?.leaderboardAggregator === "points" ? (
          "Points"
        ) : (
          <>Score</>
        )}
      </th>
    );
  };

  const leaderboardHighlightLimit = () => {
    let showLimit = tournamentData?.numberOfQualifiers ?? 0;
    while (showLimit != 0 && showLimit < data.length && data[showLimit].rank == data[showLimit - 1].rank) {
      showLimit++;
    }
    return showLimit;
  }

  const render4thColumnHeader = () => {
    if (!isDemoGame && isPremierTournament) {
      if (tournamentData?.rewardPointsMap && aggregateOption === 0) {
        return "Coins";
      }
      if (tournamentData?.leaderboardAggregator === "points") {
        return "Points";
      }
    }
    return "Accuracy";
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl items-center justify-center relative bg-white">
      {/* <img
        src="/Assets/Images/pattern-light-desktop.svg"
        alt="vector-pattern"
        className="absolute -z-[1] h-full hidden md:block"
      /> */}
      <ArenaHeader goBack={handleBack} headerText={getPageTitle()} nonArenaRoute={true} />
      {/*<div
        id="header"
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "50px",
          backgroundColor: SECONDARY_COLOR,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 9999,
        }}
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
          onClick={handleBack}
        />
        <h3 style={{ color: PRIMARY_COLOR }}>{getPageTitle()}</h3>
        <div style={{ width: "28px", marginLeft: "4px" }}></div>
      </div>*/}
      {loading ? (
        <div
          style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Loader />
        </div>
      ) : (
        <div className="h-full w-full overflow-auto">
          {navValue === 0 && !tournamentData.setWeeklyQuiz ? (
            <>
              {renderWalletSection()}
              {renderRegisterButtonSection()}
              {!isDemoGame ? (
                <>
                  <div className="w-full bg-[#575757] mt--2.5 flex items-center justify-between gap-4 p-2.5 md:px-8">
                    <div className=" text-white text-sm">
                      <b>Round: </b>{" "}
                      {tournamentData &&
                        tournamentData.activeRound &&
                        !tournamentData.eliminationFinal ? (
                        <Select
                          id="t-select"
                          sx={{
                            color: "white",
                            ".MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(228, 219, 233, 0.25)",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(228, 219, 233, 0.25)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(228, 219, 233, 0.25)",
                            },
                            ".MuiSvgIcon-root ": {
                              fill: "white !important",
                            },
                          }}
                          value={aggregateOption}
                          label="Select Round"
                          onChange={handleChange}
                          input={<BootstrapInput />}
                        >
                          <MenuItem value={0}>Overall</MenuItem>
                          {Array.from(
                            Array(Number(tournamentData?.activeRound))
                          ).map((e, i) => (
                            <MenuItem key={i} value={i + 1}>
                              Round {i + 1}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        tournamentData?.activeRound && <Select
                          id="t-select"
                          sx={{
                            color: "white",
                            ".MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(228, 219, 233, 0.25)",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(228, 219, 233, 0.25)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(228, 219, 233, 0.25)",
                            },
                            ".MuiSvgIcon-root ": {
                              fill: "white !important",
                            },
                          }}
                          value={aggregateOptionFinal}
                          label="Select Round"
                          onChange={handleFinalChange}
                          input={<BootstrapInput />}
                        >
                          {Array.from(
                            Array(Number(tournamentData.activeRound - 1))
                          ).map((e, i) => (
                            <MenuItem key={i} value={i}>
                              {`${`Round ${i + 1}`}`}
                            </MenuItem>

                          ))}
                          <MenuItem value={2}>Overall Qualifiers</MenuItem>
                          <MenuItem value={3}>Finals</MenuItem>
                        </Select>
                      )}
                      {/* {tournamentData.eliminationFinal ? (
                        <span className="text-primary-yellow">Final</span>
                      ) : null} */}
                    </div>
                    <div className="text-white text-sm mt-0.5">
                      Active:{" "}
                      <span className="text-primary-yellow">
                        R{tournamentData.activeRound}
                      </span>
                    </div>
                  </div>
                  {tournamentData?.leaderboardLimit ||
                    tournamentData?.cohorts?.length ? (
                    <div className="w-full bg-[#575757] flex items-center justify-between gap-4 p-2.5 md:px-8">
                      {tournamentData?.leaderboardLimit ? (
                        <div className=" text-white text-sm">
                          <b>Your Rank: </b>{" "}
                          <span className="text-primary-yellow">
                            {userRankData?.rank ?? "N/A"}
                          </span>
                        </div>
                      ) : (
                        <></>
                      )}
                      {tournamentData?.cohorts?.length ? (
                        <div className="text-white">
                          <AppButton
                            className=" min-h-8 h-8"
                            onClick={goToCohorts}
                          >
                            Other Pool Results
                          </AppButton>
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                  ) : (
                    <></>
                  )}
                </>
              ) : null}
              <div className="w-full">
                {!isDemoGame && tournamentData?.leaderboardLimit ? (
                  <div className="p-2.5 uppercase md:px-8">
                    {tournamentData?.leaderboardLimit
                      ? `Current Top ${tournamentData?.leaderboardLimit}`
                      : ""}
                    {aggregateOption > 0 && didNotPay ? (
                      <span className="ml-4">(You did not play)</span>
                    ) : (
                      <></>
                    )}
                  </div>
                ) : (
                  <></>
                )}
                <table className="table-auto overflow-auto border-collapse w-full">
                  <thead className="h-9 text-sm sticky top-0">
                    <tr>
                      <th className="bg-primary-yellow text-black px-1">
                        Rank
                      </th>
                      <th className="bg-primary-yellow text-black px-1">
                        Name
                      </th>
                      {renderThirdColumnHeader()}
                      <th className="bg-primary-yellow text-black px-1">
                        {render4thColumnHeader()}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#575757] text-white text-sm">
                    {tournamentData.carryOverPoints && Object.keys(tournamentData.carryOverPoints)?.length && aggregateOptionFinal == ELIMINATINFINAL_DROPDOWN_INDEX && (
                      <tr className="text-black sticky top-9">
                        <td className="bg-primary-yellow"></td>
                        <td className="bg-primary-yellow"></td>
                        <td
                          className="bg-primary-yellow text-xs px-1 text-center"
                          style={{ borderRight: "1px solid" }}
                        >
                          Qualifiers
                        </td>
                        <td
                          className="bg-primary-yellow text-xs px-1 text-center"
                          style={{ borderRight: "1px solid" }}
                        >
                          Finals
                        </td>
                        <td className="bg-primary-yellow text-xs px-1 text-center">
                          Total
                        </td>
                        <td className="bg-primary-yellow"></td>
                      </tr>
                    )}
                    {data
                      .slice(0, leaderboardLimit)
                      .map((row, i) => {
                        return (
                          <tr>
                            <td className="text-center">{row.rank}</td>
                            <td
                              className={twMerge(
                                "pt-2",
                                !isDemoGame &&
                                i < leaderboardHighlightLimit() &&
                                "text-primary-yellow"
                              )}
                            // onClick={() => navigate(`/profile/${returnEncryptedUserId(row.id)}`)}
                            >
                              {row.name}
                              {row.grade ? (
                                <div className="flex flex-col text-[11px] justify-center">
                                  <span>Class {row.grade}</span>
                                  <span>{row.school}</span>
                                </div>
                              ) : null}
                            </td>
                            {renderScoreOrPace(row)}
                            <td className="text-center">
                              {renderFourthColumn(row)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {isDemoGame && !demoGameId ? (
                <div
                  style={{
                    width: "100%",
                    paddingTop: 20,
                    display: "flex",
                    position: "absolute",
                    bottom: "-100px",
                    marginBottom: "50px",
                    justifyContent: "center",
                  }}
                >
                  <ColorButton
                    onClick={() => {
                      window.location.href = REGISTER_URL;
                    }}
                    variant="contained"
                  >
                    Register
                  </ColorButton>
                </div>
              ) : null}
            </>
          ) : (
            <div>
              {renderWalletSection()}
              {renderRegisterButtonSection()}
              <UserStats
                tournamentId={tournamentId}
                poolTournamentId={poolTournamentId}
                userPoolData={userPoolData}
                isEliminationFinal={tournamentData.eliminationFinal}
                activeRound={tournamentData.activeRound}
                isDemoGame={isDemoGame}
                data={getUserStatsData()}
              />
            </div>
          )}
        </div>
      )}

      {(isDemoGame && demoGameId) ||
        (!isDemoGame && userId && !loading && tournamentData) ? (
        <div className="sticky bottom-0 w-full">
          {!tournamentData.setWeeklyQuiz ? (
            <BottomNavigation
              showLabels
              value={navValue}
              onChange={onNavChange}
              sx={{
                bgcolor: "#3a3a3a",
                "& .Mui-selected": {
                  "& .MuiSvgIcon-root, & .MuiBottomNavigationAction-label": {
                    color: "#ccf900",
                  },
                },
              }}
            >
              <BottomNavigationAction
                label="Leaderboard"
                icon={<EmojiEventsIcon />}
                style={{ color: "#ababab" }}
              />
              <BottomNavigationAction
                label="Your Stats"
                icon={<InsightsIcon />}
                style={{ color: "#ababab" }}
              />
            </BottomNavigation>
          ) : (
            <BottomNavigation
              showLabels
              value={navValue}
              onChange={onNavChange}
              sx={{
                bgcolor: "#3a3a3a",
                "& .Mui-selected": {
                  "& .MuiSvgIcon-root, & .MuiBottomNavigationAction-label": {
                    color: "#ccf900",
                  },
                },
              }}
            >
              <BottomNavigationAction
                label="Your Stats"
                icon={<InsightsIcon />}
                style={{ color: "#ababab" }}
              />
            </BottomNavigation>
          )}
        </div>
      ) : null}
      {renderRoundOnePopup()}
      {renderRoundPlayedPopup()}
      {/* {isDemoGame && demoGameId ? (
        <Paper
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999 }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={navValue}
            onChange={onNavChange}
            sx={{
              bgcolor: "#3a3a3a",
              "& .Mui-selected": {
                "& .MuiSvgIcon-root, & .MuiBottomNavigationAction-label": {
                  color: "#ccf900",
                },
              },
            }}
          >
            <BottomNavigationAction
              label="Leaderboard"
              icon={<EmojiEventsIcon />}
              style={{ color: "#ababab" }}
            />
            <BottomNavigationAction
              label="Your Stats"
              icon={<InsightsIcon />}
              style={{ color: "#ababab" }}
            />
          </BottomNavigation>
        </Paper>
      ) : null} */}
    </div>
  );
};

export default Leaderboard;
