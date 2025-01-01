import { Swiper, SwiperSlide } from "swiper/react";
import { twMerge } from "tailwind-merge";
import AppButton from "../../Common/AppButton";
import { ReactComponent as LockSvg } from '../../../assets/icons/lock.svg';
import { ReactComponent as UnlockSvg } from '../../../assets/icons/lock_open_right.svg';
import { useAuth } from "../../../providers/auth-provider";
import { PREMIER_1TOURNAMENT_PLAN, SUPER_1TOURNAMENT_PLAN, getDateStringForTournament, getDatefromFirebaseTimeStamp, getTournamentDaysToGo } from "../../../Constants/Commons";
import { useNavigate, useSearchParams } from "react-router-dom";
import mixpanel from 'mixpanel-browser';

const UpcomingTournamentCarousel = ({ tournaments, setActiveSlide }) => {
  const navigate = useNavigate();
  const [searchParams, _] = useSearchParams();
  const isDemo = searchParams.get("d") === "S";
  const { user } = useAuth();
  const goToCheckout = (id, tId) => {
    mixpanel.identify(user.id);
    mixpanel.track("UpcomingTournamentScreen_Pay", {
      Plan: id,
      tournamentId: tId,
    });
    let url = `/checkout?planId=${id}&tId=${tId}`;
    if(isDemo) {
      url += "&d=S";
    }
    navigate(url);
    //navigate(`/checkout?planId=${id}&tId=${tId}`);
  };

  const renderCTA = (
    isPremiumTournament,
    isBaseOpenTournament,
    isFreeOpenTournament,
    isFirstTournament,
    isDarkBanner,
    startDate,
    tId,
    userTenantStatus,
  ) => {
    if(isDemo) {
      return (
        <AppButton
          className={twMerge(
            "h-6 rounded-[6px] text-[10px] px-2",
            !isDarkBanner && "bg-primary-gray-20 text-primary-yellow"
          )}
          onClick={() => goToCheckout(`TOURNAMENTS_1`, tId)}
        >
          Register - ₹149
        </AppButton>
      );
    }
    if (isPremiumTournament || isFirstTournament || userTenantStatus !== "OPEN") {
      const numberOfDaysToGo = getTournamentDaysToGo(startDate);
      return (
        <>
          <span
            className={twMerge(
              "font-bold text-2xl",
              isDarkBanner ? "text-white" : "text-primary-gray-20"
            )}
          >
            {numberOfDaysToGo}
          </span>{" "}
          {numberOfDaysToGo === 1 ? "day to go!" : "days to go!"}
        </>
      );
    }
    if (isBaseOpenTournament || isFreeOpenTournament ) {
      return (
        <AppButton
          className={twMerge(
            "h-6 rounded-[6px] text-[10px] px-2",
            !isDarkBanner && "bg-primary-gray-20 text-primary-yellow"
          )}
          onClick={() => goToCheckout(PREMIER_1TOURNAMENT_PLAN, tId)}
        >
          Unlock Awards
        </AppButton>
      );
    }
    return (
      <AppButton
        className={twMerge(
          "h-6 rounded-[6px] text-[10px] px-2",
          !isDarkBanner && "bg-primary-gray-20 text-primary-yellow"
        )}
        onClick={() => goToCheckout(SUPER_1TOURNAMENT_PLAN, tId)}
      >
        Register - ₹30
      </AppButton>
    );
  };

    return (
      <Swiper
        spaceBetween={0}
        slidesPerView={1.2}
        className="h-44 md:h-56"
        scrollbar={{ draggable: true, horizontalClass: "!bg-[#3a3a3a]" }}
        breakpoints={{
          768: {
            slidesPerView: 1.7, // Show 2 slides on screens wider than or equal to 768px
          },
        }}
        onSlideChange={(swiper) => {
          setActiveSlide(tournaments[swiper.realIndex]);
        }}
      >
        {tournaments.map((banner, index) => {
          const {
            newLobbyTournamentBanner,
            isDarkBanner,
            name,
            topics,
            tournamentNumber,
            id,
          } = banner;
          const topicString = topics.join(" | ");
          const isPremiumTournament =
            user?.premierOpenTournaments?.includes(tournamentNumber);
          const isBaseOpenTournament =
            user?.superOpenTournaments?.includes(tournamentNumber);
          const isFreeOpenTournament =
            user?.freeOpenTournaments?.includes(tournamentNumber);
          const isRegistered = user?.registrations?.includes(id);
          const isFirstTournament =
            user?.firstOpenTournament === tournamentNumber;
          let isLocked = false;
          if (user?.tenantStatus === "TENANT_UNPAID") {
            isLocked = true;
          } else if (user?.tenantStatus === "TENANT") {
            isLocked = false;
          } else if (user?.tenantStatus === "OPEN") {
            isLocked =
              !isPremiumTournament &&
              !isBaseOpenTournament &&
              !isFreeOpenTournament &&
              !isRegistered;
          }

          let dateString = "";
          const startDate = getDatefromFirebaseTimeStamp(banner.startDate);
          const endDate = getDatefromFirebaseTimeStamp(banner.endDate);

          if (startDate && endDate) {
            dateString = getDateStringForTournament(startDate, endDate);
          }
          return (
            <SwiperSlide key={index} className="pl-4">
              <div
                className={twMerge(
                  "rounded-lg bg-cover bg-center h-40 md:h-52  w-full px-4 grid grid-cols-7 items-center relative overflow-hidden",
                  isDarkBanner ? "text-white" : "text-black"
                )}
                style={{
                  backgroundImage: `url(${newLobbyTournamentBanner})`,
                }}
              >
                <div
                  className={twMerge(
                    "absolute top-0 left-0 h-6 w-9 md:h-8 md:w-11 rounded-br-lg grid place-items-center shadow-[0_4px_4px_rgba(0,0,0,0.25)]",
                    isLocked ? "bg-[#c32230]" : "bg-primary-yellow"
                  )}
                >
                  {isLocked ? (
                    <LockSvg className="h-[14px] w-[14px] md:w-5 md:h-5" />
                  ) : (
                    <UnlockSvg className="h-[14px] w-[14px] md:w-5 md:h-5" />
                  )}
                </div>
                <div className="col-span-4 mt-4 flex flex-col h-full justify-between pb-5 md:pt-10 pt-7">
                  <div>
                    <div className="text-lg md:text-xl leading-[1]">{name}</div>
                    <div
                      className={twMerge(
                        "text-[10px] md:text-sm",
                        !isDarkBanner && "text-primary-gray-10 mt-1"
                      )}
                    >
                      {topicString}
                    </div>
                    <div
                      className={twMerge(
                        "mt-2 text-xs md:text-base",
                        !isDarkBanner && "text-primary-gray-10"
                      )}
                    >
                      {dateString}
                    </div>
                  </div>
                  <div>
                    {renderCTA(
                      isPremiumTournament,
                      isBaseOpenTournament,
                      isFreeOpenTournament,
                      isFirstTournament,
                      isDarkBanner,
                      startDate,
                      id,
                      user?.tenantStatus
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    );
};

export default UpcomingTournamentCarousel;