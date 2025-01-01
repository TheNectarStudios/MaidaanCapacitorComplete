import React, { useState, useEffect, useMemo } from 'react';
import SwiperCore from 'swiper';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import axios from "axios";
import { getCoinsAfterDiscount, FIRST_DEMO_GAME_TID, getDateObject, getDatefromFirebaseTimeStamp, getDateStringForTournament, getDateStringFromStartEndDates, FREE_TIER_LIST, DEFAULT_TENANT_ID, NEW_FORMAT_TOURNAMENT_GAMES, getDemoFlowData } from "../../../Constants/Commons";
import { useAuth } from "../../../providers/auth-provider";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import AppButton from "../../Common/AppButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MEASURE } from "../../../instrumentation";
import { signOut } from "firebase/auth";
import { db, firebaseAuth } from "../../../firebase-config";
import { doc, getDocs, collection, getDoc, deleteDoc, documentId } from "firebase/firestore";
import { findSchoolChild, returnEncryptedUserId } from "../../utils";
import { secretKey, initializationVector } from '../../../firebase-config';
import CryptoJS from 'crypto-js';
import { child } from 'firebase/database';
import { GAME_HOUR_START_TIME, GAME_HOUR_END_TIME } from '../../../Constants/Commons';
import { gameTypes } from '../../../Constants/Commons';
import { gameNamesMap } from '../../../Constants/Commons';
import { useApp } from '../../../providers/app-provider';
import BackButton from '../../Common/BackButton';
import { query, where } from 'firebase/firestore';
import { registerMultipleTournaments } from '../../../services/tournament';
import { first, get, set } from 'lodash';
import * as FB from "../../Firebase/FirebaseFunctions";
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import {
    BASE_URL,
    DEFAULT_NEGATIVE_SCORE,
    DEFAULT_POSIIVE_SCORE,
    DEMO_BASE_URL,
    ENABLE_SKIP_LS_KEY,
    NEGATIVE_SCORE_LS_KEY,
    POSITIVE_SCORE_LS_KEY,
} from "../../../Constants/Commons"; import { TournamentStatus } from "../../utils";
import AlertSnackbar from "../../Common/AlertSnackbar";
import Loader from '../../PageComponents/GameLoader';
import { Dialog } from '@mui/material';
import mixpanel from 'mixpanel-browser';
import { isWalletHistoryCreditMoreThanZero } from '../../../services/wallet';
import { YOUR_PLAN_ROUTE } from '../../../Constants/routes';
import SkeletonLoader from '../../Common/SkeletonLoader';
import { BottomNavBar, PlayerHeader, PrimaryTournamentCard, SecondaryActionCaurosel, TertiaryActionCaurosel } from './NewLobby';
import LoginPage from '../../PageComponents/LoginPage';

let multiplier = 1;

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);

