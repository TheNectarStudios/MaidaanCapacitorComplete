import { useNavigate } from "react-router-dom";
import { extractMonthlyEarnings } from "../../../Constants/Commons";
import { MEASURE } from "../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { useApp } from "../../../providers/app-provider";
import { useAuth } from "../../../providers/auth-provider";
import AppButton from "../../Common/AppButton";

const WalletCard = ({ tournamentData, hideWallet, leaderboardData,rank }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { wallet } = useApp();

     const handleCheckRewards = () => {
       MEASURE(INSTRUMENTATION_TYPES.VIEW_REWARDS, user.id, {});
       navigate("/wallet");
     };


    const renderWallet = () => {
         if (!wallet || !leaderboardData || hideWallet) return <></>;
         const currentMonthFirstThreeLetters = new Date().toLocaleString(
           "default",
           {
             month: "short",
           }
         );
         let istournamentEnded = tournamentData.isTournamentEnded;
         const { id, isSubscriptionActive } = user;
        const userPointsForToday = leaderboardData.find((d) => d.id === id)?.pointsWon === 0 ? 0 : leaderboardData.find((d) => d.id === id)?.coins ?? 0;
         const { monthlyEarnings, rewardPoints } = wallet;
         const earnings = extractMonthlyEarnings(monthlyEarnings);
         const currentMonthsTotalPoints = earnings + userPointsForToday;
         let totalVaultPoints =
           parseInt(currentMonthsTotalPoints) + parseInt(rewardPoints);
         if (isSubscriptionActive) {
           totalVaultPoints =
             parseInt(rewardPoints) + parseInt(userPointsForToday);
         }
         let endGamePoints;
         if (isSubscriptionActive) {
           endGamePoints = rewardPoints;
         } else {
           endGamePoints = parseInt(earnings) + parseInt(rewardPoints);
         }
         
         return istournamentEnded ? (
           <div className="mx-2 mt-4 md:w-full md:flex md:flex-col md:items-center">
             <div className="flex gap-2 items-center mb-2">
               <span className="my-0 mt-1">
                 <b className="uppercase">Your Winnings</b>&nbsp;
               </span>
             </div>
             <div className="p-2.5 grid grid-cols-2 bg-primary-gradient text-white rounded-lg max-w-[578px] w-full justify-around">
               <div className="space-y-2 ">
                 <div className="uppercase text-primary-yellow text-xs text-center">
                   This Tournament
                 </div>
                 <div className="flex justify-center items-center text-xl">
                   <img
                     src="/Assets/Icons/trophy.svg"
                     alt="trophy"
                     className="mr-2 h-7"
                   />
                   {userPointsForToday}
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="uppercase text-primary-yellow text-xs text-center">
                   Vault Balance
                 </div>
                 <div className="flex justify-center items-center text-xl">
                   <img
                     src="/Assets/Icons/vault.svg"
                     alt="trophy"
                     className="mr-2 h-8"
                   />
                   {endGamePoints}
                 </div>
               </div>
             </div>
             <div className="flex gap-2 items-center justify-between mt-4">
               <span className="text-sm uppercase" style={{ fontSize: 12 }}>
                 Use vault balance for prizes
               </span>
               <AppButton onClick={handleCheckRewards}>Check Rewards</AppButton>
             </div>
           </div>
         ) : (
           <div className="mx-2 mt-4 md:w-full md:flex md:flex-col md:items-center">
             <div className="flex gap-2 items-center mb-2">
               <span className="my-0 mt-1">
                 <b className="uppercase">Projected Winnings</b>&nbsp;
                 <span className="text-[10px]">(Based on current rank)</span>
               </span>
             </div>
             <div className="p-2.5 grid grid-cols-1 bg-primary-gradient text-white rounded-lg max-w-[578px] w-full">
             <div className="space-y-2">
                 <div className="uppercase text-primary-yellow text-xs text-center">
                   Your Rank
                 </div>
                 <div className="flex justify-center items-center text-xl">
                   <img
                     src="/Assets/Icons/trophy.svg"
                     alt="trophy"
                     className="mr-2 h-7"
                   />
                   <div className="pt-1">
                   {rank?rank:"--"}
                   </div>
                 </div>
               </div>
               
             </div>
             <div className="flex gap-2 items-center justify-between mt-4">
               <span className="text-sm uppercase" style={{ fontSize: 12 }}>
                 Use vault balance for prizes
               </span>
               <AppButton
                 // className=" bg-primary-yellow outline-none border border-solid border-primary-yellow rounded-lg px-[6px] py-[5px] !text-xs w-[140px] text-[#3a3a3a]"
                 onClick={handleCheckRewards}
               >
                 Check Rewards
               </AppButton>
             </div>
           </div>
         );

    };

    return renderWallet();

    };

export default WalletCard;
