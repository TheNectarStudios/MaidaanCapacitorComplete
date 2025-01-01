import { Dialog } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FREE_USER_PLAN, NEW_USER_PLAN, addAndToLastItem, getDateObject, shareOnWhatsapp } from "../../../Constants/Commons";
import { useAuth } from "../../../providers/auth-provider";
// import { initiatePayment } from "../../../services/payment";
import { getTournamentsByUser, registerMultipleTournaments } from "../../../services/tournament";
import AppButton from "../../Common/AppButton";
import AppCheckbox from "../../Common/AppCheckbox";
import Layout from "../../Common/Layout";
import Loader from "../Loader";
import Lottie from "lottie-react";
import confettiAnimation from "../../../assets/animations/confetti.json";
import BottomButtonBar from "../../Common/BottomButtonBar";
import BackButton from "../../Common/BackButton";
import { MEASURE } from "../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import ArenaHeader from "../../../GamesArena/Common/ArenaHeader";
import axios from "axios";
import mixpanel from 'mixpanel-browser';
import UpcomingTournamentCarousel from "./UpcomingTournamentCarousel";
import PlanInfo from "./PlanInfo";
import NextFreeTournament from "./NextFreeTournament";
import TenantUserPaymentBanner from "./TenantUserPaymentBanner";
import SkeletonLoader from "../../Common/SkeletonLoader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase-config";
// import { toBlob } from "html-to-image";
// import { ref, getBlob } from "firebase/storage";
// import { storage } from "../../../firebase-config";

