
import { ReactComponent as BooksIcon } from "../../../../assets/icons/books.svg";
import { ReactComponent as VersusIcon } from "../../../../assets/icons/versus.svg";
import { ReactComponent as AiBrainIcon } from "../../../../assets/icons/ai-brain.svg";
import { ReactComponent as MedalIcon } from "../../../../assets/icons/medal.svg";
import Loader from "../../Loader";
import SkeletonLoader from "../../../Common/SkeletonLoader";
import { max } from "lodash";

const CareerStatsCard = ({ bgColor, icon, title, subtitle }) => {
    if(subtitle === "Competitors" && title === null){
      return (
        <div className="flex justify-center items-center h-[82px] rounded-lg">
            <SkeletonLoader bgColor="#089B8A" pulseColor="#ffffffa4" />
        </div>
    );
    }
    return (  
      <div className="px-4 py-3 h-[82px] rounded-lg" style={{ backgroundColor: bgColor }}>
        <div className="flex gap-[18px]">
          {icon}
          <div>
            <div className="text-2xl font-semibold">{title}</div>
            <div className="text-xs">{subtitle}</div>
          </div>
        </div>
      </div>
    );
};

const CareerStats = ({ data }) => {
  const {
    totalTopicsCovered,
    numberOfAttempts,
    meritFinishes,
    maxScore,
    uniqueCompetitors,
  } = data ?? {};

  let medalCardtitle = "";
  let medalCardSubTitle = "";

  if(!meritFinishes){
    if(!maxScore){
      medalCardtitle = "-";
      medalCardSubTitle = "Merit Finishes";
    }
    else {
      medalCardtitle = maxScore;
      medalCardSubTitle = "Max Score";
    }
  }
  else {
    medalCardtitle = meritFinishes;
    medalCardSubTitle = "Merit Finishes";
  }

    return (
      <div>
        <div className="font-medium mb-4">Career Stats</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <CareerStatsCard
              bgColor="#FF5050"
              icon={<BooksIcon className="h-10 w-10" />}
              title={totalTopicsCovered}
              subtitle="Topics"
            />
            <CareerStatsCard
              bgColor="#089B8A"
              icon={<VersusIcon className="h-10 w-10" />}
              title={uniqueCompetitors}
              subtitle="Competitors"
            />
          </div>
          <div className="space-y-4">
            <CareerStatsCard
              bgColor="#0E893E"
              icon={<AiBrainIcon className="h-10 w-10" />}
              title={numberOfAttempts}
              subtitle="Questions"
            />
            <CareerStatsCard
              bgColor="#FF725E"
              icon={<MedalIcon className="h-10 w-10" />}
              title={medalCardtitle}
              subtitle={medalCardSubTitle}
            />
          </div>
        </div>
      </div>
    );
};

export default CareerStats;