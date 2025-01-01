import { motion } from 'framer-motion';
import { ReactComponent as TrophyWhiteIcon } from '../../../../assets/icons/trophy-white.svg';

const PlanProgress = ({ data }) => {
  const { totalTournaments, totaltournamentsCompleted } = data ?? {};
  const tournamentCompletedPercentage = Math.round((totaltournamentsCompleted / totalTournaments) * 100);
    return (
      <div>
        <div className="font-medium">Plan Progress</div>
        <div className="mt-8 mb-2 flex gap-3 items-center">
          <div>
            <TrophyWhiteIcon />
          </div>
          <div>
            <div>
              <span className="font-semibold text-2xl mr-1">
                {totaltournamentsCompleted}
              </span>
              <span className="text-xs">out of {totalTournaments}</span>
            </div>
            <div className="text-xs -mt-[6px]">tournaments completed!</div>
          </div>
        </div>
        <div className="h-3 rounded-2xl bg-[#2a2a2a] w-full relative overflow-hidden">
          <motion.div
            className="absolute bg-primary-yellow h-full rounded-2xl"
            initial={{ width: 0 }}
            animate={{ width: `${tournamentCompletedPercentage}%` }}
          ></motion.div>
        </div>
      </div>
    );
};

export default PlanProgress;