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
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getTenantDetails } from "../../../services/tenant";
import { db } from "../../../firebase-config";
import { Dialog } from "@mui/material";
import Lottie from "lottie-react";
import cofettiAnimation from "../../../assets/animations/confetti.json";
import { useSearchParams } from "react-router-dom";


const TenantUserPaymentBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planDetails, setPlanDetails] = useState(null);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [schoolAbreviatedName, setSchoolAbreviatedName] = useState("");
  const [userGradeStatus, setUserGradeStatus] = useState("");
  const [interestedInSChoolAnnualPack, setInterestedInSChoolAnnualPack] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [schoolDiscountedAmount, setSchoolDiscountedAmount] = useState(0);
  const [schoolDiscountPercentage, setSchoolDiscountPercentage] = useState(0);
  const isDemo = searchParams.get("d") === "S";
  const [tenantDetails, setTenanDetails] = useState(null);

  const isPremierPlan = [PREMIER_12MONTHS_PLAN, PREMIER_3MONTHS_PLAN].includes(user?.currentSubscription?.plan);


  useEffect(() => {
    const fetchTenantDetails = async () => {
     
    const tenantId = isDemo ? `pitchDemo` : user?.tenantIds?.[0];
      const tenantDetails = await getTenantDetails(tenantId);
      setTenanDetails(tenantDetails);
    };
    fetchTenantDetails();
  }, [user]);

  useEffect(() => {
    const fetchPlan = async () => {
      const planToFetch = tenantDetails?.currentActivePlan;
      if(!planToFetch) {
        return;
      }
      const data = await getPlanDetails(planToFetch);
      setPlanDetails(data);
      setLoading(false);
      setInterestedInSChoolAnnualPack(!!user?.intesteredInSchoolAnnualPack);
    };
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantDetails]);

  useEffect(() => {
    const getSchoolAbreviatedName = async () => {
      if(!tenantDetails) {
        return;
      }
      const { abbreviatedName, status, discountedAmount, discountPercentage } = tenantDetails;
      setSchoolAbreviatedName(abbreviatedName);
      setSchoolDiscountedAmount(discountedAmount[tenantDetails?.currentActivePlan]);
      setSchoolDiscountPercentage(discountPercentage[tenantDetails?.currentActivePlan]);
      setUserGradeStatus(status?.[user?.grade]);
    };
    getSchoolAbreviatedName();
  }, [user, tenantDetails]);


  const goToCheckout = () => {
    let url = `/checkout?planId=${tenantDetails?.currentActivePlan}`;
    if (isDemo) {
      url += "&d=S";
    }
    navigate(url);
    // navigate(`/checkout?planId=${tenantDetails?.currentActivePlan}`);
  };

  const handleInterestedClick = async () => {
    setInterestedInSChoolAnnualPack(true);
    setShowSuccessDialog(true);
    await updateDoc(doc(db, "children", user.id), {
      intesteredInSchoolAnnualPack: true,
    });

  }

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


  const renderCoinsDialog = () => {
    return (
      <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)} className="register-success">
        <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
          <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
          <span className="text-lg md:text-xl font-medium text-center">
            {"Contact School Coordinator"}
          </span>
          <span className="text-sm text-center">
            {
              "We have recorded your interest, please contact your school coordinator to complete your registration"
            }
          </span>
          <AppButton
            type="button"
            className="self-center z-10"
            onClick={() => setShowSuccessDialog(false)}
            style={{ minWidth: "120px", height: "40px" }}
          >
            {"Proceed"}
          </AppButton>
          <Lottie
            animationData={cofettiAnimation}
            loop={false}
            className="absolute h-full w-full top-0 z-0"
          />
        </div>
      </Dialog>
    );
  };

  if (loading) {
    return renderLoader();
  }



  if (user?.tenantStatus !== "TENANT_UNPAID" && !isDemo) {
    return <></>;
  }

  return (
    <div className="w-full h-full rounded-lg px-4 md:px-6 bg-[#FFCC751a] border border-solid border-[#FFFFFF4D] overflow-hidden">

      <div className="py-4 md:py-8">
        <div className="font-medium text-lg md:text-2xl mb-5 md:mb-10 text-white">
        {`${tenantDetails?.currentActivePlanExpired ? "Subscription Plan" : `${schoolAbreviatedName} Special Plan`} ${schoolDiscountPercentage ? `- ${schoolDiscountPercentage}% Off` : ''}`}
        </div>
        <div className="grid grid-cols-5 text-[10px] md:text-base gap-4 text-center text-white">
          <div className="grid place-items-center gap-2">
            <TrophyOutlineSvg className="md:w-8 md:h-8" />
            {planDetails?.tournamentsPerPlan} Tournaments
          </div>
          <div className="grid place-items-center gap-2">
            <GiftSvg className="md:w-8 md:h-8" />

            <>
              <div className="flex flex-col">
                <div>
                  Awesome <br className="md:hidden" />
                  Awards{" "}
                </div>
                {/* <div>Off</div> */}
              </div>
            </>

          </div>

          <div className="grid place-items-center gap-2">

            <>
              <EditorChoiceSvg className="md:w-8 md:h-8" />
              Merit Certificates
            </>

          </div>
          <div className="col-span-2 grid place-items-end">
            {userGradeStatus === "CONVERTED_PAYTHROUGHSCHOOL" && (
              interestedInSChoolAnnualPack ? (
                <div className="rounded-[6px] w-full text-[12px] md:text-lg">
                  Awaiting confirmation from your school
                </div>
              ) : (
                <AppButton
                  className="bg-[#FFCC75] rounded-[6px] w-full text-sm md:text-lg"
                  onClick={handleInterestedClick}
                >
                  Interested
                </AppButton>
              )
            )}
            {(userGradeStatus === "CONVERTED_PAYDIRECT" || isDemo) && (
              <AppButton
                className="bg-[#FFCC75] rounded-[6px] w-full text-sm md:text-lg"
                onClick={goToCheckout}
              >
                {schoolDiscountedAmount && schoolDiscountPercentage ? (
                  <>
                    <span className="line-through text-[10px] md:text-sm">
                      ₹{planDetails?.amount}/-
                    </span>
                    ₹{schoolDiscountedAmount}/-
                  </>
                ) : (
                  `₹${planDetails?.amount}/-`
                )}
              </AppButton>
            )}

          </div>
        </div>
      </div>
      {renderCoinsDialog()}
    </div>
  );
};

export default TenantUserPaymentBanner;