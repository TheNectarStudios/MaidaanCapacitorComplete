import React, { useState, useEffect, useMemo } from 'react';
import SwiperCore from 'swiper';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import axios from "axios";
import { getCoinsAfterDiscount, FIRST_DEMO_GAME_TID, getDateObject, getDatefromFirebaseTimeStamp, getDateStringForTournament, getDateStringFromStartEndDates, FREE_TIER_LIST, DEFAULT_TENANT_ID, NEW_FORMAT_TOURNAMENT_GAMES } from "../../../Constants/Commons";
import { useAuth } from "../../../providers/auth-provider";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import AppButton from "../../Common/AppButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MEASURE } from "../../../instrumentation";
import { signOut } from "firebase/auth";
import { db, firebaseAuth } from "../../../firebase-config";
import { doc, getDocs, collection, getDoc, deleteDoc } from "firebase/firestore";
import { findSchoolChild, getTournamentStatus, returnEncryptedUserId } from "../../utils";
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
import { Box, Dialog, Drawer } from '@mui/material';
import mixpanel from 'mixpanel-browser';
import { isWalletHistoryCreditMoreThanZero } from '../../../services/wallet';
import { YOUR_PLAN_ROUTE } from '../../../Constants/routes';
import SkeletonLoader from '../../Common/SkeletonLoader';

let multiplier = 1;

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);

export const AnimatedText = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayText, setDisplayText] = useState(gameTypes[currentIndex]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex(prevIndex => {
                // Calculate the next index, looping back to 0 if at the end of the array
                const nextIndex = (prevIndex + 1) % gameTypes.length;
                // Update the display text to the next game
                setDisplayText(gameNamesMap[gameTypes[nextIndex]]);
                return nextIndex;
            });
        }, 2000);

        return () => clearInterval(intervalId);
    }, [gameTypes]);

    return (
        <div>
            <p className='text-xl mb-2'>Challenge your friends</p>
            <p className='text-xl mt-0 mb-0'>to <span className="animated-text">{displayText}</span></p>
            <p className='text-xs mt-4 mb-4'>7 PM - 9 PM</p>
        </div>
    );
};

