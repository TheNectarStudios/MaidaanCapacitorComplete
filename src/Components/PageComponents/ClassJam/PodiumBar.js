import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import FirstPlaceProfileIcon from "../../../GamesArena/Common/Icons/FirstPlaceProfileIcon";
import SecondPlaceProfileIcon from "../../../GamesArena/Common/Icons/SecondPlaceProfileIcon";
import ThirdPlaceProfileIcon from "../../../GamesArena/Common/Icons/ThirdPlaceProfileIcon";
import { Emoji, EmojiStyle } from 'emoji-picker-react';

const heightClassMap = {
  first: "80px",
  second: "55px",
  third: "30px",
};

const ProfileIconMap = {
  first: <FirstPlaceProfileIcon />,
  second: <SecondPlaceProfileIcon />,
  third: <ThirdPlaceProfileIcon />,
};

const PodiumBar = ({ type, data }) => {
  let bgColorClass = "";
  let transition = { duration: 0.3 };
  return (
    <div className="text-center relative">
      <motion.div
        layout
        initial={{ scaleY: 0, originY: "bottom" }}
        animate={{ scaleY: 1, originY: "bottom" }}
        transition={transition}
        className={twMerge(
          "box-shadow-3d max-xs:w-[70px] max-xs:w-[70px] w-[75px] bg-[#799400]",
          data?.isMyPodium && "bg-[#ccf900] box-shadow-3d-you"
        )}
        style={{ height: heightClassMap[type] }}
      >
        <div
          className={twMerge(
            "text-white absolute left-[50%] translate-x-[calc(-50%)] top-[-100px]"
          )}
        >
          {(!data.profileEmoji) ? (
            <div className='flex items-center justify-center w-[70px] mb-1'>
              <img
                src='/Assets/Icons/Nimbu.svg'
                alt="icon"
                style={{ width: '32px', height: '32px' }}
              />
            </div>
          ) :
            (<div className='flex items-center justify-center w-[70px] mb-1'>
              <Emoji unified={data?.profileEmoji} size="32" />
            </div>)}
          <div className={twMerge(!data?.isMyPodium ? "opacity-50" : "")}>
            <div className="text-xl md:text-2xl font-bold">
                {data?.totalVotes}
              </div>
            <div className="text-sm md:text-base">{data?.firstName}</div>
          </div>
        </div>
        {/* <div className="text-black text-xs">Gained Today</div> */}
      </motion.div>
      {/* <div className="grid place-items-center">
        <div
          className={twMerge(
            "mt-4 rounded text-black py-[2px] px-2 text-xs w-fit md:text-base",
            data?.isMyPodium ? "bg-white" : "bg-[#afafaf]"
          )}
        >
          {data?.subheader}
        </div>
      </div> */}
    </div>
  );
};

export default PodiumBar;
