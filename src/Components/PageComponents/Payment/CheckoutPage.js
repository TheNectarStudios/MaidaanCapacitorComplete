import Layout from "../../Common/Layout";
import PaymentPlanAccordian from "./PaymentPlanAccordian";
import PricePill from "./PricePill";
import BottomButtonBar from "../../Common/BottomButtonBar";
import BillingDetails from "./BillingDetails";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getAllSubscriptionPlans } from "../../../services/wallet";
import Loader from "../Loader";
import { useAuth } from "../../../providers/auth-provider";
import { LONG_TERM_PLAN_LIST, PREMIER_12MONTHS_PLAN, PREMIER_1TOURNAMENT_PLAN, PREMIER_3MONTHS_PLAN, SUPER_12MONTHS_PLAN, SUPER_1TOURNAMENT_PLAN, SUPER_3MONTHS_PLAN, SCHOOL_12MONTHS_PLAN, SCHOOL_6MONTHS_PLAN, LONG_TERM_SCHOOL_PLAN_LIST, DEFAULT_TENANT_ID } from "../../../Constants/Commons";
import { initiatePayment } from "../../../services/payment";
import mixpanel from 'mixpanel-browser';
import DarkModal from "../../Common/DarkModal";
import AppButton from "../../Common/AppButton";
import { TOURNAMENT_SELECT_ROUTE } from "../../../Constants/routes";
import { getTenantDetails } from "../../../services/tenant";
import AppInput from "../../Common/AppInput";
import AppSelect from "../../Common/AppSelect";
import { Dialog } from "@mui/material";