const CountdownTimer = ({ timeLeft, primaryTimer = "LIVE In", isDemo = false }) => {
    const [seconds, setSeconds] = useState(timeLeft);
    useEffect(() => {
        const intervalId = setInterval(() => {
            setSeconds((prevSeconds) => {
                if (prevSeconds > 0) {
                    return prevSeconds - 1;
                } else {
                    if (isDemo) {
                        return timeLeft;
                    }
                    else {
                        clearInterval(intervalId);
                    }
                    return 0;
                }
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    return (


        <div className="flex justify-center items-center bg-[#CCF900] p-2 rounded-bl-md rounded-br-md h-[22px]" style={{ display: 'inline-flex' }}>
            {/*<div className="bg-[#CCF900] rounded-md justify-center w-auto items-center inline-block  m-0 h-[22px]">*/}
            <p className="whitespace-nowrap text-xs overflow-ellipsis m-0 text-[#3A3A3A] px-2">
                {primaryTimer}: {formattedTime}
            </p>
        </div>


    );
};
// h-8vh bg-custom-gray  

const handleNaviagteProfilePage = (userId, navigate) => {

    //encrypt the user id and navigate to the profile page
    const key = CryptoJS.enc.Hex.parse(secretKey);
    const iv = CryptoJS.enc.Hex.parse(initializationVector);

    const encryptedUserId = CryptoJS.AES.encrypt(userId, key, { iv: iv }).toString();
    let urlSafeEncryptedUserId = encryptedUserId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    //const encryptedUserId = CryptoJS.AES.encrypt(userId, secretKey).toString();
    navigate(`/profile/${urlSafeEncryptedUserId}`);
}

const handleNavigateLobby = (navigate) => {
    const url = `/lobby`;
    navigate(url);
}

export const PlayerHeader = ({
    isCreditHistoryValidForVault,
    isPremierPlan,
    playerName,
    playerScore,
    playerVault,
    navigate,
    childData,
    profileEmoji,
    displayBack = true,
    showSchool = false,
    handleNaviagteProfilePage,
    tenantStatus,
    navigateToProfile = true,
    showLogout = false,
}) => {
    const { logout } =
        useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/lobby-demo');
    };
    const showVaultBalance = isCreditHistoryValidForVault || isPremierPlan;
    return (
        <div
            className={`fixed top-0 w-[100vw] max-w-[764px] text-white text-center font-bold md:text-2xl bg-[#3a3a3a] h-[60px] md:h-auto z-[999] text-sm`}
        >
            <div className="flex items-center justify-between h-full md:py-7 px-4 md:px-[5vw]">
                {displayBack && (
                    <div className="m-4">
                        <BackButton onClick={() => handleNavigateLobby(navigate)} />
                    </div>
                )}
                <div
                    className="flex items-center"
                    onClick={() => {
                        (navigateToProfile
                            && handleNaviagteProfilePage(childData?.id, navigate))
                    }}
                >
                    {(!childData.profileEmoji) ? (
                        <div className='flex items-center '>
                            <img
                                src='/Assets/Icons/Nimbu.svg'
                                alt="icon"
                                style={{ width: '25px', height: '25px' }}
                            />
                        </div>
                    ) :
                        (<div>
                            <Emoji unified={childData?.profileEmoji} size="25" />
                        </div>)}
                    <div className={`ml-2 md:ml-4 text-sm md:text-2xl ${navigateToProfile ? 'underline' : ''}`} style={{ textUnderlineOffset: '2px' }}>{playerName}</div>
                </div>
                {showVaultBalance && tenantStatus === "OPEN" ? (
                    <div
                        className="flex items-center justify-center"
                        onClick={() => navigate("/wallet")}
                    >
                        <div className="mr-1 flex items-center">
                            <img
                                src="/Assets/Icons/vault.svg"
                                alt="vault"
                                className="w-6 aspect-square md:w-9"
                            />
                        </div>
                        <div className="text-sm md:text-xl flex items-center mt-1">
                            {playerVault}
                        </div>
                    </div>
                ) : (
                    <></>
                )}
                {showLogout ? (
                    <div
                        className="flex items-center justify-center gap-2"
                        onClick={handleLogout}
                    >

                        <div className="mr-1 flex items-center">
                            <img
                                src="/Assets/Icons/logout.svg"
                                alt="vault"
                                className="w-6 aspect-square md:w-9"
                            />
                        </div>
                        {/* 
                        <div className='flex items-center'>
                            <span className="text-sm md:text-xl">Logout</span>
                        </div> */}
                        <div className="text-sm md:text-xl flex items-center mt-1">
                            {playerVault}
                        </div>
                    </div>
                ) : (
                    <></>
                )}
                {/*showSchool && (
          <div
            className="flex items-center justify-center space-x-1"
            onClick={() => navigate("/school-lobby")}
          >
            <div className="flex items-center justify-center">
              <img
                src="Assets/Icons/VectornavigatorGreen.svg"
                alt="navigator"
                className="w-6 h-6 md:w-9"
              />
            </div>
            {<div className="text-sm md:text-xl mt-1 mb-0">School Arena</div>}
          </div>
        )*/}
            </div>
        </div>
    );
};


const extractDateTime = (startTime, endTime) => {
    if (!startTime || !endTime) {
        return { startDateEndDate: '', startTimeString: '' };
    }
    const start = new Date(startTime._seconds * 1000);
    const startdate = start.getDate();
    const startmonth = start.getMonth();
    const starthour = start.getHours();
    const startminutes = start.getMinutes();
    let startDateEndDate;


    const startdatestring = startdate.toString().padStart(2, '0');
    const startmonthstring = startmonth.toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[parseInt(startmonthstring) - 1];


    const starthourstring = starthour.toString().padStart(2, '0');
    const startminutesstring = startminutes.toString().padStart(2, '0');

    const startTimeString = starthourstring + ':' + startminutesstring;

    if (endTime) {
        const end = new Date(endTime._seconds * 1000);
        const enddate = end.getDate();
        const enddatestring = enddate.toString().padStart(2, '0');
        startDateEndDate = startdatestring + '-' + enddatestring + ' ' + monthName;
    }
    return { startDateEndDate, startTimeString };

}

export const TournamentCard = ({ backgroundColor, backgroundImage, startTime, endTime, topic, action, actionname, name, noText, oneOnOne, tournamentType, isUpcoming, leaderBoardAction, tournamenData, tournamentHeader, isGameHour, primaryTimer, tournamentDateString }) => {
    const [showCTALoader, setShowCTALoader] = useState(false);
    let tournamentName = '';
    let dates = '';
    let topics = '';
    let primaryIsBattleGround = false;
    //let topics = tournamenData.topics;
    const tournamentTopics = tournamenData?.topics?.join(', ')
    let { startDateEndDate, startTimeString } = extractDateTime(startTime, endTime);
    if (typeof startTime === 'string') {
        startTimeString = startTime;
    }
    let displaybutton = true;
    if (!actionname || actionname === '') {
        displaybutton = false;
    }
    if (tournamentHeader == "BattleGround") {
        primaryIsBattleGround = true;
    }
    let isDemo = false;
    if (!!tournamentDateString) {
        isDemo = true;
    }
    let displaytimer = false;
    let differenceInSeconds;

    if (startTimeString !== null && startTimeString != "") {
        displaytimer = true;
        const now = new Date();

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [hours, minutes] = startTimeString.split(':');
        const startTimeDate = new Date(today.setHours(hours, minutes));

        const differenceInMilliseconds = startTimeDate - now;

        differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
    }

    if (tournamentType === "completed" || differenceInSeconds <= 0) {
        displaytimer = false;
    }

    if (!oneOnOne) {
        noText = true;
    }

    let totalAction = false;
    if ((!actionname || actionname === '') && (action)) {
        totalAction = true;
    }
    let dateString = "";
    if (!!tournamentDateString) {
        const currentDate = new Date();
        const previousDayDate = new Date(currentDate);
        previousDayDate.setDate(previousDayDate.getDate() - 1);

        dateString = getDateStringForTournament(previousDayDate, currentDate);
    }
    else if (tournamenData?.parentTournament && tournamenData?.setWeeklyQuiz) {
        dateString = getDateStringFromStartEndDates(tournamenData?.parentStartDate, tournamenData?.parentEndDate, tournamentHeader);
    }
    else {
        dateString = getDateStringFromStartEndDates(tournamenData?.startDate, tournamenData?.endDate, tournamentHeader);
    }

    const isDarkBanner = tournamenData?.isDarkBanner;

    if (!tournamenData && !isGameHour) {
        return (
            <div
                className="bg-cover bg-center h-[200px] rounded-lg pl-2"
                style={{ backgroundImage: `url(${backgroundImage})` }}
                onClick={totalAction ? action : null}
            >
                <div>
                    {displaytimer ? (
                        <div style={{ backgroundColor: 'EBFD99' }} >
                            <CountdownTimer timeLeft={differenceInSeconds} primaryTimer={primaryTimer} isDemo={isDemo} />
                        </div>
                    ) : null}
                </div>
                {noText ? null : (
                    <AnimatedText />
                )}
                <div>
                    {displaybutton ? (
                        <AppButton
                            className="flex rounded-lg h-7 w-30 text-center items-center justify-center"
                            onClick={action}
                        >
                            <p>{actionname}</p>
                        </AppButton>
                    ) : null}
                </div>
            </div>
        );

    }

    else {
        return (
            <div
                className="bg-cover bg-center h-[200px] rounded-lg flex flex-col pl-2 relative"
                style={{ backgroundImage: `url(${backgroundImage})` }}
                onClick={action}
            >
                <div className='lex flex-col items-start justify-start'>
                    {displaytimer ? (
                        <div className='flex flex-col items-start justify-start pl-2'>
                            <CountdownTimer timeLeft={differenceInSeconds} primaryTimer={primaryTimer} isDemo={isDemo} />
                        </div>
                    ) : null}
                </div>
                {primaryIsBattleGround && !noText &&
                    <div className='pl-[10px]'>
                        <AnimatedText />
                    </div>
                }
                <div style={{ flex: 1, height: '100%' }}>


                    {/*display tournament name*/}
                    <div style={{ paddingLeft: '10px', fontSize: `${10 * multiplier}px`, display: 'flex', flexDirection: 'column', paddingTop: displaytimer ? '5px' : '20px', width: "55%" }}>
                        <div className={`flex flex-col text-[18px] m-1 ml-0 mt-2 mb-0 ${isDarkBanner ? 'text-white' : 'text-black'}`}>
                            {name || tournamentName}
                        </div>
                        {isUpcoming && tournamentTopics && <div className={`flex flex-col justify-center mt-2 font-normal text-xs ${isDarkBanner ? 'text-white' : 'text-black'}`}>

                            {tournamentHeader === "Play Your First Game" ? "Practice round for warm-up" : tournamentTopics}
                        </div>}

                        {isUpcoming && <p className={`m-1 mt-2 mb-2 ml-0 text-[12px] ${isDarkBanner ? 'text-white' : 'text-black'}`}>{dateString}</p>}

                    </div>

                </div>

                <div className='absolute bottom-6 left-0 pl-2 ml-[10px]'>
                    {displaybutton ? (
                        <AppButton
                            type="submit"
                            className={`self-center rounded-lg uppercase h-7 text-[12px] pl-3 pr-3 font-avenir ${showCTALoader ? 'w-[101px] md:w-[127px]' : ''}`}
                            onClick={() => setShowCTALoader(true)}
                            disabled={showCTALoader}
                            progressSize={19}
                            isLoading={showCTALoader}
                        >
                            {actionname}
                        </AppButton>
                    ) : null}

                    {leaderBoardAction ? (
                        <AppButton
                            className="rounded-lg uppercase mt-4 h-7 text-[14px]"
                            onClick={leaderBoardAction}
                        >
                            Leaderboard
                        </AppButton>
                    ) : null}
                </div>
            </div>

        );
    }
};

export const TournamentsCaurosel = ({ listOfTournaments, action, actionname, tournamentType, tournamentLobby }) => {
    return (
        <Swiper
            spaceBetween={20}
            slidesPerView={1.2}
            navigation={false}
            pagination={{ clickable: true }}
            style={{ height: '170px', width: '100%' }}
            breakpoints={{
                700: {
                    slidesPerView: 1.5,
                    spaceBetween: 30,
                    style: { height: '200px' }

                },
            }}
        >
            {listOfTournaments.map((tournament, index) => (

                <SwiperSlide key={index} style={{ overflow: 'hidden', borderRadius: '10px' }}>
                    <div style={{ height: '100%', width: '100%' }}>
                        <TournamentCard backgroundColor='#EBFD99' backgroundImage={tournament.tournamentBanner} name={tournament.name} startTime={tournament.startDate} endTime={tournament.endDate} action={action} actionname={actionname} tournamentType={tournamentType} />
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export const PrimaryTournamentCard = ({ tournamentHeader, tournamentSubHeader, backgroundImage, isPrimaryTournamentCard, startTime, endTime, name, action, actionname, backgroundColor, oneOnOne, isUpcoming, leaderBoardAction, isPopQuizLobby, tournamenData, isGameHour, primaryTimer, tournamentDateString }) => {
    return (
        <div
            className={`h-auto flex flex-col ${isPopQuizLobby ? "mt-[10px] pt-[10px] pb-[10px]" : ""
                } `}
        >
            <div className="text-part" style={{ fontSize: `${12 * multiplier}px` }}>
                {
                    <h2
                        className="m-0 font-extrabold mb-[10px] text-base md:text-[24px] md:mt-[16px]">
                        {tournamentHeader ? tournamentHeader : "Tournament Arena"}
                    </h2>
                }
            </div>
            <TournamentCard
                backgroundColor={backgroundColor}
                backgroundImage={backgroundImage}
                startTime={startTime}
                endTime={endTime}
                action={action}
                actionname={actionname}
                name={name}
                oneOnOne={oneOnOne}
                isUpcoming={isUpcoming}
                leaderBoardAction={leaderBoardAction}
                multiplier={multiplier}
                tournamenData={tournamenData}
                tournamentHeader={tournamentHeader}
                isGameHour={isGameHour}
                primaryTimer={primaryTimer}
                tournamentDateString={tournamentDateString}
            />
        </div>
    );
};

const Carousel = ({ bannerImages }) => {
    return (
        <Swiper
            spaceBetween={20}
            slidesPerView={1.7}
            navigation={false}
            pagination={{ clickable: true }}
            scrollbar={{ draggable: true }}
            style={{ height: '100px' }}
            breakpoints={{
                768: {
                    slidesPerView: 2.5, // Show 2 slides on screens wider than or equal to 768px
                },
            }}
        >

            {bannerImages.map((banner, index) => (
                <SwiperSlide key={index} style={{ overflow: 'hidden', borderRadius: '10px' }}>
                    <img
                        src={banner}
                        alt={`Banner ${index + 1}`}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center center',
                        }}
                    />
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

const componentLoader = () => {
    return (
        <div className="flex justify-center items-center h-[100px]">
            <Loader />
        </div>
    );
};

export const SecondaryActionCaurosel = ({ listOfBanners, renderBanner, backgroundImage, startTime, action, actionname, oneOnOne, isUpcoming, secondaryTournaments }) => {
    const navigate = useNavigate();
    let differenceInMilliseconds;
    let differenceInSeconds;
    const checkIfDisplayTimer = (tournament) => {
        let startTimeString = tournament.startTime
        if (!!startTimeString) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const [hours, minutes] = startTimeString.split(':');
            const startTimeDate = new Date(today.setHours(hours, minutes));

            const differenceInMilliseconds = startTimeDate - now;

            differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
            if (differenceInSeconds > 0) {
                return differenceInSeconds;
            }
        }
        return 0;
    }

    return (
        <Swiper
            spaceBetween={20}
            slidesPerView={1.7}
            className=" w-full h-[100px]"
            breakpoints={{
                460: {
                    slidesPerView: 2.2,
                },
                520: {
                    slidesPerView: 2.5,
                },
                620: {
                    slidesPerView: 2.6
                },
                670: {
                    slidesPerView: 2.8
                },
                768: {
                    slidesPerView: 3.2
                },
                1024: {
                    slidesPerView: 3.8,
                },
            }}
        >
            {secondaryTournaments.map((Tournament, index) => (
                <SwiperSlide
                    key={index}
                    className='overflow-hidden rounded-[10px] relative'
                >
                    <div>
                        <img
                            src={Tournament.banner}
                            alt={`Banner ${index + 1}`}
                            className='h-[100px] w-full object-cover object-center'
                            onClick={Tournament.callback}
                        />
                        {checkIfDisplayTimer(Tournament) > 0 && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "0",
                                    left: "20px",
                                    backgroundColor: "#CCF900",
                                    borderRadius: "10px",
                                }}
                            >
                                <CountdownTimer
                                    timeLeft={checkIfDisplayTimer(Tournament)}
                                    primaryTimer={Tournament.secondaryTimer}
                                />
                            </div>
                        )}
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
};


export const TertiaryActionCaurosel = ({ topFiveRewards, renderRewardItem, isDemo = false }) => {
    const navigate = useNavigate();
    return (
        <Swiper
            spaceBetween={20}
            slidesPerView={1.8}
            breakpoints={{
                768: {
                    slidesPerView: 3.4,
                },
            }}
            className='w-full'
            onClick={() => navigate(isDemo ? '/wallet?d=S' : '/wallet')}
        >
            {topFiveRewards?.map((reward, index) => (
                <SwiperSlide key={index} >
                    {renderRewardItem(reward)}
                </SwiperSlide>
            ))}
        </Swiper>
    );
};




export const BottomNavBar = ({ onlyLobby, isDemoGame, group, userId, showLogoutPopup, setShowLogoutPopup, shouldAddClassJam = false, handleDrawerToggle, notifications }) => {
    const { user } = useAuth();

    const [showPopup, setShowPopup] = useState(false);

    const handleContactUs = () => {
        setShowPopup(true);
    };

    const handleLogout = async () => {
        setShowLogoutPopup(true);
    };

    const handleViewPLan = () => {
        navigate(YOUR_PLAN_ROUTE);
    };

    const handleViewCertificates = () => {
        navigate('/certificates');
    };


    const [showOptions, setShowOptions] = useState(false);
    const navItems = useMemo(() => {
        const isFreePlan = FREE_TIER_LIST.includes(
            user?.currentSubscription.plan
        );
        return [
            { label: "Logout", onClickHandler: handleLogout },
            { label: "Contact Us", onClickHandler: handleContactUs },
            {
                label: "Certificates",
                onClickHandler: handleViewCertificates,
            }
            /*
            {
              label: isFreePlan ? "View Plans" : "Your Plan",
              onClickHandler: handleViewPLan,
            },*/
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const navigate = useNavigate();


    const navigateToTournamentLobby = () => {
        const url = `/tournament-lobby`;
        navigate(url);
    };


    const handlePopupClose = () => {
        setShowPopup(false);
        setShowOptions(false);
    };

    const multiplier = 1;

    // const handleCommunityClick = async () => {
    //     //get the list of documents in peopleYouMayKnow collection in an array and set it in local storage
    //     const list = [];
    //     //update this part with api call later..
    //     const peopleYouMayKnow = collection(db, 'children', userId, 'peopleYouMayKnow');
    //     const querySnapshot = await getDocs(peopleYouMayKnow);
    //     querySnapshot.forEach((doc) => {
    //         if (doc.data().firstName) {
    //             list.push({ id: doc.id, ...doc.data() });
    //         }
    //     });
    //set the list in local storage
    //     if (list && list.length > 0) {

    //         localStorage.setItem('peopleYouMayKnow', JSON.stringify(list));
    //         //encrypt the user id and navigate to the profile page
    //         const key = CryptoJS.enc.Hex.parse(secretKey);
    //         const iv = CryptoJS.enc.Hex.parse(initializationVector);
    //         const encryptedUserId = CryptoJS.AES.encrypt(list[0].id, key, { iv: iv }).toString();
    //         let urlSafeEncryptedUserId = encryptedUserId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    //         navigate(`/profile/${urlSafeEncryptedUserId}?mode=findfriends`);
    //     }
    // }


    const handleShowNotifications = () => {
        //navigate('/notifications');
    }


    return (
        <div style={{ position: 'absolute', width: '100vw', height: '60px', zIndex: 999 }}>
            {showPopup && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1000, // Ensure overlay is above other elements
                    }}
                    onClick={handlePopupClose} // Close popup when clicking on the background overlay
                />
            )}

            {showOptions ? (
                <div style={{
                    position: 'fixed',
                    width: '30%',
                    bottom: '60px',
                    right: '6px',
                    height: 'auto',
                    textAlign: "start",
                    backgroundColor: "#232323",
                    zIndex: '1001',
                    padding: "16px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}>
                    {navItems.map((item, idx) => (
                        <div key={idx} style={{ height: '50%', textAlign: "start", color: "#ccf900", textDecoration: 'none', paddingTop: '10px', paddingLeft: '10px' }} onClick={item.onClickHandler}>
                            {item.label}
                        </div>
                    ))}
                </div>
            ) : null}
            <div className='flex justify-between items-center bg-[#323232] h-[60px] w-screen fixed bottom-0 p-[5vw] md:px-[15vw]' >
                {/* <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }} onClick={() => (shouldAddClassJam && navigate('/class-jam'))}>
                    <img
                        src={`Assets/Icons/${shouldAddClassJam ? 'class-corner.svg' : 'lobby.svg'}`}
                        alt="navigator"
                        className={`h-5 ${shouldAddClassJam ? 'w-7' : 'w-5'} aspect-square md:w-8`}
                    />
                    <div className='text-xs md:text-base'>{shouldAddClassJam ? 'Class Adda' : 'Lobby'}</div>
                </div> */}
                {!onlyLobby && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }} /*onClick={handleCommunityClick}*/ onClick={() => navigate('/arena')}>
                            <img
                                src='Assets/Icons/battleground.svg'
                                alt="navigator"
                                className='w-5 aspect-square md:w-8'
                            />
                            <div className='text-xs md:text-base'>BattleGround</div>

                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }} onClick={(event) => { event.stopPropagation(); navigateToTournamentLobby() }}>
                            <img
                                src='Assets/Icons/trophy-outline-green.svg'
                                alt="navigator"
                                className='w-5 aspect-square md:w-8'
                            />
                            <div className='text-xs md:text-base'>Tournaments</div>
                        </div>
                    </>
                )}

                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }} onClick={(event) => {
                        event.stopPropagation(); handleDrawerToggle();
                        MEASURE(INSTRUMENTATION_TYPES.NOTIFICATION_CLICK, user.id, {
                            notificationMessage: notifications?.[0] ?? ""
                        });
                    }}>
                        <img
                            src={notifications?.[0] === "No new notifications" ? 'Assets/Icons/notification-outline.svg' : 'Assets/Icons/notification-solid.svg'}
                            alt="navigator"
                            className='w-5 aspect-square md:w-8'
                        />
                        <div className='text-xs md:text-base'>Notifications</div>
                    </div>
                </div>


                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }} onClick={(event) => { event.stopPropagation(); setShowOptions(!showOptions) }}>
                    <img
                        src='Assets/Icons/more.svg'
                        alt="navigator"
                        className='w-5 aspect-square md:w-8'
                    />
                    <div className='text-xs md:text-base' >More</div>

                </div>
            </div>
            {showPopup && (
                <div
                    style={{
                        width: "70%",
                        color: "white",
                        boxShadow: 24,
                        textAlign: "center",
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#3a3a3a',
                        padding: '20px',
                        borderRadius: '10px',
                        zIndex: 9999,
                    }}
                >
                    <p> You can reach us at </p>
                    <p>+918618006284</p>

                </div>
            )}
        </div>
    );
};


const NewLobby = () => {
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
    const { user, isPremierPlan, logout } = useAuth();
    const [primaryStartTime, setPrimaryStartTime] = useState('');
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

    const [demoTournament, setDemoTournament] = useState({});
    const [ongoingTournament, setOngoingTournament] = useState({});
    const [closestTournament, setClosestTournament] = useState({});
    const [firstTournamentGameData, setFirstTournamentGameData] = useState({});
    const [ongoingUpcomingSchoolTournamentPresent, setOngoingUpcomingSchoolTournamentPresent] = useState(false);
    const [isCreditHistoryValidForVault, setIsCreditHistoryValidForVault] = useState(false);
    const ongoingSchoolTournamentBanner = 'https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FSchool%20Tournament%20Weekend%20Primary.png?alt=media&token=2cd73005-46b9-4ce2-90d0-e088a596fd4e';
    const upcomingTournaments = '/Assets/Images/upcomingTournaments.png';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const isDemoGame = searchParams.get("d") === "Y";
    const group = searchParams.get("group") ?? "";
    let roundFormat = '';
    const timeLeftInSeconds = timeStringToSeconds(timeLeft);

    const listOfBanners = ['/Assets/Images/triviaCorner.png'];

    const [tournamentStatus, setTournamentStatus] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [mobileOpen, setMobileOpen] = useState(false);


    const shouldAddClassJam = !user?.tenantIds?.includes(DEFAULT_TENANT_ID);

    useEffect(() => {
        const getTopFiveRewards = async () => {
            const { data } = await axios.get(`${process.env.REACT_APP_NODE_BASE_URL}/rewards/getTopFive`);
            return data.data;
        };

        getTopFiveRewards().then(rewards => setTopFiveRewards(rewards));
    }, []);

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
        const fetchData = async () => {

            const isCreditHistoryValidForVault = await isWalletHistoryCreditMoreThanZero(user?.id);
            setIsCreditHistoryValidForVault(isCreditHistoryValidForVault);

            const getfirstDemoGameDetails = async () => {
                const firstTournamentGameDetails = await getDoc(doc(db, 'tournaments', FIRST_DEMO_GAME_TID));
                setFirstDemoGameData(firstTournamentGameDetails.data());
            };

            /*const ongoingUpcomingSchoolTournament = async () => {
                const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/user/ongoing-upcoming-school-tournament`, 
                {
                userId: user?.id
                });
                setOngoingUpcomingSchoolTournamentPresent(response.data.data);
            }*/
            const demoTournamentUrl = `${process.env.REACT_APP_NODE_BASE_URL}/user/get-demo-tournament/${user?.id}`;
            const ongoingTournamentUrl = `${process.env.REACT_APP_NODE_BASE_URL}/user/get-ongoing-tournament/${user?.id}`;
            const closestTournamentUrl = `${process.env.REACT_APP_NODE_BASE_URL}/user/get-closest-tournament/${user?.tenantStatus}`;
            const isFirstTournamentGame = `${process.env.REACT_APP_NODE_BASE_URL}/user/is-first-tournament-game/${user?.id}`;
            //const ongoingUpcomingSchoolTournamentPresent = `${process.env.REACT_APP_NODE_BASE_URL}/user/ongoing-upcoming-school-tournament-present/${user?.id}`;

            try {
                const [demoTournamentResponse, ongoingTournamentResponse, closestTournamentResponse, isFirstTournamentGameResponse] = await Promise.all([
                    axios.get(demoTournamentUrl),
                    axios.get(ongoingTournamentUrl),
                    axios.get(closestTournamentUrl),
                    axios.get(isFirstTournamentGame),
                    getfirstDemoGameDetails(),
                    //ongoingUpcomingSchoolTournament()
                ]);
                // Setting the state for demo tournament
                if (demoTournamentResponse.data?.data) {
                    setDemoTournament(demoTournamentResponse.data.data);
                }

                // Setting the state for ongoing tournament
                if (ongoingTournamentResponse.data?.data) {

                    let ongoingData = ongoingTournamentResponse.data.data;
                    if (ongoingData?.ongoing?.tournamentData?.poolIds?.includes(ongoingData?.lastCompleted?.tournamentData?.id)) {
                        ongoingData.lastCompleted = null;
                    }

                    setOngoingTournament(ongoingData);
                }

                // Setting the state for closest tournament
                if (closestTournamentResponse.data?.data) {
                    setClosestTournament(closestTournamentResponse.data.data);
                }
                if (isFirstTournamentGameResponse?.data) {
                    setFirstTournamentGameNotPlayed(isFirstTournamentGameResponse.data.data.isFirstGame);
                    setFirstTournamentGameData(isFirstTournamentGameResponse.data.data.firstDemoTournament);
                }
                setComponentLoading(false);

            } catch (error) {
                console.error('Error fetching tournament data:', error);
            }
        };

        fetchData();
    }, [user]);


    // useEffect(() => {
    //     const handleSetPeopleYouMayKnow = async () => {
    //         try {
    //             const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/set-people-you-may-know`, { userId: user?.id });
    //         } catch (error) {
    //             console.error('Error loading more friends:', error);
    //         }
    //     };
    //     handleSetPeopleYouMayKnow();
    // }, []);

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

    const enterTournament = () => {
        if (ongoingTournament?.ongoing?.tournamentData) {
            const ct = ongoingTournament?.ongoing?.tournamentData;
            const url = `/chat?tId=${ct.id}&back=lobby`;
            navigate(url);
        }
        else if (demoTournament?.tournamenData) {
            const ct = demoTournament?.tournamenData;
            const url = `/chat?tId=${ct.id}&back=lobby`;
            navigate(url);
        }
    };

    const enterCompletedTournament = () => {
        if (ongoingTournament?.lastCompleted?.tournamentData) {
            const ct = ongoingTournament?.lastCompleted?.tournamentData;
            const url = `/chat?tId=${ct.id}&back=lobby`;
            navigate(url);
        }
    };


    const register = () => {
        const url = `/tournament/select`;
        navigate(url);
    }

    const navigateToSchoolLobby = () => {
        const url = `/school-lobby`;
        navigate(url);
    }

    const playArenaGame = () => {
        navigate("/arena");
    }
    const handleLogout = async () => {
        await logout();
        let redirectUrl = "/login";
        if (isDemoGame) {
            redirectUrl += "?d=Y";
            if (group) {
                redirectUrl += `&group=${group}`;
            }
        }
        navigate(redirectUrl);
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
                        <p className="my-2 mx-0 ml-[-30px] text-center">Are you sure you want to logout?</p>
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

    const renderBanner = (banner, index) => {
        return (

            <div style={{ width: '40%', height: '12vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: '10px' }}>
                <img
                    src={banner}
                    style={{ width: '100%', height: '10vh', objectFit: 'contain' }}
                />
            </div>
        );
    };
    const isWeekday = (istDate) => {
        const day = istDate.getDay();
        const hour = istDate.getHours();
        if (day >= 1 && day <= 5) {
            if (day === 5) {
                return hour < 17;
            }
            return true;
        }
        return false;
    }

    const isDemoRoundTime = (istDate) => {
        const day = istDate.getDay();
        const hour = istDate.getHours();
        const minutes = istDate.getMinutes();
        if (day === 5 && hour >= 17) {
            return true;
        }
        else if (day === 6 && (hour < 13 || hour === 13 && minutes < 30)) {
            return true;
        }
        return false;
    }

    const weekendTournamentTime = (istDate) => {
        const day = istDate.getDay();
        const hour = istDate.getHours();
        const minutes = istDate.getMinutes();
        if (day === 6 && (hour > 13 || (hour == 13 && minutes >= 30))) {
            return true;
        }
        else if (day === 0) {
            return true;
        }
        return false;
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

    const isChildregistered = (tournamentId) => {
        const childTournaments = childData.registrations;
        return childTournaments.includes(tournamentId);
    }

    const returnRoundTimers = () => {

        const day = istDate.getDay();
        const hour = istDate.getHours();
        const minutes = istDate.getMinutes();

        const roundOneDay = 6;
        const roundOneStartHours = 14;
        const roundOneStartMinutes = 0;
        const roundOneEndHours = 17;
        const roundOneEndMinutes = 0;

        const roundTwoDay = 0;
        const roundTwoStartHours = 10;
        const roundTwoStartMinutes = 0;
        const roundTwoEndHours = 13;
        const roundTwoEndMinutes = 0;

        const roundThreeDay = 0;
        const roundThreeStartHours = 14;
        const roundThreeStartMinutes = 0;
        const roundThreeEndHours = 17;
        const roundThreeEndMinutes = 0;

        if (day === 6) {
            if (hour < roundOneStartHours) {
                return ["Round Starts In", `${roundOneStartHours}:${roundOneStartMinutes}`];
            }
            else if (hour < roundOneEndHours) {
                return ["Round LIVE for", `${roundOneEndHours}:${roundOneEndMinutes}`];
            }
            else {
                return ["Round Starts In", `${roundTwoStartHours}:${roundTwoStartMinutes}`];
            }

        }
        if (day === 0) {
            if (hour < roundTwoStartHours) {
                return ["Round Starts In", `${roundTwoStartHours}:${roundTwoStartMinutes}`];
            }
            else if (hour < roundTwoEndHours) {
                return ["Round LIVE for", `${roundTwoEndHours}:${roundTwoEndMinutes}`];
            }
            else if (hour < roundThreeStartHours) {
                return ["Round Starts In", `${roundThreeStartHours}:${roundThreeStartMinutes}`];
            }
            else if (hour < roundThreeEndHours) {
                return ["Round LIVE for", `${roundThreeEndHours}:${roundThreeEndMinutes}`];
            }

        }
        return ["Round Starts In", `${roundOneStartHours}:${roundOneStartMinutes}`];
    }

    const gameHourInHalfHour = (istDate) => {
        //if current time is 30mins before game start time return true.
        const hour = istDate.getHours();
        const minutes = istDate.getMinutes();
        if (hour <= gameStartHour) {
            if (hour === gameStartHour) {
                return gamestartMinutes - minutes <= 30;
            }
            else if (hour === gameStartHour - 1 && minutes - gamestartMinutes >= 30) {
                return true;
            }
        }
        return false;
    }

    const playGame = async (tId, activeRound, isWeeklyQuiz = false, isPractice = false, isQuiz = false) => {
        const data = [];

        if (!isPractice) {

            const q = query(
                collection(db, `children/${user?.id}/games`),
                where("tournamentId", "==", tId),
                where("round", "==", String(activeRound)),
                where("startTime", "!=", "")
            );

            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id });
            });
        }
        if (!data.length || isPractice || data.length && !data?.[0].endTime && data?.[0].attempts <= 1 && data?.[0]?.results?.length <= 1) {
            if (data.length) {
                await deleteDoc(doc(collection(db, `children/${user.id}/games`), data[0].id));
                localStorage.removeItem("gameType");
                const gameActionsRef = collection(db, "gameActions");
                const gameActionsQuery = query(
                    gameActionsRef,
                    where("gameId", "==", data[0].id),
                    where("actionType", "in", ["START", "END", "INIT"])
                );
                const querySnapshot = await getDocs(gameActionsQuery);
                const deletePromises = querySnapshot.docs.map((document) => {
                    const docRef = doc(db, "gameActions", document.id);
                    return deleteDoc(docRef);
                });
                await Promise.all(deletePromises);
            }
            checkIfRoundIsActive(tId, activeRound, isPractice).then((status) => {
                if (status) {
                    localStorage.setItem("tournamentID", tId);
                    localStorage.setItem("roundFormat", roundFormat);
                    localStorage.setItem("isWeeklyQuiz", isWeeklyQuiz);
                    localStorage.setItem("isQuiz", isQuiz);
                    initialiseGame(tId, roundFormat, activeRound);
                } else {
                    setToastMessage(
                        "This round is not active. Please wait for a round to begin."
                    );
                    setOpen(true);
                }
            });
        } else {
            setToastMessage(
                "You have already played this round. Please wait for the next round to start."
            );
            setOpen(true);
        }
    };

    const initialiseGame = (tournamentId, roundFormat = "", activeRound) => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        //myHeaders.append("Access-Control-Allow-Origin", "*");
        const localStorageChildId = localStorage.getItem("userId");
        const roundBaseDifficulty = localStorage.getItem("baseDifficulty");
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
                let url = `/quiz/tournament?tId=${tournamentId}&rF=${roundFormat}`;
                if (isDemoGame) {
                    url += `&d=Y&gId=${result}`;
                    if (group) {
                        url += `&group=${group}`;
                    }
                }
                localStorage.setItem("gId", result);

                if (NEW_FORMAT_TOURNAMENT_GAMES.includes(roundFormat)) {
                    if (roundBaseDifficulty === 6) {
                        url = `/quiz/newFormatGame?tId=${tournamentId}&rF=${roundFormat}&r=${activeRound}&pro=Y`;
                    } else {
                        url = `/quiz/newFormatGame?tId=${tournamentId}&rF=${roundFormat}&r=${activeRound}`;
                    }
                }
                navigate(url);
            })
            .catch((error) => {
                window.location.href = "/error";
            });
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
            const { roundCTA, roundInitImage, roundFact, phasePattern, baseDifficulty, roundDuration } = round;
            if (roundCTA && roundInitImage) {
                localStorage.setItem(
                    "roundInfo",
                    JSON.stringify({ roundCTA, roundInitImage, roundFact })
                );
            }
            localStorage.setItem("roundDuration", roundDuration);
            localStorage.setItem("roundTitle", round.title);
            localStorage.setItem("keyboardType", round.keyboardType);
            localStorage.setItem("assertionLogic", round.assertionLogic);
            localStorage.setItem("quizColl", round.quizCollection);
            localStorage.setItem(POSITIVE_SCORE_LS_KEY, round.positiveScore ?? DEFAULT_POSIIVE_SCORE);
            localStorage.setItem(NEGATIVE_SCORE_LS_KEY, round.negativeScore ?? DEFAULT_NEGATIVE_SCORE);
            localStorage.setItem(ENABLE_SKIP_LS_KEY, round.enableSkip ?? false);
            if (phasePattern?.[1]) {
                localStorage.setItem("roundDifficultyPattern", phasePattern?.[1]);
            }
            localStorage.setItem("baseDifficulty", baseDifficulty);

            if (roundS === "ONGOING" || isPractice) return true;
            else return false;
        } else {
            return false;
        }
    };

    const playDemo = () => {
        if (!demoRoundPlayed) {
            const ct = demoTournament.tournamentData;
            playGame(ct.id, ct.activeRound, true, false, ct.isQuiz)
            setDemoRoundPlayed(true);
        }
    }


    const playFirstDemo = async () => {
        const ct = firstTournamentGameData;
        //check if the user is registered to FIRST_DEMO_GAME_TID
        if (!isChildregistered(ct.id)) {
            //register for this tournament...
            const data = await registerMultipleTournaments(user.id, [ct.id]);
        }
        if (!demoRoundPlayed) {
            playGame(ct.id, ct.activeRound, false, false, ct.isQuiz)
            setDemoRoundPlayed(true);
        }
    }

    const navigateToTournamentSelect = () => {
        const url = `/tournament/select`;
        navigate(url);
    };

    const redirectToLeaderboard = () => {
        const tId = demoTournament?.tournamentData?.id;
        let url = `/leaderboard?tId=${tId}`;
        navigate(url);
        // window.location.href = `/leaderboard?tId=${tId}`;
    };


    useEffect(() => {
        const setPrimaryAndSecondaryTournament = () => {

            //if it is a weekday(monday to friday 5pm)
            if (isWeekday(istDate)) {
                if (isGameHour(istDate)) {


                    setArenaAsPrimary(true);

                    const secondaryTournamentsData = [
                        ...(shouldAddClassJam ? [{
                            banner: classJamBanner,
                            callback: () => { return navigate('/class-jam') }
                        }] : []),
                        {
                            banner: upcomingTournaments,
                            callback: () => { return navigate('/tournament/select') }
                        },
                        {
                            banner: triviaCorner,
                            callback: () => { return navigate('/pop-quiz-lobby') }
                        }
                    ];
                    setSecondaryTournaments(secondaryTournamentsData);
                }
                else if (gameHourInHalfHour(istDate)) {


                    setArenaAsPrimary();


                    /*setPrimaryTournamentBanner(oneononeImage);
                    setPrimaryTournamentHeader("BattleGround");
                    setPrimaryStartTime(`${gameStartHour}:${gamestartMinutes}`);
                    setPrimaryTournamentCallBack(() => { return playArenaGame });
                    setPrimaryActionName('Enter BattleGround');*/

                    const secondaryTournamentsData = [
                        ...(shouldAddClassJam ? [{
                            banner: classJamBanner,
                            callback: () => { return navigate('/class-jam') }
                        }] : []),
                        {
                            banner: upcomingTournaments,
                            callback: () => { return navigate('/tournament/select') }
                        },
                        {
                            banner: triviaCorner,
                            callback: () => { return navigate('/pop-quiz-lobby') }
                        }
                    ];
                    setSecondaryTournaments(secondaryTournamentsData);
                }
                else {
                    let demoIsPrimary = false;
                    if (closestTournament?.tournamentData) {
                        demoIsPrimary = setClosestTournamentAsPrimary();

                    }
                    else {
                        demoIsPrimary = setUpcomingTournamentAsPrimary();

                    }

                    let secondaryTournamentsData = setSecondaryTournamentArray(demoIsPrimary);


                    setSecondaryTournaments(secondaryTournamentsData);
                    /*setSecondaryTournamentBanner(gameArenaImage);
                    setSecondaryTournamentCallBack(() => { return playArenaGame });
                    setSecondaryStartTime(`${gameStartHour}:${gamestartMinutes}`);*/
                }
            }



            ///if it is a demo round time(frindaay 5pm to sunday 1:30pm)
            else if (isDemoRoundTime(istDate)) {
                if (isGameHour(istDate)) {
                    if (demoTournament?.tournamentData) {
                        setDemoTournamentAsPrimary();

                        //setArenaAsSecondary();
                        const secondaryTournamentsData = [
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: gameArenaImage,
                                callback: () => { return navigate("/arena") },
                                startTime: `${gameEndHour}:${gameEndMinutes}`,
                                secondaryTimer: "LIVE for"
                            },
                            {
                                banner: upcomingTournaments,
                                callback: () => { return navigate('/tournament/select') }
                            },
                            {
                                banner: triviaCorner,
                                callback: () => { return navigate('/pop-quiz-lobby') }
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);
                    }
                    else {
                        setArenaAsPrimary(true);

                        const secondaryTournamentsData = [
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: upcomingTournaments,
                                callback: () => { return navigate('/tournament/select') }
                            },
                            {
                                banner: triviaCorner,
                                callback: () => { return navigate('/pop-quiz-lobby') }
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);

                    }
                }
                else if (gameHourInHalfHour(istDate)) {
                    if (demoTournament?.tournamentData) {
                        setPrimaryTournamentBanner(demoTournament.tournamentData.newLobbyTournamentBanner);
                        setPrimaryTournamentData(demoTournament.tournamentData);
                        setPrimaryTournamentName(demoTournament.tournamentData.name);
                        setPrimaryTournamentCallBack(() => { return playDemo });
                        setPrimaryActionName('Play Demo');
                        setPrimaryTournamentHeader("Tournament Arena");
                        setPrimaryisUpcoming(true);
                        setPrimaryStartTime("");
                        setOneOnOne(false);

                        const secondaryTournamentsData = [
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: gameArenaImage,
                                callback: () => { return navigate("/arena") },
                                startTime: `${gameStartHour}:${gamestartMinutes}`

                            },
                            {
                                banner: upcomingTournaments,
                                callback: () => { return navigate('/tournament/select') }
                            },
                            {
                                banner: triviaCorner,
                                callback: () => { return navigate('/pop-quiz-lobby') }
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);

                    }
                    else {
                        setArenaAsPrimary();

                        const secondaryTournamentsData = [
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: upcomingTournaments,
                                callback: () => { return navigate('/tournament/select') }
                            },
                            {
                                banner: triviaCorner,
                                callback: () => { return navigate('/pop-quiz-lobby') }
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);
                    }

                }
                else {

                    /*if(ongoingUpcomingSchoolTournamentPresent){
                        setPrimaryTournamentBanner(ongoingSchoolTournamentBanner);
                        setPrimaryTournamentCallBack(() => { return navigateToSchoolLobby });
                        setPrimaryActionName('School Arena');

                        const secondaryTournamentsData = [
                            {
                                banner: upcomingTournaments,
                                callback: () => { return navigate('/tournament/select') }
                            },
                            {
                                banner: gameArenaImage,
                                callback: () => { return navigate("/arena") },
                                startTime: `${gameStartHour}:${gamestartMinutes}`
                            },
                            {
                                banner: triviaCorner,
                                callback: () => { return navigate('/pop-quiz-lobby') }
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);

                    }*/
                    if (demoTournament?.tournamentData) {


                        setDemoTournamentAsPrimary();

                        const secondaryTournamentsData = [
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: upcomingTournaments,
                                callback: () => { return navigate('/tournament/select') }
                            },
                            {
                                banner: gameArenaImage,
                                callback: () => { return navigate("/arena") },
                                startTime: `${gameStartHour}:${gamestartMinutes}`
                            },
                            {
                                banner: triviaCorner,
                                callback: () => { return navigate('/pop-quiz-lobby') }
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);
                    }
                    else if (closestTournament?.tournamentData) {
                        const demoIsPrimary = setClosestTournamentAsPrimary();
                        let secondaryTournamentsData = setSecondaryTournamentArray(demoIsPrimary);


                        setSecondaryTournaments(secondaryTournamentsData);

                    }
                    else {
                        const demoIsPrimary = setUpcomingTournamentAsPrimary();

                        let secondaryTournamentsData = setSecondaryTournamentArray(demoIsPrimary);

                        setSecondaryTournaments(secondaryTournamentsData);

                    }

                }
            }

            //if it is a weekend tournament time(saturday 1:30pm to sunday 5pm)
            else if (weekendTournamentTime(istDate)) {
                if (isGameHour(istDate)) {

                    setArenaAsPrimary(true);

                    let secondaryTournamentsData;

                    secondaryTournamentsData = [
                        ...(ongoingTournament?.ongoing?.tournamentData ? [{
                            banner: ongoingTournament?.ongoing?.tournamentData?.secondaryBanner ? ongoingTournament?.ongoing?.tournamentData?.secondaryBanner : ongoingTournament?.ongoing?.tournamentData?.newLobbyTournamentBanner,
                            callback: () => navigate(`/chat?tId=${ongoingTournament?.ongoing?.tournamentData.id}&back=lobby`)
                        }] : []),
                        ...(ongoingTournament?.lastCompleted?.tournamentData ? [{
                            banner: ongoingTournament?.lastCompleted?.tournamentData?.secondaryBanner ? ongoingTournament?.lastCompleted?.tournamentData?.secondaryBanner : ongoingTournament?.lastCompleted?.tournamentData?.newLobbyTournamentBanner,
                            callback: () => navigate(`/chat?tId=${ongoingTournament?.lastCompleted?.tournamentData.id}&back=lobby`)
                        }] : []),
                        ...(shouldAddClassJam ? [{
                            banner: classJamBanner,
                            callback: () => { return navigate('/class-jam') }
                        }] : []),
                        {
                            banner: upcomingTournaments,
                            callback: () => navigate('/tournament/select')
                        },
                        {
                            banner: triviaCorner,
                            callback: () => navigate('/pop-quiz-lobby')
                        }
                    ];

                    setSecondaryTournaments(secondaryTournamentsData);
                }
                else if (gameHourInHalfHour(istDate)) {

                    setArenaAsPrimary();

                    let secondaryTournamentsData = [
                        ...(ongoingTournament?.ongoing?.tournamentData ? [{
                            banner: ongoingTournament?.ongoing?.tournamentData?.secondaryBanner ? ongoingTournament?.ongoing?.tournamentData?.secondaryBanner : ongoingTournament?.ongoing?.tournamentData?.newLobbyTournamentBanner,
                            callback: () => navigate(`/chat?tId=${ongoingTournament?.ongoing?.tournamentData.id}&back=lobby`)
                        }] : []),
                        ...(ongoingTournament?.lastCompleted?.tournamentData ? [{
                            banner: ongoingTournament?.lastCompleted?.tournamentData?.secondaryBanner ? ongoingTournament?.lastCompleted?.tournamentData?.secondaryBanner : ongoingTournament?.lastCompleted?.tournamentData?.newLobbyTournamentBanner,
                            callback: () => navigate(`/chat?tId=${ongoingTournament?.lastCompleted?.tournamentData.id}&back=lobby`)
                        }] : []),
                        ...(shouldAddClassJam ? [{
                            banner: classJamBanner,
                            callback: () => { return navigate('/class-jam') }
                        }] : []),
                        {
                            banner: upcomingTournaments,
                            callback: () => navigate('/tournament/select')
                        },
                        {
                            banner: triviaCorner,
                            callback: () => navigate('/pop-quiz-lobby')
                        }
                    ];

                    setSecondaryTournaments(secondaryTournamentsData);
                }
                else {
                    if (ongoingUpcomingSchoolTournamentPresent) {
                        setPrimaryTournamentBanner(ongoingSchoolTournamentBanner);
                        setPrimaryTournamentCallBack(() => { return navigateToSchoolLobby });
                        setPrimaryActionName('School Lobby');

                        const secondaryTournamentsData = [
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: upcomingTournaments,
                                callback: () => { return navigate('/tournament/select') }
                            },
                            {
                                banner: gameArenaImage,
                                callback: () => { return navigate("/arena") },
                                startTime: `${gameStartHour}:${gamestartMinutes}`
                            },
                            {
                                banner: triviaCorner,
                                callback: () => { return navigate('/pop-quiz-lobby') }
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);

                    }
                    //if there ia ongoinf set it as primary or else if there is a non-demo ended tournament in the last 5 hours show it as primary..
                    else if (ongoingTournament?.ongoing?.tournamentData) {
                        setPrimaryTournamentBanner(ongoingTournament?.ongoing?.tournamentData?.newLobbyTournamentBanner);
                        setPrimaryTournamentData(ongoingTournament?.ongoing?.tournamentData);
                        setPrimaryTournamentName(ongoingTournament?.ongoing?.tournamentData?.name);
                        setPrimaryTournamentCallBack(() => { return enterTournament });
                        setPrimaryActionName('Enter Tournament');
                        setPrimaryisUpcoming(true);
                        setPrimaryStartTime(returnRoundTimers()[1]);
                        setPrimaryTimer(returnRoundTimers()[0]);

                        let secondaryTournamentsData = [
                            ...(ongoingTournament?.lastCompleted?.tournamentData ? [{
                                banner: ongoingTournament?.lastCompleted?.tournamentData?.secondaryBanner ? ongoingTournament?.lastCompleted?.tournamentData?.secondaryBanner : ongoingTournament?.lastCompleted?.tournamentData?.newLobbyTournamentBanner,
                                callback: () => navigate(`/chat?tId=${ongoingTournament?.lastCompleted?.tournamentData.id}&back=lobby`)
                            }] : []),
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: upcomingTournaments,
                                callback: () => navigate('/tournament/select')
                            },
                            {
                                banner: gameArenaImage,
                                callback: () => navigate("/arena"),
                                startTime: `${gameStartHour}:${gamestartMinutes}`
                            },
                            {
                                banner: triviaCorner,
                                callback: () => navigate('/pop-quiz-lobby')
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);
                    }
                    else if (ongoingTournament?.lastCompleted?.tournamentData) {
                        setPrimaryTournamentBanner(ongoingTournament?.lastCompleted?.tournamentData?.newLobbyTournamentBanner);
                        setPrimaryTournamentData(ongoingTournament?.lastCompleted?.tournamentData);
                        setPrimaryTournamentName(ongoingTournament?.lastCompleted?.tournamentData?.name);
                        setPrimaryTournamentCallBack(() => { return enterCompletedTournament });
                        setPrimaryActionName('Enter Tournament');
                        setPrimaryisUpcoming(true);

                        let secondaryTournamentsData = [
                            ...(shouldAddClassJam ? [{
                                banner: classJamBanner,
                                callback: () => { return navigate('/class-jam') }
                            }] : []),
                            {
                                banner: upcomingTournaments,
                                callback: () => navigate('/tournament/select')
                            },
                            {
                                banner: gameArenaImage,
                                callback: () => navigate("/arena"),
                                startTime: `${gameStartHour}:${gamestartMinutes}`
                            },
                            {
                                banner: triviaCorner,
                                callback: () => navigate('/pop-quiz-lobby')
                            }
                        ];
                        setSecondaryTournaments(secondaryTournamentsData);
                    }


                    else if (closestTournament?.tournamentData) {

                        const demoIsPrimary = setClosestTournamentAsPrimary();

                        let secondaryTournamentsData = setSecondaryTournamentArray(demoIsPrimary);

                        setSecondaryTournaments(secondaryTournamentsData);
                    }

                    else {

                        const demoIsPrimary = setUpcomingTournamentAsPrimary();

                        let secondaryTournamentsData = setSecondaryTournamentArray(demoIsPrimary);

                        setSecondaryTournaments(secondaryTournamentsData);
                    }
                }
            }
        }
        setPrimaryAndSecondaryTournament();
    }, [closestTournament, demoTournament, ongoingTournament]);

    useEffect(() => {
        const tournamentStatus = TournamentStatus(closestTournament, demoTournament, ongoingTournament);
        setTournamentStatus(tournamentStatus);
    }, [closestTournament, demoTournament, ongoingTournament]);

    const setArenaAsSecondary = () => {
        setSecondaryTournamentBanner(gameArenaImage);
        setSecondaryStartTime(`${gameStartHour}:${gamestartMinutes}`);
        setSecondaryTournamentCallBack(() => { return playArenaGame });
    }

    const setArenaAsPrimary = (isGameHour = false) => {
        setPrimaryTournamentBanner(oneononeImage);
        setPrimaryStartTime(`${gameStartHour}:${gamestartMinutes}`);
        setPrimaryTournamentHeader("BattleGround");
        setPrimaryTournamentCallBack(() => { return playArenaGame });
        setPrimaryStartTime(`${gameEndHour}:${gameEndMinutes}`);
        //setPrimaryTimer("Next Round Starts In")
        setOneOnOne(true);
        if (isGameHour) {
            setPrimaryActionName('Play Now');
            setPrimaryTimer("LIVE for");
            setPrimaryStartTime(`${gameEndHour}:${gameEndMinutes}`);
        }
        else {
            setPrimaryTimer("LIVE In");
            setPrimaryStartTime(`${gameStartHour}:${gamestartMinutes}`);
            setPrimaryisUpcoming(true);
            setPrimaryActionName('Enter BattleGround');
        }

    }

    const setSecondaryTournamentArray = (demoIsPrimary) => {
        let secondaryTournamentsData;
        if (demoIsPrimary) {
            secondaryTournamentsData = [
                ...(shouldAddClassJam ? [{
                    banner: classJamBanner,
                    callback: () => { return navigate('/class-jam') }
                }] : []),
                {
                    banner: upcomingTournaments,
                    callback: () => navigate('/tournament/select')
                },
                {
                    banner: gameArenaImage,
                    callback: () => { return navigate("/arena") },
                    startTime: `${gameStartHour}:${gamestartMinutes}`
                },
                {
                    banner: triviaCorner,
                    callback: () => { return navigate('/pop-quiz-lobby') }
                }
            ];
        }
        else {
            secondaryTournamentsData = [
                ...(shouldAddClassJam ? [{
                    banner: classJamBanner,
                    callback: () => { return navigate('/class-jam') }
                }] : []),
                {
                    banner: gameArenaImage,
                    callback: () => { return navigate("/arena") },
                    startTime: `${gameStartHour}:${gamestartMinutes}`
                },
                {
                    banner: triviaCorner,
                    callback: () => { return navigate('/pop-quiz-lobby') }
                }
            ];
        }

        return secondaryTournamentsData
    }

    const setClosestTournamentAsPrimary = () => {

        if (firstTournamentGameNotPlayed) {

            setFirstDemoGameAsPrimary();
            return true;

        }
        else {
            const { tournamentData, isRegistered } = closestTournament;
            setPrimaryTournamentBanner(tournamentData.newLobbyTournamentBanner);
            setPrimaryTournamentData(tournamentData);
            setPrimaryTournamentName(tournamentData.name);
            setPrimaryTournamentCallBack(() => { return navigateToTournamentSelect });
            if (isRegistered || user?.tenantStatus === "TENANT" || user?.tenantStatus === "TENANT_UNPAID") {
                setPrimaryActionName('View Tournaments');
            }
            else {
                setPrimaryActionName('Register');
            }
            setPrimaryTournamentHeader("Tournament Arena")
        }
    }

    const setUpcomingTournamentAsPrimary = () => {

        if (firstTournamentGameNotPlayed && user?.currentSubscription?.plan === "NEW") {
            setFirstDemoGameAsPrimary();
            return true;
        }
        else {
            setPrimaryTournamentBanner(upcomingTournaments);
            setPrimaryTournamentCallBack(() => { return navigateToTournamentSelect });
            setPrimaryisUpcoming(true);
            setPrimaryActionName('');
            setPrimaryTournamentHeader("Tournament Arena");
        }

    }

    const setFirstDemoGameAsPrimary = () => {
        if (!firstTournamentGameData) {
            return
        }
        setPrimaryTournamentBanner(firstTournamentGameData.newLobbyTournamentBanner);
        setPrimaryTournamentData(firstTournamentGameData);
        setPrimaryTournamentName(firstTournamentGameData.name);
        setPrimaryTournamentCallBack(() => { return playFirstDemo });
        setPrimaryActionName('Play Round');
        setPrimaryTournamentHeader("Play Your First Game");
        setPrimaryisUpcoming(true);
    }

    const setDemoTournamentAsPrimary = () => {
        setPrimaryTournamentBanner(demoTournament.tournamentData.newLobbyTournamentBanner);
        setPrimaryTournamentData(demoTournament.tournamentData);
        setPrimaryTournamentName(demoTournament.tournamentData.name);
        if (demoTournament.playedRound) {
            setPrimaryActionName('Your Stats');
            setPrimaryTournamentCallBack(() => { return redirectToLeaderboard });
        }
        else {
            setPrimaryTournamentCallBack(() => { return playDemo });
            setPrimaryActionName('Play Demo');
        }

        setPrimaryisUpcoming(true);
        setPrimaryTournamentHeader("Tournament Arena")
        setPrimaryStartTime(`13:30`);
        setPrimaryTimer("LIVE for");
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

    useEffect(() => {
        const fetchAndSetSchoolChild = async () => {
            try {
                const flag = await findSchoolChild(user.id);
                setisSchoolChild(flag);
            } catch (error) {
                // Handle any errors that occur during fetching
                console.error('Error fetching school child data:', error);
            }
        };

        fetchAndSetSchoolChild();
    }, []);

    useEffect(() => {
        const getAllNotifications = async () => {
            try {
                const tournamentStatus = getTournamentStatus(closestTournament, demoTournament, ongoingTournament);
                setNotifications([tournamentStatus]);
            } catch (error) {
                // Handle any errors that occur during fetching
                console.error('Error fetching notifications:', error);
            }
        };
        getAllNotifications();
    }, [closestTournament, demoTournament, ongoingTournament]);
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: "center", backgroundColor: "#232323" }}>
            <div className="text-center text-[20px] m-2 mt-4 text-[#ccf900]">Notifications</div>
            {notifications.map((notification) => (
                <Box key={notification.id} sx={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px", paddingTop: "20px", borderTop: "1px solid #3a3a3a" }}>
                    <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center m-2">
                                <div className="text-[14px]" style={{ color: 'white' }}>
                                    <div dangerouslySetInnerHTML={{ __html: notification }} />
                                </div>
                            </div>
                        </div>
                        <div>
                        </div>
                    </div>
                </Box>
            ))}
        </Box>
    );
    const container = window.document.body;
    const drawerWidth = 240;

    return (
        <div
            className={`flex flex-col h-full w-full text-white relative`}
        >
            {" "}
            {renderLogoutPopup()}
            {
                <div className="w-screen top-0">
                    <PlayerHeader
                        isCreditHistoryValidForVault={isCreditHistoryValidForVault}
                        isPremierPlan={isPremierPlan}
                        playerName={childData.firstName}
                        playerScore={500}
                        playerVault={wallet?.rewardPoints}
                        navigate={navigate}
                        childData={childData}
                        profileEmoji={user?.profileEmoji}
                        displayBack={false}
                        showSchool={isSchoolChild}
                        handleNaviagteProfilePage={handleNaviagteProfilePage}
                        tenantStatus={user?.tenantStatus}
                        navigateToProfile={shouldAddClassJam}
                    />
                </div>
            }
            <div
                className="w-screen px-[5vw] overflow-x-hidden justify-center pt-8 overflow-y-auto h-content"
                style={{ paddingTop: "60px", scrollBehavior: "smooth" }}
            >
                <div className="mt-[20px] mb-[20px]">
                    {componentLoading ? (
                        <>
                            <div
                                className="text-part"
                                style={{ fontSize: `${12 * multiplier}px` }}
                            >
                                {
                                    <h2
                                        className="m-0 font-extrabold mb-[10px] text-base"
                                        style={{ fontSize: `${16 * multiplier}px` }}
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
                        <div className="flex flex-col gap-4">
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
                            />
                        </div>
                    )}
                </div>
                <div
                    className="flex flex-col justify-between my-5 max-w-90vw"
                    style={{ fontSize: `${16 * multiplier}px` }}
                >
                    <div className="flex justify-between mb-[10px]">
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
                {user?.tenantStatus === "OPEN" && (
                    <div
                        className="flex flex-col justify-between mt-[20px] mb-[20px] max-w-full"
                        style={{ fontSize: `${16 * multiplier}px` }}
                    >
                        <div className="flex justify-between mb-[10px]">
                            <div>
                                <label>Reward Store</label>
                            </div>
                            <div>
                                <label
                                    className="underline cursor-pointer"
                                    style={{ fontSize: `${12 * multiplier}px` }}
                                    onClick={() => navigate("/wallet")}
                                >
                                    View all
                                </label>
                            </div>
                        </div>
                        <TertiaryActionCaurosel
                            topFiveRewards={topFiveRewards}
                            renderRewardItem={renderRewardItem}
                        />
                    </div>
                )}
            </div>
            <div>
                <BottomNavBar
                    isDemoGame={isDemoGame}
                    group={group}
                    userId={user?.id}
                    showLogoutPopup={showLogoutPopup}
                    setShowLogoutPopup={setShowLogoutPopup}
                    shouldAddClassJam={shouldAddClassJam}
                    handleDrawerToggle={handleDrawerToggle}
                    notifications={notifications}
                />

            </div>
            <AlertSnackbar
                isOpen={open}
                setIsOpen={setOpen}
                toastMessage={toastMessage}
            />
            <Drawer
                container={container}
                variant="temporary"
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: "block", sm: "none" },
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box",
                        width: "70%",
                        maxWidth: "300px",
                        height: "50%",
                        backgroundColor: "#232323",

                        position: "fixed",
                        top: "auto",
                        right: 0,
                        bottom: 0,
                        borderTopLeftRadius: "8px",
                        borderTopRightRadius: "0px",
                        borderBottomLeftRadius: "8px",
                        borderBottomRightRadius: "0px",
                    },
                }}
            >
                {drawer}
            </Drawer>

        </div>
    );
};

export default NewLobby;