const SelectTournamentPage = () => {

    const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTournamentLoading, setIsTournamentLoading] = useState(true);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [whatsappShareLoading, setWhatsappShareLoading] = useState(false);
  const [registeredUpcomingTournaments, setRegisteredUpcomingTournaments] = useState([]);
  const [activeSlide, setActiveSlide] = useState(null);

  const redirectToLobby = searchParams.get("back")
  const isDemo = searchParams.get("d") === "S";
  

  useEffect(() => {
    if (user && !isDemo) {
      const fetchTournaments = async () => {
        const unsorteddata = await getTournamentsByUser(user.grade, user.id, false);
        const data = unsorteddata.sort((document1, document2) => {
          return document1.startDate._seconds - document2.startDate._seconds;
        });
        //const nonTenantTournaments = data.filter(tournament => !tournament.tenantIds);
        setActiveSlide(data[0]);
        setTournaments(data);
        setIsTournamentLoading(false);
      };

      const fetchUpcomingRegisteredTournaments = async () => {
        const response = await axios.get(`${process.env.REACT_APP_NODE_BASE_URL}/tournament/get-upcoming-registered-tournaments/${user.id}`);
        setRegisteredUpcomingTournaments(response.data.data);
      }

      fetchUpcomingRegisteredTournaments();
      fetchTournaments();
    }
    else if (isDemo) {
      const fetchDemoTournaments = async () => {
        const tournamentQuery = query(collection(db, 'tournaments'), where('showOnUpcoming', '==', true), where('startDate', '>', new Date()));
        const querySnapshot = await getDocs(tournamentQuery);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ ...doc.data(), id: doc.id });
        });
        setActiveSlide(data[0]);
        setTournaments(data);
        setIsTournamentLoading(false);
    }
    fetchDemoTournaments();
  }

  }, [user]);

  const handleTournamentSelection = (e, _tournament) => {
    if (e.target.checked) {
      setSelectedTournaments([...selectedTournaments, _tournament]);
    } else {
      setSelectedTournaments(
        selectedTournaments.filter(
          (tournament) => tournament.id !== _tournament.id)
      );
    }
  };
  const handleShare = async () => {
    setWhatsappShareLoading(true);
    try {
      const location = window.location;
      const registerUrl = `${location.protocol}//${location.host}/register?referralCode=${user.referralCode}`;
      const tournamentNameWithAnd = addAndToLastItem(selectedTournaments.map(tournament => tournament.name));
      const bodyText = `Hey hey!\n\nI've signed up to contest in Maidaan's ${tournamentNameWithAnd}!\n\nWant to join me in battling others *across India* for a *merit rank* and *exciting awards*?\n\nAccept my Invite: ${registerUrl}.\n\n- Play on mobile from home.\n- Only 10 mins needed on Sat & Sun.\n\nJoin students from 100+ Schools & 20+ Cities in a super-encouraging & thrilling environment for discovering your talents.\n\nQueries: 8618006284`;
      const data = {
        title: "",
        text: bodyText,
      };

      await shareOnWhatsapp(data);
    } catch (err) {
      console.log(err);
    }
    setWhatsappShareLoading(false);
  };

  const handleDialogClose = async (event, reason) => {
    if (reason && reason === "backdropClick") return;
    MEASURE(INSTRUMENTATION_TYPES.INVITE_FRIENDS, user.id, {});
    await handleShare();
    setOpenSuccessModal(false);
    navigate("/lobby", { replace: true });
  };

  const handleBack = () => {
    if(isDemo){
      navigate("/lobby-demo?d=S");
    }
    else if (redirectToLobby) {
      navigate(`/${redirectToLobby}`);
    } else {
      navigate("/lobby");
    }
  };

  const renderSuccessDialog = () => {
    return (
      <Dialog open={openSuccessModal} className="register-success">
        <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
          <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
          <span className="text-lg md:text-xl font-medium text-center">
            Game On!
          </span>
          <span className="text-sm text-center">
            Registration successful. All the best for the tournaments and
            remember to HAVE FUN!
          </span>
          <AppButton
            type="button"
            className="self-center z-10"
            onClick={handleDialogClose}
            isLoading={whatsappShareLoading}
          >
            Invite Friends
          </AppButton>
          <div onClick={() => {
            window.location.href = "/lobby";
          }
          } className="z-10">
            <span className="text-primary-yellow underline">
              Back to Lobby
            </span>
          </div>
          <Lottie
            animationData={confettiAnimation}
            loop={false}
            className="absolute h-full w-full top-0 z-0"
          />
        </div>
      </Dialog>
    );
  };

  const renderTournamentCheckbox = (tournament, isRegistered = false) => {
    const { id, name, topics, startDate, endDate, subject } = tournament;
    const topicsString = topics.join(" | ");
    const { day: startDay, month: startMonth, year: startYear } = getDateObject(startDate);
    const { day: endDay, month: endMonth, year: endYear } = getDateObject(endDate);
    let dateString = "";
    if (startMonth === endMonth && startDay === endDay && startYear === endYear) {
      dateString = `${startDay} ${startMonth} ${startYear}`;
    } else {
      dateString = `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
    if (isRegistered) {
      return (
        <div className="bg-[#4a4a4aB3] h-[164px] w-80 rounded-lg backdrop-blur-[2px] text-white p-4">
          <div className="text-2xl">{name}</div>
          <div className="flex gap-3 items-center">
            <div className="bg-primary-yellow w-[106px] h-5 rounded-2xl my-2 text-center text-black text-xs p-1 uppercase">
              {subject}
            </div>
            <span className="text-primary-yellow text-center">
              REGISTERED
            </span>
          </div>
          <div className="mt-3 space-y-3">
            <div>{topicsString}</div>
            <div className="text-xs flex items-center gap-3">
              <div className="w-4 text-center">
                <img
                  src="/Assets/Icons/calendar-small.svg"
                  alt="calendar"
                  className="align-middle"
                />
              </div>
              <div className="mt-[5px]">{dateString}</div>
            </div>
            {/*} <div className="text-xs flex items-center gap-3">
                  <div className="text-center w-4">
                    <img
                      src="/Assets/Icons/medal.svg"
                      alt="medal"
                      className="align-middle"
                    />
                  </div>
                  Win awards like Earphones, Watches, Novels
          </div>*/}
          </div>
        </div>
      );
    }
    return (
      <AppCheckbox
        key={id}
        className="mt-6 mr-2"
        id={id}
        value=""
        onChange={(e) => handleTournamentSelection(e, tournament)}
        disabled={isLoading}
        label={
          <div className="bg-[#4a4a4aB3] h-[164px] w-80 rounded-lg backdrop-blur-[2px] text-white p-4">
            <div className="text-2xl">{name}</div>
            <div className="flex gap-3 items-center">
              <div className="bg-primary-yellow w-[106px] h-5 rounded-2xl my-2 text-center text-black text-xs p-1 uppercase">
                {subject}
              </div>
              <span className="text-primary-yellow text-center">
                FREE TO PLAY!
              </span>
            </div>
            <div className="mt-3 space-y-3">
              <div>{topicsString}</div>
              <div className="text-xs flex items-center gap-3">
                <div className="w-4 text-center">
                  <img
                    src="/Assets/Icons/calendar-small.svg"
                    alt="calendar"
                    className="align-middle"
                  />
                </div>
                <div className="mt-[5px]">{dateString}</div>
              </div>
              {/*} <div className="text-xs flex items-center gap-3">
                  <div className="text-center w-4">
                    <img
                      src="/Assets/Icons/medal.svg"
                      alt="medal"
                      className="align-middle"
                    />
                  </div>
                  Win awards like Earphones, Watches, Novels
          </div>*/}
            </div>
          </div>
        }
      />
    );
  };

  const renderEmptyState = () => {
    if (isTournamentLoading) {
      return (
        <div className="flex gap-2 overflow-hidden mt-12 px-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-44 md:h-56 w-[296.5px] rounded-lg shrink-0"
            >
              <SkeletonLoader
                bgColor="#5050504d"
                pulseColor="#3a3a3aa4"
                className="rounded-lg"
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-3 bg-[#4A4A4AB3] backdrop-blur-[2px] px-3 py-6 rounded-lg text-sm mx-4 flex flex-col h-full max-h-[335px] md:max-h-[400px] md:text-base">
        <p className="text-primary-yellow">
          Aw, Snap! No LIVE tournaments for you yet :(
        </p>
        <p className="text-white">
          Don’t worry! New ones go LIVE every week. As soon as one opens for
          your class, we will block your slot, get in touch and walk you
          through the next steps :)
        </p>
      </div>
    );
  };

  const isUserFreeOrNew = useMemo(() => {
    return user && [FREE_USER_PLAN, NEW_USER_PLAN].includes(user?.currentSubscription?.plan);
  }, [user]);

  const renderHeading = () => {
    if (!activeSlide) {
      return <div className="text-lg text-white px-4 my-4 h-7"></div>;
    }
    const tournamentNumber = activeSlide?.tournamentNumber;
    const isPremiumTournament =
      user?.premierOpenTournaments?.includes(tournamentNumber);
    const isBaseOpenTournament =
      user?.superOpenTournaments?.includes(tournamentNumber);
    const isFreeOpenTournament =
      user?.freeOpenTournaments?.includes(tournamentNumber);
    const isRegistered = user?.registrations?.includes(activeSlide?.id);
    const isLocked =
      !isPremiumTournament &&
      !isBaseOpenTournament &&
      !isFreeOpenTournament &&
      !isRegistered && user?.tenantStatus !== "TENANT"
    return <div className="text-lg md:text-2xl text-white px-4 my-4">{isLocked ? 'Pay to Register' : 'You are Registered'}</div>;
  };

  return (
    <Layout>
      <div className="h-full w-full overflow-auto flex flex-col gap-2">
        <ArenaHeader
          goBack={handleBack}
          headerText="Select Tournament"
          nonArenaRoute={true}
          backIcon="Back.svg"
        />
        {tournaments.length || registeredUpcomingTournaments.length ? (
          <div className="space-y-[30px]">
            <div>
              {renderHeading()}
              <UpcomingTournamentCarousel
                tournaments={tournaments}
                setActiveSlide={setActiveSlide}
              />
            </div>

          </div>
        ) : (
          renderEmptyState()
        )}

        <div className="flex flex-col gap-2 mt-4">
          {user?.currentSubscription?.plan !== NEW_USER_PLAN && user?.tenantStatus === "OPEN" && !isDemo && (
            <div className="px-4 mb-4">
              <PlanInfo />
            </div>
          )}

          {/* <div className="px-4">
            <NextFreeTournament />
          </div> */}

          <div>
            {(user?.tenantStatus === "TENANT_UNPAID" || isDemo) && (
              <div className="px-4 overflow-hidden">
                <TenantUserPaymentBanner />
              </div>
            )}
          </div>
        </div>
      </div>
      {renderSuccessDialog()}
    </Layout>
  );
};

export default SelectTournamentPage;