const CheckoutPage = ({ paymentLink = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams,] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [superPricePillData, setSuperPricePillData] = useState([]);
  const [premierPricePillData, setPremierPricePillData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSuperAccordion, setOpenSuperAccordion] = useState(false);
  const [openPremierAccordion, setOpenPremierAccordion] = useState(false);
  const [showRegistrationsClosedPopup, setShowRegistrationsClosedPopup] = useState(false);
  const [schoolAbreviatedName, setSchoolAbreviatedName] = useState("");
  const [schoolDiscountCode, setSchoolDiscountCode] = useState("");
  const [schoolDiscPercentage, setSchoolDiscPercentage] = useState(0);
  const [school12MonthsPlan, setSchool12MonthsPlan] = useState(false);
  const [schoolPricePillData, setSchoolPillData] = useState([]);
  const [schoolDiscountedAmount, setSchoolDiscountedAmount] = useState(0);
  const [schoolName, setSchoolName] = useState("");
  const [selectedPlanExpired, setSelectedPlanExpired] = useState(false);
  const [fullName, setFullName] = useState("");
  const [userGrade, setUserGrade] = useState("");
  const [userSection, setSection] = useState("");
  const [paymentPlanId, setPaymentPlanId] = useState("");
  const [gradeOptions, setGradeOptions] = useState([{}]);
  const selectedPlanId = searchParams.get("planId");
  const userTenantId = searchParams.get("tenantId");
  const isDemo = searchParams.get("d") === "S";
  const [showPaymentNotSupportedPopup, setShowPaymentNotSupportedPopup] = useState(false);


  const [showMissingFields, setShowMissingFields] = useState(false);
  //console.log("selectedPlanId", selectedPlanId);
  const paidTournamentId = searchParams.get("tId") ?? "";
  const { user } = useAuth();
  const modalRef = useRef();

  useEffect(() => {
    const fetchAllPlans = async () => {
      const data = await getAllSubscriptionPlans();
      setAllPlans(data);
      setLoading(false);
    };
    fetchAllPlans();
  }, []);

  useEffect(() => {
    const getSchoolAbreviatedName = async () => {
      const tenantId = isDemo ? `maidaan` : user?.tenantIds?.[0] ?? userTenantId;
      //console.log("tenantId", tenantId);
      if(tenantId === DEFAULT_TENANT_ID) {
        setPaymentPlanId(selectedPlanId);
      }
      else{
        const tenantDetails = await getTenantDetails(tenantId);
        //console.log("tenantDetails", tenantDetails);
        const { abbreviatedName, discountCode, status, discountedAmount, discountPercentage, currentActivePlan, currentActivePlanExpired } = tenantDetails;

        //iterate through status and check if the value is CONVERTED_PAYTHROUGHSCHOOL, then retrun the key, value pair as label, value for the select component

        const gradeOptions = Object.keys(status).map((key) => {
          if (status[key] === "CONVERTED_PAYDIRECT") {
            return { label: key, value: key }
          }
        });

        //remove the null values from the array

        const filteredGradeOptions = gradeOptions.filter((option) => !!option);
        const paymentPlanId = currentActivePlan ? currentActivePlan : selectedPlanId;

        setPaymentPlanId(paymentPlanId);
        setSelectedPlanExpired(() => currentActivePlan === paymentPlanId && currentActivePlanExpired);
        setSchoolName(tenantDetails.name);
        setGradeOptions(filteredGradeOptions);
        setSchoolAbreviatedName(abbreviatedName);
        setSchoolDiscountCode(discountCode);
        setSchoolDiscPercentage(discountPercentage[paymentPlanId]);
        setSchoolDiscountedAmount(discountedAmount[paymentPlanId]);
      }
    };
      getSchoolAbreviatedName();
  }, [user]);

  useEffect(() => {
    if (paymentPlanId && allPlans) {
      const selectedPlanDetails = allPlans.find((plan) => plan.id === paymentPlanId);
      // if (!selectedPlanDetails) {
      //   showToast("Plan not found");
      //   return;
      // }
      setSelectedPlan(selectedPlanDetails);
      switch (paymentPlanId) {
        case SUPER_1TOURNAMENT_PLAN: {
          const findSuperPlan = allPlans.find(
            (plan) => plan.id === SUPER_1TOURNAMENT_PLAN
          );
          const findSuper12MonthsPlan = allPlans.find(
            (plan) => plan.id === SUPER_12MONTHS_PLAN
          );
          setSuperPricePillData([findSuperPlan, findSuper12MonthsPlan]);
          const premier1TournamentPlan = allPlans.find(
            (plan) => plan.id === PREMIER_1TOURNAMENT_PLAN
          );
          const premier12MonthsPlan = allPlans.find(
            (plan) => plan.id === PREMIER_12MONTHS_PLAN
          );
          setPremierPricePillData([
            premier1TournamentPlan,
            premier12MonthsPlan,
          ]);
          setOpenSuperAccordion(true);
          break;
        }
        case SUPER_3MONTHS_PLAN: {
          const super3MonthsPlan = allPlans.find(
            (plan) => plan.id === SUPER_3MONTHS_PLAN
          );
          const super12MonthsPlan = allPlans.find(
            (plan) => plan.id === SUPER_12MONTHS_PLAN
          );
          setSuperPricePillData([super3MonthsPlan, super12MonthsPlan]);
          const premier3MonthsPlan = allPlans.find(
            (plan) => plan.id === PREMIER_3MONTHS_PLAN
          );
          const premier12MonthsPlan = allPlans.find(
            (plan) => plan.id === PREMIER_12MONTHS_PLAN
          );
          setPremierPricePillData([premier3MonthsPlan, premier12MonthsPlan]);
          setOpenSuperAccordion(true);
          break;
        }
        case SUPER_12MONTHS_PLAN: {
          const super12MonthsPlan = allPlans.find(
            (plan) => plan.id === SUPER_12MONTHS_PLAN
          );
          setSuperPricePillData([super12MonthsPlan]);
          const premier12MonthsPlan = allPlans.find(
            (plan) => plan.id === PREMIER_12MONTHS_PLAN
          );
          setPremierPricePillData([premier12MonthsPlan]);
          setOpenSuperAccordion(true);
          break;
        }
        case PREMIER_1TOURNAMENT_PLAN: {
          const premier1TournamentPlan = allPlans.find(
            (plan) => plan.id === PREMIER_1TOURNAMENT_PLAN
          );
          setPremierPricePillData([premier1TournamentPlan]);
          setOpenPremierAccordion(true);
          break;
        }
        case PREMIER_3MONTHS_PLAN: {
          const premier3MonthsPlan = allPlans.find(
            (plan) => plan.id === PREMIER_3MONTHS_PLAN
          );
          const premier12MonthsPlan = allPlans.find(
            (plan) => plan.id === PREMIER_12MONTHS_PLAN
          );
          setPremierPricePillData([premier3MonthsPlan, premier12MonthsPlan]);
          setOpenPremierAccordion(true);
          break;
        }
        case PREMIER_12MONTHS_PLAN: {
          const premier12MonthsPlan = allPlans.find(
            (plan) => plan.id === PREMIER_12MONTHS_PLAN
          );
          setPremierPricePillData([premier12MonthsPlan]);
          setOpenPremierAccordion(true);
          break;
        }

        case SCHOOL_12MONTHS_PLAN: {
          const school12MonthsPlan = allPlans.find(
            (plan) => plan.id === SCHOOL_12MONTHS_PLAN
          );
          setPremierPricePillData(null);
          setOpenSuperAccordion(true);
          setSchool12MonthsPlan(true);
          //add discounted amount to the plan
          if (school12MonthsPlan) {
            school12MonthsPlan.discountedAmount = schoolDiscountedAmount;
          }
          setSchoolPillData([school12MonthsPlan]);
          //setOpenPremierAccordion(true);
          break;
        }

        case SCHOOL_6MONTHS_PLAN: {
          const school6MonthsPlan = allPlans.find(
            (plan) => plan.id === SCHOOL_6MONTHS_PLAN
          );
          setPremierPricePillData(null);
          setOpenSuperAccordion(true);
          setSchool12MonthsPlan(true);
          //add discounted amount to the plan
          if (school6MonthsPlan) {
            school6MonthsPlan.discountedAmount = schoolDiscountedAmount;
          }
          setSchoolPillData([school6MonthsPlan]);
          //setOpenPremierAccordion(true);
          break;
        }

        default:
          const planDetails = allPlans.find(
            (plan) => plan.id === paymentPlanId
          );
          setPremierPricePillData(null);
          setOpenSuperAccordion(true);
          setSchool12MonthsPlan(true);
          //add discounted amount to the plan
          if (planDetails) {
            planDetails.discountedAmount = schoolDiscountedAmount || planDetails.discountedAmount;
          }
          setSchoolPillData([planDetails]);
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentPlanId, allPlans]);
  useEffect(() => {
    if (showRegistrationsClosedPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRegistrationsClosedPopup]);

  const isSuperHidden = [PREMIER_1TOURNAMENT_PLAN, PREMIER_3MONTHS_PLAN, PREMIER_12MONTHS_PLAN].includes(paymentPlanId) || LONG_TERM_SCHOOL_PLAN_LIST.includes(paymentPlanId);

  const goToTournaments = () => {
    navigate(TOURNAMENT_SELECT_ROUTE);
  };

  const goBack = () => {
    // if history is empty, go back to lobby
    const history = window.history;
    if (history.length === 1 || history.state === null) {
      navigate("/lobby");
      return;
    }
    navigate(-1);
  };

  const handleBack = () => {
    const history = window.history;
    if (LONG_TERM_SCHOOL_PLAN_LIST.includes(paymentPlanId) && !paymentLink) {
      let url = "/tournament/select";
      if(isDemo) {
        url = `${url}?d=S`;
      }
      navigate(url);
      return;
    }
    if (history.length === 1 || history.state === null || location?.state?.from === 'login') {
      navigate("/lobby");
      return;
    }
    navigate(-1);
  };
  const handleProceed = async () => {
    setShowMissingFields(true);
    if(isDemo) {
      setShowPaymentNotSupportedPopup(true);
      return;
    }
    if (paymentLink && (!fullName || !userGrade)) {
      return;
    }
    localStorage.setItem("selectedPlanId", selectedPlan.id);
    localStorage.setItem("paidTournamentId", paidTournamentId);
    let data;
    if (paymentLink) {
      data = {
        subscriptionId: paymentPlanId,
        fullName,
        grade: userGrade,
        section: userSection,
        phoneNumber: localStorage.getItem("phoneNumber"),
        tenantId: userTenantId,
      }
    }
    else {
      data = {
        subscriptionId: selectedPlan.id,
        paidTournamentId: LONG_TERM_PLAN_LIST.includes(selectedPlan.id) ? "" : paidTournamentId,
      }
    };
    mixpanel.identify(user.id);
    mixpanel.track('Checkout_Pay', {
      'Plan': selectedPlan.id,
      'tournamentId': paidTournamentId
    })
    const { url, showTournamentStatedPopup } = await initiatePayment(data, paymentLink);
    if (showTournamentStatedPopup) {
      setShowRegistrationsClosedPopup(true);
    }
    else {
      window.location.href = url;
    }
  }

  const handleClose = () => {
    setShowRegistrationsClosedPopup(false);
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleClose();
    }
  };

  const rendePaymentNotSupportedPopup = () => {
    return (
        <Dialog
            open={showPaymentNotSupportedPopup}
            onClose={() => {
                setShowPaymentNotSupportedPopup(false);
            }}
            className="register-success"
        >
            <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden p-4 text-base">

                <ul className="my-6 mx-0 flex flex-col gap-4">
                    <p className="my-2 mx-0 ml-[-40px] text-center">{(<>Payments not support in demo mode</>)}</p>
                </ul>
                <div className='flex items-center justify-center w-full h-full'>
                    <AppButton
                        onClick={() => {
                            setShowPaymentNotSupportedPopup(false);
                        }}
                        className="rounded-[115px] min-w-[100px] w-[100px] h-[35px] min-h-[35px] self-center items-center"
                    >
                        Back
                    </AppButton>
                </div>
            </div>
        </Dialog>
    );
}


  const renderRegistrationsClosedPopup = () => {
    return (
      <DarkModal isOpen={showRegistrationsClosedPopup}>
        <div ref={modalRef} className="flex justify-center items-center flex-col gap-6 px-4 text-center">
          <div className="text-[24px] text-[#ccf900]">
            Registrations Closed
          </div>
          <div className="text-white text-base">
            This tournament’s registrations are closed, you can checkout our other upcoming tournaments
          </div>
          <div className="space-y-4 text-base">
            <AppButton className="w-full" onClick={goToTournaments}>
              Other Tournaments
            </AppButton>
          </div>
        </div>
      </DarkModal>
    );
  };

  return (
    <Layout
      showArenaHeader
      onBackClick={handleBack}
      headerText="Checkout"
      layoutClassName="overflow-auto"
      showBack={!paymentLink}
    >
      {loading ? (
        <div className="flex w-full h-full justify-center items-center">
          <Loader />
        </div>
      ) : (
        <>
          <div className="p-4 space-y-7 pb-12">
            <div className="space-y-4">
              {paymentLink ? (
                <div className="text-base">
                  <div className="flex flex-col justify-around items-start mb-4 h-full w-full max-w-lg gap-2">
                    <div className="w-full">
                      <AppInput
                        onChange={setFullName}
                        value={fullName}
                        placeholder="Contestant's full name"
                        className="text-center"
                      />
                      {showMissingFields && !fullName && <span className="text-base text-red-500 ml-2"> Full name required</span>}
                    </div>
                    <div className="flex w-full gap-3">
                      <div className="w-full">
                        <AppSelect
                          onChange={setUserGrade}
                          options={gradeOptions}
                          placeholder="Grade"
                          className="w-full text-xs"
                          textStyle={true}
                        />
                        {showMissingFields && !userGrade && <span className="text-base text-red-500 ml-2"> Grade required</span>}
                      </div>
                      <div className="w-full">

                        <AppInput
                          onChange={setSection}
                          value={userSection}
                          placeholder="Section"
                          className="w-full text-center"
                        />
                      </div>
                    </div>
                    <AppInput
                      label="School"
                      autoComplete="off"
                      isAutocomplete={!userTenantId}
                      disabled={true}
                      value={schoolName}
                      className="w-full text-center"
                    //items={allTenants ?? []}
                    />
                  </div>

                </div>
              ) : (<></>
              )}
              {isSuperHidden ? (
                <></>
              ) : (
                <PaymentPlanAccordian
                  isOpen={openSuperAccordion}
                  className="bg-[#FFCC751a]"
                  headerComponent={
                    <>
                      <span className="md:text-xl">Super</span>
                      <span className="text-[11px] md:text-sm ml-2">
                        (Tournaments + Certificates)
                      </span>
                    </>
                  }
                >
                  <hr className="border-[#FFFFFF4D] mb-3" />
                  <div
                    className="grid gap-3 text-white"
                    style={{
                      gridTemplateColumns: `repeat(${superPricePillData.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {superPricePillData.map((plan) => {
                      return (
                        <PricePill
                          data={plan}
                          selectedPlan={selectedPlan}
                          setSelectedPlan={setSelectedPlan}
                        />
                      );
                    })}
                  </div>
                </PaymentPlanAccordian>
              )}

              {!school12MonthsPlan ? (
                <></>
              ) : (
                <PaymentPlanAccordian
                  isOpen={openSuperAccordion}
                  className="bg-[#FFCC751a]"
                  headerComponent={
                    <>
                      <span className="md:text-xl">Subscription Plan</span>
                      <span className="text-[11px] md:text-sm ml-2">
                        (Tournaments + Awards)
                      </span>
                    </>
                  }
                >
                  <hr className="border-[#FFFFFF4D] mb-3" />
                  <div
                    className="grid gap-3 text-white"
                    style={{
                      gridTemplateColumns: `repeat(${schoolPricePillData.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {schoolPricePillData.map((plan) => {
                      return (
                        <PricePill
                          data={plan}
                          selectedPlan={selectedPlan}
                          setSelectedPlan={setSelectedPlan}
                          abbreviatedName={schoolAbreviatedName}
                          selectedPlanExpired={selectedPlanExpired}
                        />
                      );
                    })}
                  </div>
                </PaymentPlanAccordian>
              )}

              {!!premierPricePillData && <PaymentPlanAccordian
                isOpen={openPremierAccordion}
                className="bg-[#FFFFFF33]"
                headerComponent={
                  <>
                    <span className="md:text-xl">Premier</span>
                    <span className="text-[11px] md:text-sm ml-2">
                      (Super +{" "}
                      <span className="uppercase text-primary-yellow">
                        Awards
                      </span>
                      )
                    </span>
                  </>
                }
              >
                <hr className="border-[#FFFFFF4D] mb-3" />
                <div
                  className="grid gap-3 text-white"
                  style={{
                    gridTemplateColumns: `repeat(${premierPricePillData.length}, minmax(0, 1fr))`,
                  }}
                >
                  {premierPricePillData.map((plan) => {
                    return (
                      <PricePill
                        data={plan}
                        selectedPlan={selectedPlan}
                        setSelectedPlan={setSelectedPlan}
                        abbreviatedName={plan?.abbreviatedName}
                      />
                    );
                  })}
                </div>
              </PaymentPlanAccordian>
              }
            </div>
            {selectedPlan ? (
              <BillingDetails selectedPlan={selectedPlan} discountCode={schoolDiscountCode} discountPercentage={schoolDiscPercentage} />
            ) : (
              <></>
            )}
          </div>
          <BottomButtonBar
            text={`₹${selectedPlan?.discountedAmount}`}
            buttonProps={{
              onClick: handleProceed,
              disabled: false,
              isLoading: false,
              text: "Proceed to Pay",
            }}
          />
          {renderRegistrationsClosedPopup()}
          {rendePaymentNotSupportedPopup()}
        </>
      )}
    </Layout>
  );
};

export default CheckoutPage;