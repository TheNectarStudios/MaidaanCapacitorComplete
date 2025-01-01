import AppButton from "../../Common/AppButton";
import { ReactComponent as TrophyOutlineSvg } from '../../../assets/icons/Trophy.svg';
import { ReactComponent as CurrencyRupeeSvg } from '../../../assets/icons/currency_rupee.svg';
import { ReactComponent as EditorChoiceSvg } from '../../../assets/icons/certificate.svg';
import { ReactComponent as GiftSvg } from '../../../assets/icons/Award.svg';
import { useAuth } from "../../../providers/auth-provider";
import { useEffect, useMemo, useState } from "react";
import { FREE_USER_PLAN, NEW_USER_PLAN, PREMIER_12MONTHS_PLAN, PREMIER_3MONTHS_PLAN, SUPER_12MONTHS_PLAN, SUPER_3MONTHS_PLAN, getDatefromFirebaseTimeStamp } from "../../../Constants/Commons";
import { getPlanDetails } from "../../../services/wallet";
import SkeletonLoader from "../../Common/SkeletonLoader";
import { useNavigate } from "react-router-dom";


const PlanInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const isFreePlan = [FREE_USER_PLAN, NEW_USER_PLAN].includes(user?.currentSubscription?.plan);
  const isExpiringIn30Days = useMemo(() => {
    const eDate = getDatefromFirebaseTimeStamp(user?.currentSubscription?.endDate);
    return eDate && eDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  }, [user]);
  const isPremierPlan = [PREMIER_12MONTHS_PLAN, PREMIER_3MONTHS_PLAN].includes(user?.currentSubscription?.plan);
  const isUpcomingSubscription = !user?.upcomingSubscription;

  useEffect(() => {
    const fetchPlan = async () => {
      const planToFetch = isPremierPlan
        ? PREMIER_12MONTHS_PLAN
        : SUPER_12MONTHS_PLAN;
      const data = await getPlanDetails(planToFetch);
      setPlanDetails(data);
      setLoading(false);
    };
    fetchPlan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const goToCheckout = () => {
    navigate(`/checkout?planId=${planDetails.id}`);
  };

  const renderLoader = () => {
    return (
      <div className="w-full h-full rounded-lg p-4 bg-[#CCf9001a] border border-solid border-[#FFFFFF4D]">
        <div className="font-medium text-lg mb-5 text-white">
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

  if (loading) {
    return renderLoader();
  }

  if (!loading && !isFreePlan && !isExpiringIn30Days) {
    return <></>;
  }

    return (
      <div className="w-full h-full rounded-lg px-4 md:px-6 bg-[#FFCC751a] border border-solid border-[#FFFFFF4D] overflow-hidden">
        {!isFreePlan && isExpiringIn30Days && !isUpcomingSubscription ? (
          <div className="bg-[#C32230] rounded-b-lg px-3 py-1 text-xs text-white w-fit">
            Expiring Soon!
          </div>
        ) : (
          <></>
        )}
        <div className="py-4 md:py-8">
          <div className="font-medium text-lg md:text-2xl mb-5 md:mb-10 text-white">
            {isPremierPlan
              ? "Unlock Premier | Full Year @ ₹2999/-"
              : "Unlock Super | Full Year @ ₹499/-"}
          </div>
          <div className="grid grid-cols-5 text-[10px] md:text-base gap-4 text-center text-white">
            <div className="grid place-items-center gap-2">
              <TrophyOutlineSvg className="md:w-8 md:h-8" />
              {planDetails?.tournamentsPerPlan} Tournaments
            </div>
            <div className="grid place-items-center gap-2">
              <CurrencyRupeeSvg className="md:w-8 md:h-8" />
              {isPremierPlan ? (
                <>
                  <div className="flex flex-col">
                    <div>
                      30% <br className="md:hidden" />
                      Off{" "}
                    </div>
                    {/* <div>Off</div> */}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col">
                    <div>
                      40% <br className="md:hidden" />
                      Off{" "}
                    </div>
                    {/* <div>Off</div> */}
                  </div>
                </>
              )}
            </div>

            <div className="grid place-items-center gap-2">
              {isPremierPlan ? (
                <>
                  <GiftSvg className="md:w-8 md:h-8" />
                  Awards
                </>
              ) : (
                <>
                  <EditorChoiceSvg className="md:w-8 md:h-8" />
                  Merit Certificates
                </>
              )}
            </div>
            <div className="col-span-2 grid place-items-end">
              <AppButton
                className="bg-[#FFCC75] rounded-[6px] w-full text-sm md:text-lg"
                onClick={goToCheckout}
              >
                <span className="line-through text-[10px] md:text-sm">
                  ₹{planDetails?.amount}/-
                </span>
                ₹{planDetails?.discountedAmount}/-
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    );
};

export default PlanInfo;