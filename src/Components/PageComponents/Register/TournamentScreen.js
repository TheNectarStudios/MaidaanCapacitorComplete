import { useEffect, useState } from "react";
import { getDatefromFirebaseTimeStamp, getDateStringForTournament } from "../../../Constants/Commons";
import AppButton from "../../Common/AppButton";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { LOBBY_ROUTE, TOURNAMENT_OPT_IN_ROUTE } from "../../../Constants/routes";
import Loader from "../Loader";
import { optInFirstOpenTournament } from "../../../services/child";
import { useAuth } from "../../../providers/auth-provider";
import mixpanel from 'mixpanel-browser';

const TournamentScreen = ({ firstOpenTournament = null }) => {
  const navigate = useNavigate();
  const { user, getUserDetails } = useAuth();
  // const [searchParams, ] = useSearchParams();
  // const tournamentId = searchParams.get("tournamentId");
  const [tournamentDetails, setTournamentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // check if route has tournment-opt-in string
    const isTournamentOptIn = window.location.pathname.includes(TOURNAMENT_OPT_IN_ROUTE);
    const fetchDetails = async () => {
      if (isTournamentOptIn) {
        const { firstOpenTournament: fOP } = await optInFirstOpenTournament();
        mixpanel.identify(user.id);
        mixpanel.track('OptedIn');
        getUserDetails();
        if (!fOP) {
          proceed();
        } else {
         setTournamentDetails(fOP);
         setLoading(false); 
        }
      } else {
        if (!firstOpenTournament) {
          proceed();
        } else {
          setTournamentDetails(firstOpenTournament);
          setLoading(false);
        }
        
      }
    };
    fetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceed = () => {
    const isRouteRegister = window.location.pathname.includes(
      '/register'
    );
    if (isRouteRegister) {
      localStorage.clear();
      navigate('/login', { replace: true });
    } else {
      navigate(LOBBY_ROUTE);
    }
  };

  const renderEmptyState = () => (
    <div className="flex h-full w-full items-center flex-col p-9">
      <div className="text-primary-yellow text-2xl font-black">
        Already Registered
      </div>
      <div className="bg-[#4A4A4AB3] backdrop-blur-[2px] px-3 py-6 rounded-lg text-sm md:text-base mt-[20%]">
        <p className="text-primary-yellow">
          You are already registered in our open tournaments, go ahead and play
          on maidaan
        </p>
      </div>
      <div className="flex flex-1"></div>
      <div>
        <AppButton className="w-[216px] p-4" onClick={proceed}>
          Got it
        </AppButton>
      </div>
    </div>
  );

  const renderDetails = () => {
    const {
      name,
      topics = [],
      newLobbyTournamentBanner,
      isDarkBanner,
      startDate,
      endDate,
    } = tournamentDetails ?? firstOpenTournament ?? {};

    let dateString = '';
            const tournamnetstartDate = getDatefromFirebaseTimeStamp(startDate);
            const tournamnetendDate = getDatefromFirebaseTimeStamp(endDate);
            
            if(startDate && endDate){
              dateString = getDateStringForTournament(tournamnetstartDate, tournamnetendDate);
            }

    const topicString = topics.join(" | ");
    return (
      <div className="flex h-full w-full items-center flex-col p-9">
        <div className="text-primary-yellow text-2xl font-black">
          Your First Free Tournament
        </div>
        <div
          className="h-[200px] w-full bg-cover font-medium rounded-lg flex flex-col justify-center px-5 mt-[20%]"
          style={{ backgroundImage: `url(${newLobbyTournamentBanner})` }}
        >
           <div className="col-span-4 mt-4 w-[60%]">
                  <div className={`text-lg leading-[1] ${ !isDarkBanner && "text-primary-gray-10" }`} >
                    {name}
                    </div>
                  <div
                    className={twMerge(
                      "text-[10px]",
                      !isDarkBanner && "text-primary-gray-10 mt-1"
                    )}
                  >
                    {topicString}
                  </div>
                  <div
                    className={twMerge(
                      "mt-2 text-xs",
                      !isDarkBanner && "text-primary-gray-10"
                    )}
                  >
                    {dateString}
                  </div>
            </div>
        </div>
        <div className="bg-disabled-gray rounded-lg w-full mt-2">
          <div className="w-full relative h-6 bg-primary-gradient rounded-t-lg">
            <img
              src="/Assets/Icons/trophy.svg"
              alt="trophy"
              className="w-[44px] absolute top-[-34px] left-1/2 transform -translate-x-1/2"
            />
          </div>

          <div className="text-primary-yellow text-xl w-full text-center py-4 px-5">
            Free Trial
            <br />
            <ul className="list-disc pl-6 text-white text-base">
            <li>Play students across India</li>
            <li>Win & your award is on us</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-1"></div>
        <div>
          <AppButton className="w-[216px] p-4" onClick={proceed}>
            I'm Ready
          </AppButton>
        </div>
      </div>
    );
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <>
          {tournamentDetails || firstOpenTournament
            ? renderDetails()
            : renderEmptyState()}
        </>
      )}
    </>
  );
};

export default TournamentScreen;