import { useEffect, useMemo, useState } from "react";
import { getDateObject, getDatefromFirebaseTimeStamp } from "../../../../Constants/Commons";
import { useAuth } from "../../../../providers/auth-provider";
import { twMerge } from "tailwind-merge";
import { getPlanDetails } from "../../../../services/wallet";
import AppButton from "../../../Common/AppButton";
import { useNavigate } from "react-router-dom";

const PlanDetails = () => {
    const navigate = useNavigate();
    const { user, isPremierPlan } = useAuth();
    const [planDetails, setPlanDetails] = useState(null);
    const { currentSubscription } = user;
    const currentPlanName = isPremierPlan ? "Premier" : "Super";
    const startDate = getDateObject(currentSubscription.startDate);
    const endDate = getDateObject(currentSubscription.endDate);
    const expiryDays = useMemo(() => {
      const eDate = getDatefromFirebaseTimeStamp(
        user?.currentSubscription?.endDate
      );
      
      // calculate number of days left for the subscription to expire
      const daysLeft = Math.floor((eDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft;
        // < 7 * 24 * 60 * 60 * 1000;
      
    }, [user]);

    useEffect(() => {
      const fetchPlan = async () => {
        const planToFetch = user.currentSubscription.plan;
        const data = await getPlanDetails(planToFetch);
        setPlanDetails(data);
      };
      fetchPlan();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const isExpiringIn30Days = expiryDays < 30;

    const { amount, discountedAmount } = planDetails || {};

    const renewPlan = () => {
        navigate(`/checkout?planId=${planDetails.id}`)
    };

    return (
      <>
        <div className="flex gap-2 items-center">
          <span className="text-xl font-medium">{currentPlanName}</span>
          <span
            className={twMerge(
              "text-[10px] h-fit w-fit bg-primary-yellow text-primary-gray-20 p-[2px] rounded-[2px]",
              isExpiringIn30Days && "bg-[#c32230] text-white"
            )}
          >
            {isExpiringIn30Days
              ? `Expiring Soon`
              : "Plan Active"}
          </span>
        </div>

        <div className="text-xs mt-1">
          Member since {startDate.day} {startDate.month} {startDate.year} |
          Vaild till {endDate.day} {endDate.month} {endDate.year}
        </div>
        {isExpiringIn30Days ? (
          <AppButton
            className="bg-[#FFCC75] rounded-lg mt-3"
            onClick={renewPlan}
          >
            <span className="md:text-xl">
              Renew -&nbsp; ₹{discountedAmount}
              {amount !== discountedAmount && (
                <span className="text-[10px] md:text-sm line-through opacity-50 ml-[2px] md:ml-[6px]">
                  ₹{amount}
                </span>
              )}
            </span>
          </AppButton>
        ) : (
          <></>
        )}
      </>
    );
};

export default PlanDetails;