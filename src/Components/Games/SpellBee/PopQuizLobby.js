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
    getDemoFlowData,
} from "../../../Constants/Commons";
import * as FB from "../../Firebase/FirebaseFunctions";
import { TournamentStatus } from "../../utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    collection,
    deleteDoc,
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

const PopQuizLobby = (props) => {

    const navigate = useNavigate();

    const { user: userTemp, getUserDetails, isUserInMaidaanTenant, nonDefaultTenantId } =
        useAuth();

    const { wallet, selectedTenant, handleSelectedTenant, isOpenTenantSelected } =
        useApp();
    handleSelectedTenant(DEFAULT_TENANT_ID);
    const [searchParams, setSearchParams] = useSearchParams();
    const isDemoGame = searchParams.get("d") === "Y"
    const isDemo = searchParams.get("d") === "S";
    const group = searchParams.get("group") ?? "";

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

    const [gotRegisteredTournaments, setGotRegisteredTournaments] = useState(false);


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
                
                if (response.status >= 400)  window.location.href = "/error";
                else {
                    return response.text();
                }
            })
            .then((result) => {
                let url = `/quiz/tournament?tId=${tournamentId}&rF=${roundFormat}`;
                if (isDemoGame) {
                    url += `&d=Y&gId=${result}`;
                    if (group) {
                        url += `&group=${group}`;
                    }
                }
                if(isDemo){
                    url += `&d=S`;
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
        let url = `/leaderboard?tId=${tId}&back=pop-quiz-lobby`;
        if (isDemoGame) {
            url += `&d=Y&gId=${gameId}`;
            if (group) {
                url += `&group=${group}`;
            }
        }
        if(isDemo){
            url += `&d=S`;
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
                round?.startDate?.seconds,
                round?.endDate?.seconds
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
                data.push({...doc.data(), id: doc.id});
            });
        }
        if (!data.length || isPractice || data.length && !data?.[0].endTime && data?.[0].attempts <=1 && data?.[0]?.results?.length <=1) {
            if(data.length){
                await deleteDoc(doc(collection(db, `children/${user.id}/games`), data[0].id));
                localStorage.removeItem("gameType");
            }
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
    /*const handleLogout = async () => {
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
    };*/

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
                tour?.startDate?.seconds,
                tour?.endDate?.seconds
            );
            if (status === "ONGOING" && tour.setWeeklyQuiz === true && !tour.parentTournament)
             quizes.push(tour);
        });

        quizes = [...new Set(quizes)]

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
        /*(if (!showTenantTab && isOpenTenantSelected) {
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
        }*/
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
            const firstName = localStorage.getItem("firstName");
            // const selectedTenantLS = localStorage.getItem("selectedTenant");
            localStorage.clear();
            localStorage.setItem("firstName", firstName);
            localStorage.setItem("userId", storedUserId);
            localStorage.setItem("token", storedToken);
            // localStorage.setItem("selectedTenant", selectedTenantLS);
            if (isDemoGame && gameId) {
                localStorage.setItem("gId", gameId);
            }
            if (!isDemoGame && !isDemo) {
                setLoading(true);
                setChildData(user);
                if (user.id !== "null" && !user.verifiedOTP) {
                    const phoneNumber = user.phoneNumber.substring(3);
                    localStorage.setItem("phoneNumber", phoneNumber);
                    navigate("/register?source=lobby");
                } else if (user.id === "null") {
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

    /* useEffect(() => {
       if (nonDefaultTenantId) {
         fetchTenantDetails(nonDefaultTenantId);
       }
     }, [nonDefaultTenantId]);*/

    useEffect(() => {
        if(!gotRegisteredTournaments){
            getRegisteredTournaments(user?.registrations);
            setGotRegisteredTournaments(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTenant, user?.registrations, nonDefaultTenantId, gotRegisteredTournaments]);

    const handleTournamentRegister = () => {
        MEASURE(
            INSTRUMENTATION_TYPES.REGISTER_TOURNAMENT,
            user.id,
            {}
        );
        navigate("/tournament/select");
    };


    const enterTournament = (ct) => {
        MEASURE(INSTRUMENTATION_TYPES.ENTER_TOURNAMENT, user.id, { tournamentId: ct.id });
        const url = `/chat?tId=${ct.id}`;
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

    const renderTournamentCards = () => {
        return (
            <>

                {quizes.length ? (
                    <LobbyTournamentSection
                        tournaments={quizes}
                        type="QUIZES"
                        title="TRIVIA CORNER"
                        redirectToLeaderboard={redirectToLeaderboard}
                        playGame={playGame}
                        enterTournament={enterTournament}
                        listView={true}
                    />
                ) : null}
            </>
        );
    };

    const handleGoBack = () => {
        if(isDemo){
            navigate(`/lobby-demo?d=S`);
        }
        else{
            navigate("/lobby");
        }
    }

    return (
        <div className="flex flex-col h-full w-full max-w-3xl items-center justify-center relative bg-white">
       <ArenaHeader
            goBack={handleGoBack}
            headerText="Practice Arena"
            nonArenaRoute={true}
          />
            
            {loading ? (
                <div className="w-full h-full flex justify-center items-center">
                    <Loader />
                </div>
            ) : (
                <div className="relative pb-[90px] w-full h-full overflow-auto overflow-x-hidden">
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

export default PopQuizLobby;