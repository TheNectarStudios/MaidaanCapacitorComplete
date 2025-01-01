
import Loader from "../../PageComponents/GameLoader";
import PodiumBar from "./PodiumBar";

const Podium = ({ firstBarData, secondBarData, thirdBarData, loading, onLeaderboardClick, myPlayerData, hideLeaderboard = false }) => {
    return (
      <div className="flex flex-col gap-6 w-full p-4 bg-[#4e4e4e]">
        {hideLeaderboard ? <></> : <div className="flex items-center justify-between">
          <div className="text-lg md:text-2xl">Hall of Fame</div>
          <div
            className="text-sm md:text-lg underline text-primary-yellow"
            onClick={onLeaderboardClick}
          >
            View Leaderboard
          </div>
        </div>}
        <div className="flex justify-center items-end relative mt-[115px] md:mt-[150px]">
          {loading ? (
            <Loader message="Calculating ranks" />
          ) : (
            <>
              <PodiumBar
                data={thirdBarData}
                type="third"
                myPlayerData={myPlayerData}
              />
              <PodiumBar
                data={secondBarData}
                type="second"
                myPlayerData={myPlayerData}
              />
              <PodiumBar
                data={firstBarData}
                type="first"
                myPlayerData={myPlayerData}
              />
            </>
          )}
        </div>
      </div>
    );
};

export default Podium;