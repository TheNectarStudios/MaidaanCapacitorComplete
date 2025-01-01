import { useEffect, useState } from "react";
import AppButton from "../../Common/AppButton";
import { getFreeUserTournament, getNextOpenRegisteredTournament } from "../../../services/child";
import Loader from "../Loader";
import SkeletonLoader from "../../Common/SkeletonLoader";
import { getDateStringForTournament, getDatefromFirebaseTimeStamp, getTournamentDaysToGo } from "../../../Constants/Commons";


const NextFreeTournament = () => {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreeTournament = async () => {
      const data = await getNextOpenRegisteredTournament();
      
      setTournament(data);
      setLoading(false);
    };

    fetchFreeTournament();
  }, []);

  const renderLoader = () => {
    return (
      <div className="w-full h-full rounded-lg p-4 bg-[#CCf9001f] border border-solid border-[#FFFFFF4D]">
        <div className="font-medium text-lg md:text-2xl mb-5 text-white">
          <div className="h-4 w-1/2 mb-1">
            <SkeletonLoader bgColor="#ffffff4d" pulseColor="#ffffffa4" />
          </div>
          <div className="h-3 w-1/4">
            <SkeletonLoader bgColor="#ffffff4d" pulseColor="#ffffffa4" />
          </div>
        </div>
        <div className="grid grid-cols-5 text-[10px] gap-4 text-center text-white">
          <div className="col-span-2 flex items-center gap-2">
            <div className="h-4 w-1/2">
              <SkeletonLoader bgColor="#ffffff4d" pulseColor="#ffffffa4" />
            </div>
          </div>
          <div className="col-span-3 grid place-items-end">
            <div className="h-8 w-3/4">
              <SkeletonLoader bgColor="#ffffff4d" pulseColor="#ffffffa4" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getDateString = () => {
    let dateString = "";
    const startDate = getDatefromFirebaseTimeStamp(tournament?.startDate);
    const endDate = getDatefromFirebaseTimeStamp(tournament?.endDate);

    if (startDate && endDate) {
      dateString = getDateStringForTournament(startDate, endDate);
    }
    return dateString;
  }

  const getDaysToGo = () => {
    const daysToGo = getTournamentDaysToGo(getDatefromFirebaseTimeStamp(tournament?.startDate));
    return daysToGo;
  }

  if (!loading && !tournament) {
    return <></>;
  }

    return (
      <>
        <div className="text-lg md:text-2xl text-white mb-2">
          {tournament?.tournamentTierforUser === "NEW"
            ? "Your First Tournament"
            : "Next Unlocked Tournament"}
        </div>
        {loading ? (
          renderLoader()
        ) : (
          <div className="w-full h-full rounded-lg p-4 bg-[#CCf9001a] border border-solid border-[#FFFFFF4D]">
            <div className="font-medium text-lg md:text-2xl mb-5 text-white">
              {tournament?.name}
              <div className="text-[#ffffffa4] text-[10px] md:text-lg leading-[1]">
                {getDateString()}
              </div>
            </div>
            <div className="grid grid-cols-5 text-[10px] md:text-lg gap-4 text-center text-white">
              <div className="col-span-2 flex items-center gap-2">
                <span className="font-bold text-2xl md:text-4xl">{getDaysToGo()}</span>{" "}
                {getDaysToGo() === 1 ? "day to go!" : "days to go!"}
              </div>
              <div className="col-span-3 grid place-items-end">
                {!["NEW", "PREMIER"].includes(tournament?.tournamentTierforUser) && (
                  <AppButton className="rounded-[6px] w-full text-[14px]">
                    Unlock Awards - ₹100
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
};

export default NextFreeTournament;