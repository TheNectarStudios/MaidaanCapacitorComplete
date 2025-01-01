import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import FirstPlaceProfileIcon from "../../../GamesArena/Common/Icons/FirstPlaceProfileIcon";
import SecondPlaceProfileIcon from "../../../GamesArena/Common/Icons/SecondPlaceProfileIcon";
import ThirdPlaceProfileIcon from "../../../GamesArena/Common/Icons/ThirdPlaceProfileIcon";
import NonPodiumProfileIcon from "../../../GamesArena/Common/Icons/NonPodiumProfileIcon";

// data type
/**
 * {
  Rank: Number, // The player's rank
  pointsWon: Number, // The number of points the player has won
  firstName: String, // The player's first name
  gamesPlayed: Number, // The number of games the player has played
}
 */

const PodiumBar = ({ type, data, myPlayerData }) => {
    if (!data && !myPlayerData) return null;
    let bgColorClass = "";
    let transition = {};
    let heightClass = "";
    let subheader = "";
    let profileIcon = <></>;
    let profileContainerClass = "top-[-136px]";
    const isMyPodium = myPlayerData && data && data.Rank === myPlayerData?.Rank;
    if (isMyPodium || data?.gamesPlayed === 0) {
      bgColorClass = "bg-[#ccf900] box-shadow-3d-you";
      subheader = "You";
    }
    if (type === "first") {
      transition = { duration: 0.3, delay: 0.4 };
      heightClass = "h-[100px]";
      profileIcon = <FirstPlaceProfileIcon />;
      if (!isMyPodium) {
        subheader = "Leader";
      }
    } else if (type === "second") {
      transition = { duration: 0.3, delay: 0.2 };
      heightClass = "h-[60px]";

      if (!isMyPodium) {
        if (myPlayerData?.Rank === 1 || myPlayerData?.Rank === 3) {
          subheader = "2nd";
          profileIcon = <SecondPlaceProfileIcon />;
        } else {
          subheader = "Next Target";
          profileIcon = (
            <img src="/Assets/Icons/nextTarget.svg" alt="next-target"></img>
          );
        }
      } else {
        subheader = "2nd";
        profileIcon = <SecondPlaceProfileIcon />;
      }
    } else {
      transition = { duration: 0.3 };
      heightClass = "h-[40px]";
      profileContainerClass = "top-[-136px]";
      if (
        (isMyPodium && myPlayerData?.Rank === 3) ||
        myPlayerData?.Rank === 2 ||
        myPlayerData?.Rank === 1
      ) {
        subheader = "3rd";
        profileIcon = <ThirdPlaceProfileIcon />;
      } else {
        profileIcon = <NonPodiumProfileIcon />;
      }
    }

    return (
      <div className="text-center relative">
        <motion.div
          layout
          initial={{ scaleY: 0, originY: "bottom" }}
          animate={{ scaleY: 1, originY: "bottom" }}
          transition={transition}
          className={twMerge(
            "box-shadow-3d max-xs:w-[105px] w-[115px] bg-[#799400]",
            heightClass,
            bgColorClass
          )}
        >
          <div
            className={twMerge(
              "text-white absolute left-[50%] translate-x-[calc(-50%+8px)]",
              profileContainerClass
            )}
          >
            {profileIcon}
            <div className={twMerge(!isMyPodium ? "opacity-50" : "")}>
              <div className="text-xl md:text-2xl font-bold">
                {data?.pointsWon}
              </div>
              <div className="text-sm md:text-base">{data?.firstName}</div>
            </div>
          </div>
          {/* <div className="text-black text-xs">Gained Today</div> */}
        </motion.div>
        <div className="grid place-items-center">
          <div
            className={twMerge(
              "mt-4 rounded text-black py-[2px] px-2 text-xs w-fit md:text-base",
              isMyPodium ? "bg-white" : "bg-[#afafaf]"
            )}
          >
            {subheader}
          </div>
        </div>
      </div>
    );
};

export default PodiumBar;