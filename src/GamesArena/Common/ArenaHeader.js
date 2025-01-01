import React from "react";
import ThunderIcon from "../Common/Icons/ThunderIcon";
import ThunderIconCircular from "../Common/Icons/ThunderIconCircular";
import TrophyIcon from "./Icons/TrophyIcon";
import AnimatedNumber from "react-awesome-animated-number";
import BackButton from "../../Components/Common/BackButton";
import { ReactComponent as DollarSvg } from "../../assets/icons/dollar.svg";
import { ReactComponent as Thunder } from "../../assets/icons/Vector.svg";

const ArenaHeader = ({ goBack, headerText, pointsWon, gamesPlayed, nonArenaRoute = false, backIcon = "Back.svg", showDoorIcon = false, handleNavigateBack, showLogoutPopup, setShowLogoutPopup, showBack=true }) => {

  return (
    <div className={`text-white text-center font-bold w-screen text-2xl bg-[#3a3a3a] py-4 md:py-6 max-xs:py-2 relative max-xs:text-xl flex pr-3 ${showBack ? 'pl-[50px]' : 'pl-[20px]'} items-center justify-between md:text-4xl max-w-3xl`}>
      {showDoorIcon ? (
        <BackButton
          onClick={() => setShowLogoutPopup(true)}
          svgIcon={backIcon}
        />
      ) : (
        showBack && <BackButton onClick={goBack} svgIcon={backIcon} />
      )}{" "}
      <span
        className={`text-center md:ml-3 ${
          headerText === "Memory Cards"
            ? "text-xl md:text-xl"
            : showDoorIcon
            ? "text-sm md:text-xl"
            : "text-lg md:text-xl"
        }`}
      >
        {headerText}
      </span>
      {!nonArenaRoute && (
        <div className="flex justify-center gap-[10px] items-center">
          <div className="flex items-center gap-1">
            <div className="pb-0.25">
              <img
                src="/Assets/Icons/Matches.png"
                alt="trophy"
                className="w-6.3 h-4"
              />
            </div>
            <div className="text-lg font-bold ">
              <AnimatedNumber
                size={14}
                value={gamesPlayed}
                minDigits={1}
                duration={500}
              />
            </div>
          </div>
          <div className="flex items-center gap-0.75">
            <Thunder className="w-5 h-4" />
            <div className="text-lg font-bold">
              <AnimatedNumber
                size={14}
                value={pointsWon}
                minDigits={1}
                duration={500}
              />
            </div>
          </div>
        </div>
      )}
      {showDoorIcon && (
        <div
          className="flex items-center justify-center mt-0"
          onClick={handleNavigateBack}
        >
          <div className="flex items-center justify-center space-x-1">
            <div className="flex items-center justify-center">
              <img
                src="Assets/Icons/VectornavigatorGreen.svg"
                alt="navigator"
                className="w-6 h-6 md:w-9 aspect-square"
              />
            </div>
            <div className="text-sm md:text-2xl text-center mt-1">
              All-India
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default ArenaHeader;