const LobbyDemo = () => {
    const navigate = useNavigate();
    const { wallet } = useApp();
    const [gameStartHour, gamestartMinutes] = GAME_HOUR_START_TIME.split(':').map(part => parseInt(part, 10));
    const [gameEndHour, gameEndMinutes] = GAME_HOUR_END_TIME.split(':').map(part => parseInt(part, 10));
    const [topFiveRewards, setTopFiveRewards] = useState([]);
    const [currentTournament, setCurrentTournament] = useState({});
    const [primaryTournamentBanner, setPrimaryTournamentBanner] = useState('');
    const [primaryTournamentName, setPrimaryTournamentName] = useState('');
    const [primaryIsBattleGround, setPrimaryIsBattleGround] = useState(false);
    const [primaryTournamentCallBack, setPrimaryTournamentCallBack] = useState(null);
    const [secondaryTournamentBanner, setSecondaryTournamentBanner] = useState('');
    const [secondaryTournamentCallBack, setSecondaryTournamentCallBack] = useState(null);
    const [primaryActionName, setPrimaryActionName] = useState('');
    const [secondaryActionName, setSecondaryActionName] = useState('');
    const userId = localStorage.getItem("userId");
    const firstName = localStorage.getItem("firstName");
    const additionData = getDemoFlowData();
    const user = {
        firstName,
        id: userId,
        ...additionData,
    };

    const [primaryStartTime, setPrimaryStartTime] = useState('');
    const [searchParams, _] = useSearchParams();
    const isDemo = searchParams.get("d") === "S";
    const [primaryEndTime, setPrimaryEndTime] = useState('');
    const [primaryisUpcoming, setPrimaryisUpcoming] = useState(false);
    const [secondaryisUpcoming, setSecondaryisUpcoming] = useState(false);
    const [secondaryStartTime, setSecondaryStartTime] = useState('');
    const [childData, setChildData] = useState(user);
    const [oneOnOne, setOneOnOne] = useState(false);
    const [isPrimaryUpcoming, setIsPrimaryUpcoming] = useState(false);
    const [isSchoolChild, setisSchoolChild] = useState(false);
    const [secondaryTournaments, setSecondaryTournaments] = useState([]);
    const [componentLoading, setComponentLoading] = useState(true);
    const [firstDemoGameData, setFirstDemoGameData] = useState({});
    const [firstTournamentGameNotPlayed, setFirstTournamentGameNotPlayed] = useState(true);
    const [toastMessage, setToastMessage] = useState(
        "You have already played this round. Please wait for the next round to start."
    );
    const [primaryTournamentData, setPrimaryTournamentData] = useState({});
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const [open, setOpen] = useState(false);
    const [primaryTournamentHeader, setPrimaryTournamentHeader] = useState('');
    const [primaryTimer, setPrimaryTimer] = useState('');

    const [demoRoundPlayed, setDemoRoundPlayed] = useState(false);

    const [remainingTime, setRemainingTime] = useState(null);
    const [timerReset, setTimerReset] = useState(false);

    const [demoTournament, setDemoTournament] = useState({});
    const [ongoingTournament, setOngoingTournament] = useState({});
    const [closestTournament, setClosestTournament] = useState({});
    const [firstOpenTournamentData, setFirstOpenTournamentData] = useState({});
    const [firstTournamentGameData, setFirstTournamentGameData] = useState({});
    const [firstOpenTournamentPlayed, setFirstOpenTournamentPlayed] = useState(false);
    const [ongoingUpcomingSchoolTournamentPresent, setOngoingUpcomingSchoolTournamentPresent] = useState(false);
    const [isCreditHistoryValidForVault, setIsCreditHistoryValidForVault] = useState(false);
    const ongoingSchoolTournamentBanner = 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FSchool%20Tournament%20Weekend%20Primary.png?alt=media&token=2cd73005-46b9-4ce2-90d0-e088a596fd4e';
    const upcomingTournaments = '/Assets/Images/upcomingTournaments.png';
    const lobbyDarkBg = '/Assets/Images/bg-dark.png'
    const lobbyLightBg = '/Assets/Images/bg-light.png'
    const isLargeScreen = window.matchMedia('(min-width: 768px)').matches;
    const backgroundImage = isLargeScreen ? `url(${lobbyDarkBg})` : `url(${lobbyLightBg})`;

    const triviaCorner = '/Assets/Images/triviaCorner.png';
    const classJamBanner = '/Assets/Images/class-jam.png';
    SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);
    const gameArenaImage = '/Assets/Images/GameArena.png';
    const oneononeImage = '/Assets/Images/OneOnOneArena.png';
    const timeLeft = '00:30:00';
    const timeStringToSeconds = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    };
    const isDemoGame = searchParams.get("d") === "Y";
    const group = searchParams.get("group") ?? "";
    let roundFormat = '';
    const timeLeftInSeconds = timeStringToSeconds(timeLeft);

    const token = localStorage.getItem("token");

    const loggedInUser = !!userId && !!token;

    const listOfBanners = ['/Assets/Images/triviaCorner.png'];

    const shouldAddClassJam = !user?.tenantIds?.includes(DEFAULT_TENANT_ID);

    useEffect(() => {
        const updateMultiplier = () => {
            multiplier = window.innerWidth >= 768 ? 1.8 : 1;
        };

        // Update the multiplier initially and add a listener for window resize
        updateMultiplier();
        window.addEventListener('resize', updateMultiplier);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('resize', updateMultiplier);
        };
    }, []);

    useEffect(() => {
        async function getRewardsByIds() {
            const rewardIds = ["RS_02_003", "RS_02_001", "RS_02_004", "RS_03_009", "RS_01_013"];
            const rewardCollection = collection(db, 'rewards');
            const q = query(rewardCollection, where(documentId(), "in", rewardIds));
            const docSnap = await getDocs(q);
            const responseData = [];

            docSnap.forEach((doc) => {
                responseData.push({ ...doc.data(), id: doc.id });
            });

            setTopFiveRewards(responseData);
        }

        getRewardsByIds();
    }, [])

    useEffect(() => {
        if (isDemo && !userId || !isDemo && userId) {
            navigate('/lobby-demo');
        }
    }, []);

    const getFirstDemoGameDetails = async () => {
        try {
            // Fetch both tournament details in parallel
            const [firstTournamentGameDetails, finalTournamentGameDetails] = await Promise.all([
                getDoc(doc(db, 'tournaments', 'Demo_Pitch_A')),
                getDoc(doc(db, 'tournaments', 'Demo_Pitch_Final'))
            ]);

            // Query to check if the user has played the first tournament
            const firstDocQuery = query(
                collection(db, 'children', user?.id, 'games'),
                where('tournamentId', '==', 'Demo_Pitch_A'),
                where('endTime', '!=', null)
            );

            const firstDocRef = await getDocs(firstDocQuery);

            const firstDocData = firstDocRef.docs.map(doc => doc.data());

            const docData = firstDocData.filter(data => data.tournamentId === 'Demo_Pitch_A' && data.round === "2")[0];
                let playedRoundTwo = false;
            if (docData) {
                playedRoundTwo = true;
            }

            const tournamentRef = playedRoundTwo ? finalTournamentGameDetails : firstTournamentGameDetails;

            const currentTime = new Date();

            // Add 5 minutes
            const addTime = playedRoundTwo ? 180 : 5;
            currentTime.setMinutes(currentTime.getMinutes() + addTime);

            // Format the time as HH:MM
            const formattedTime = currentTime
                .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            // Update the state with the selected tournament details
            if (user?.id) {
                setFirstDemoGameData({
                    ...tournamentRef.data(),
                    id: tournamentRef.id,
                    formattedTime,
                });
            }
        } catch (error) {
            console.error('Error fetching game details:', error);
        } finally {
            setComponentLoading(false);
        }
    };

    useEffect(() => {

        getFirstDemoGameDetails();

        // fetchData();
    }, []);

    const renderRewardItem = (reward) => {
        const { imageUrl, name, pointsRequired, id } = reward;
        return (
            <div className='flex bg-[#d9d9d9] rounded-[10px] justify-center items-center'>
                <div className='w-1/2 h-[60px] md:h-[65px] flex justify-center items-center bg-[#f5f5f5] rounded-[10px] m-[5px]'>
                    <img
                        alt="reward"
                        src={imageUrl}
                        className='w-full h-full object-contain'
                    />
                </div>
                <div className='w-1/2 h-full flex flex-col justify-center items-center text-primary-gray-20'>
                    <div className='text-center font-bold text-xs md:text-sm'>{name}</div>
                    <div className='text-[10px] md:text-lg'>{pointsRequired} Coins </div>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        // await logout();
        // let redirectUrl = "/login";
        // if (isDemoGame) {
        //     redirectUrl += "?d=Y";
        //     if (group) {
        //         redirectUrl += `&group=${group}`;
        //     }
        // }
        // navigate(redirectUrl);
    }

    const renderLogoutPopup = () => {
        return (
            <Dialog
                open={showLogoutPopup}
                onClose={() => setShowLogoutPopup(false)}
                className="register-success"
            >
                <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-base">

                    <ul className="my-3 mx-0">
                        <p className="my-2 mx-0 ml-[-30px] text-center">Last few minutes left in the qualifying rounds</p>
                        <p className="my-3 mx-0 ml-[-30px] text-center">You need to score at least 15 to get in the top 5 and qualify for the final round</p>
                    </ul>

                    <div className='flex items-center justify-center w-full h-full mt-[25px]'>

                        <AppButton
                            onClick={handleLogout}
                            className="rounded-[115px] min-w-[100px] w-[100px] h-[35px] min-h-[35px] self-center items-center mr-2"
                            variant="secondary"

                        >
                            Yes
                        </AppButton>
                        <AppButton
                            onClick={() => setShowLogoutPopup(false)}
                            className="rounded-[115px] min-w-[100px] w-[100px] h-[35px] min-h-[35px] self-center items-center"
                        >
                            No
                        </AppButton>
                    </div>
                </div>
            </Dialog>
        );
    }

    let istDate = new Date();
    istDate = new Date(istDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const isGameHour = (istDate) => {
        const hour = istDate.getHours();
        const minutes = istDate.getMinutes();
        if (hour >= gameStartHour && hour <= gameEndHour) {
            if (hour === gameStartHour) {
                return minutes >= gamestartMinutes;
            }
            if (hour === gameEndHour) {
                return minutes <= gameEndMinutes;
            }
            return true;
        }
        return false;
    }

    useEffect(() => {
        const setPrimaryAndSecondaryTournament = () => {

            setLobbyDemoTournamentAsPrimary();

            const secondaryTournamentsData = [
                {
                    banner: upcomingTournaments,
                    callback: () => { return navigate('/tournament/select?d=S') }
                },

                {
                    banner: triviaCorner,
                    callback: () => { return navigate('/pop-quiz-lobby?d=S') }
                }
            ];

            setSecondaryTournaments(secondaryTournamentsData);

        }
        setPrimaryAndSecondaryTournament();
    }, [firstDemoGameData]);


    const setLobbyDemoTournamentAsPrimary = () => {
        setPrimaryTournamentBanner(firstDemoGameData.newLobbyTournamentBanner);
        setPrimaryTournamentData(firstDemoGameData);
        setPrimaryTournamentName(firstDemoGameData.name);
        setPrimaryTournamentCallBack(() => () => navigate(`/chat?tId=${firstDemoGameData.id}&back=lobby&d=S`));
        setPrimaryActionName('Play Round');
        setPrimaryTournamentHeader("Tournament Arena");
        setPrimaryisUpcoming(true);
        setPrimaryTimer("LIVE for");
        setPrimaryStartTime(firstDemoGameData.formattedTime);
    }

    const [windowSize, setWindowSize] = useState(window.innerWidth);

    const forceUpdate = () => setWindowSize(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize(window.innerWidth);
            forceUpdate();
        };

        // Add event listener for window resize
        window.addEventListener('resize', handleResize);

        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [window.innerWidth]);

    if (!isDemo) {
        return <LoginPage isDemoGameInput={true} />
    }

    return (
        <div className="flex flex-col items-center justify-start gap-4 h-screen text-[14px] md:text-[24px] md:bg-[#4e4e4e] md:mt-[70px] overflow-y-auto scroll-smooth"
            style={{
                backgroundImage: `url(${lobbyDarkBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}        
        >
            <div className=" flex flex-col items-center justify-center text-white w-[100vw] max-w-[764px]">
                {" "}
                {renderLogoutPopup()}
                {
                    <div className="w-[100vw] top-0 flex items-center justify-center">
                        <PlayerHeader
                            isCreditHistoryValidForVault={isCreditHistoryValidForVault}
                            //   isPremierPlan={isPremierPlan}
                            playerName={childData?.firstName}
                            playerScore={500}
                            playerVault={wallet?.rewardPoints}
                            navigate={navigate}
                            childData={childData}
                            profileEmoji={user?.profileEmoji}
                            displayBack={false}
                            showSchool={isSchoolChild}
                            handleNaviagteProfilePage={() => { }}
                            tenantStatus={user?.tenantStatus}
                            navigateToProfile={shouldAddClassJam}
                            showLogout={true}
                        />
                    </div>
                }
                <div
                    className="w-screen max-w-[764px] px-[5vw] overflow-x-hidden justify-center pt-8 overflow-y-auto h-content "
                    style={{ paddingTop: "60px", scrollBehavior: "smooth" }}
                >
                    <div className="mt-[20px] mb-[20px]">
                        {componentLoading ? (
                            <>
                                <div
                                    className="text-part"
                                >
                                    {
                                        <h2
                                            className="m-0 font-extrabold mb-[10px] text-base md:text-[24px]"
                                        >
                                            {primaryTournamentHeader
                                                ? primaryTournamentHeader
                                                : "Tournament Arena"}
                                        </h2>
                                    }
                                    {/*(isPrimaryTournamentCard) && <div className="m-0 mb-[10px] font-light text-sm">{tournamentSubHeader || 'Challenge your friends and hangout with them'}</div>*/}
                                </div>
                                <div className="h-[200px]">
                                    <div className="w-full h-full rounded-lg">
                                        <SkeletonLoader
                                            bgColor="#5050504d"
                                            pulseColor="#3a3a3aa4"
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <PrimaryTournamentCard
                                backgroundImage={primaryTournamentBanner}
                                primaryTournamentName={primaryTournamentName}
                                isPrimaryTournamentCard={true}
                                startTime={primaryStartTime}
                                endTime={primaryEndTime}
                                name={primaryTournamentName}
                                action={primaryTournamentCallBack}
                                actionname={primaryActionName}
                                oneOnOne={oneOnOne}
                                isUpcoming={primaryisUpcoming}
                                tournamenData={primaryTournamentData}
                                tournamentHeader={primaryTournamentHeader}
                                isGameHour={isGameHour(istDate)}
                                primaryTimer={primaryTimer}
                                tournamentDateString={true}
                            />
                        )}
                    </div>
                    <div
                        className="flex flex-col justify-between my-5 max-w-90vw max-w-[640px]"
                        style={{ fontSize: `${16 * multiplier}px` }}
                    >
                        <div className="flex justify-between mb-[10px] md:text-[24px]">
                            <div>
                                <label>More on Maidaan</label>
                            </div>
                        </div>
                        {componentLoading ? (
                            <div className="h-[100px] flex gap-2 overflow-hidden">
                                <div className="w-[190px] rounded-lg shrink-0 h-[100px]">
                                    <SkeletonLoader
                                        bgColor="#5050504d"
                                        pulseColor="#3a3a3aa4"
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="w-[190px] rounded-lg shrink-0 h-[100px]">
                                    <SkeletonLoader
                                        bgColor="#5050504d"
                                        pulseColor="#3a3a3aa4"
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>
                        ) : (
                            <SecondaryActionCaurosel
                                secondaryTournaments={secondaryTournaments}
                            />
                        )}
                    </div>
                    {(user?.tenantStatus === "OPEN" || isDemo) && (
                        <div
                            className="flex flex-col justify-between mt-[20px] mb-[20px] max-w-full"
                            style={{ fontSize: `${16 * multiplier}px` }}
                        >
                            <div className="flex justify-between mb-[10px] md:text-[24px]">
                                <div>
                                    <label>Reward Store</label>
                                </div>
                                <div>
                                    <label
                                        className="underline cursor-pointer"
                                        style={{ fontSize: `${12 * multiplier}px` }}
                                        onClick={() => navigate("/wallet?d=S")}
                                    >
                                        View all
                                    </label>
                                </div>
                            </div>
                            <TertiaryActionCaurosel
                                topFiveRewards={topFiveRewards}
                                renderRewardItem={renderRewardItem}
                                isDemo={isDemo}
                            />
                        </div>
                    )}
                </div>
                <div>
                </div>
            </div>
        </div>
    );
};

export default LobbyDemo;

