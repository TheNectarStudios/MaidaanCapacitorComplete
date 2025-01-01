import { useNavigate } from "react-router-dom";
import Layout from "../../../Common/Layout";
import { PREMIER_12MONTHS_PLAN, PREMIER_3MONTHS_PLAN, SUPER_12MONTHS_PLAN, SUPER_3MONTHS_PLAN, backButtonHandler } from "../../../../Constants/Commons";
import PaymentPlanAccordian from "../PaymentPlanAccordian";
import { useEffect, useState } from "react";
import { getAllSubscriptionPlans } from "../../../../services/wallet";
import PricePill from "../PricePill";
import Loader from "../../Loader";
import BottomButtonBar from "../../../Common/BottomButtonBar";
import mixpanel from "mixpanel-browser";
import { useAuth } from "../../../../providers/auth-provider";
import { initiatePayment } from "../../../../services/payment";
import { ReactComponent as TrophyOutlineSvg } from "../../../../assets/icons/Trophy.svg";
import { ReactComponent as EditorChoiceSvg } from "../../../../assets/icons/certificate.svg";
import { ReactComponent as CurrencyRupeeSvg } from "../../../../assets/icons/currency_rupee.svg";
import { ReactComponent as GiftSvg } from "../../../../assets/icons/Award.svg";

const ChoosePlan = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [superPricePillData, setSuperPricePillData] = useState([]);
    const [premierPricePillData, setPremierPricePillData] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const handleBack = () => {
      backButtonHandler(navigate, window.location);
    };
    useEffect(() => {
        const fetchAllPlans = async () => {
          const data = await getAllSubscriptionPlans();
          const super3MonthsPlan = data.find(
            (plan) => plan.id === SUPER_3MONTHS_PLAN
          );
          const super12MonthsPlan = data.find(
            (plan) => plan.id === SUPER_12MONTHS_PLAN
          );
          const premier3MonthsPlan = data.find(
            (plan) => plan.id === PREMIER_3MONTHS_PLAN
          );
          const premier12MonthsPlan = data.find(
            (plan) => plan.id === PREMIER_12MONTHS_PLAN
          );
          setPremierPricePillData([premier3MonthsPlan, premier12MonthsPlan]);
          setSuperPricePillData([super3MonthsPlan, super12MonthsPlan]);
          setSelectedPlan(super12MonthsPlan);
          setLoading(false);
        };
        fetchAllPlans();
      }, []);

      const handleProceed = async () => {
        localStorage.setItem("selectedPlanId", selectedPlan.id);
        const data = {
          subscriptionId: selectedPlan.id,
          paidTournamentId: "",
        };
        mixpanel.identify(user.id);
        mixpanel.track("Checkout_Pay", {
          Plan: selectedPlan.id,
          tournamentId: "",
        });
        const { url } = await initiatePayment(data);
        window.location.href = url;
      };

    return (
      <Layout
        showArenaHeader
        onBackClick={handleBack}
        headerText="Choose Your Plan"
      >
        {loading ? (
          <div>
            <Loader />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <PaymentPlanAccordian
              isOpen={true}
              className="bg-[#FFCC751a]"
              headerComponent={
                <>
                  Super
                  <span className="text-[11px] ml-2">
                    (Tournaments + Certificates)
                  </span>
                </>
              }
            >
              <hr className="border-[#FFFFFF4D] mb-3" />
              <div className="grid grid-cols-3 text-[10px] gap-4 my-4 text-center text-white">
                <div className="grid place-items-center gap-2">
                  <TrophyOutlineSvg />
                  <div className="flex flex-col">
                    <div>Exciting </div>
                    <div>Tournaments</div>
                  </div>
                </div>
                <div className="grid place-items-center gap-2">
                  <EditorChoiceSvg />
                  <div className="flex flex-col">
                    <div>Merit</div>
                    <div>Certificates</div>
                  </div>
                </div>
                <div className="grid place-items-center gap-2">
                  <CurrencyRupeeSvg />
                  <div className="flex flex-col">
                    <div>Save upto </div>
                    <div>50%</div>
                  </div>
                </div>
              </div>
              <div
                className="flex flex-col gap-3 text-white"
              >
                {superPricePillData.map((plan) => {
                  return (
                    <PricePill
                      data={plan}
                      selectedPlan={selectedPlan}
                      setSelectedPlan={setSelectedPlan}
                      showTournaments
                    />
                  );
                })}
              </div>
            </PaymentPlanAccordian>
            <PaymentPlanAccordian
              isOpen={true}
              className="bg-[#FFFFFF33]"
              headerComponent={
                <>
                  Premier{" "}
                  <span className="text-[11px] ml-2">
                    (Super +{" "}
                    <span className="uppercase text-[11px] text-primary-yellow">
                      Rewards
                    </span>
                    )
                  </span>
                </>
              }
            >
              <hr className="border-[#FFFFFF4D] mb-3" />
              <div className="grid grid-cols-4 text-[10px] gap-4 my-4 text-center text-white">
                <div className="grid place-items-center gap-2">
                  <TrophyOutlineSvg />
                  <div className="flex flex-col">
                    <div>Exciting </div>
                    <div>Tournaments</div>
                  </div>
                </div>
                <div className="grid place-items-center gap-2">
                  <EditorChoiceSvg />
                  <div className="flex flex-col">
                    <div>Merit</div>
                    <div>Certificates</div>
                  </div>
                </div>
                <div className="grid place-items-center gap-2">
                  <CurrencyRupeeSvg />
                  <div className="flex flex-col">
                    <div>Save upto </div>
                    <div>40%</div>
                  </div>
                </div>
                <div className="grid place-items-center gap-2">
                  <GiftSvg />
                  <div className="flex flex-col">
                    <div>Exciting </div>
                    <div>Rewards</div>
                  </div>
                </div>
              </div>
              <div
                className="flex flex-col gap-3 text-white"
              >
                {premierPricePillData.map((plan) => {
                  return (
                    <PricePill
                      data={plan}
                      selectedPlan={selectedPlan}
                      setSelectedPlan={setSelectedPlan}
                      showTournaments
                    />
                  );
                })}
              </div>
            </PaymentPlanAccordian>
          </div>
        )}
        <BottomButtonBar
          text={`₹${selectedPlan?.discountedAmount}`}
          buttonProps={{
            onClick: handleProceed,
            disabled: false,
            isLoading: false,
            text: "Proceed to Pay",
          }}
        />
      </Layout>
    );
};

export default ChoosePlan;