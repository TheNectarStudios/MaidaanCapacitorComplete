import { useNavigate } from "react-router-dom";
import { initiatePayment } from "../../../services/payment";
import BottomButtonBar from "../../Common/BottomButtonBar";
import Layout from "../../Common/Layout";
import { useEffect, useMemo, useState } from "react";
import { getPlans } from "../../../services/wallet";
import AppRadio from "../../Common/AppRadio";
import AppCheckbox from "../../Common/AppCheckbox";
import { getMonths } from "../../../services/child";
import { twMerge } from "tailwind-merge";
import { ReactComponent as CrownSvg } from "../../../assets/icons/crown.svg";
import { Dialog } from "@mui/material";
import AppButton from "../../Common/AppButton";
import useToast from "../../../hooks/use-toast";
import Loader from "../Loader";
import { MEASURE } from "../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { useAuth } from "../../../providers/auth-provider";
import mixpanel from 'mixpanel-browser';

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const [plans, setPlans] = useState([]);
    const [months, setMonths] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [currentMonth, setCurrentMonth] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
        const fetchPlans = async () => {
            const plans = await getPlans();
            let months = await getMonths();
            setPlans(plans);
            setSelectedPlan(plans[0]);
            const currentMonthFullName = new Date().toLocaleString('default', { month: 'long' });
            const searchCurrentMonthIndex = months.findIndex(
              (month) =>
              month.value.toLowerCase() === currentMonthFullName.toLowerCase()
            );

            const splicedMonthsFromCurrentToNextSixMonths = [];

            const currentyear = new Date().getFullYear().toString().slice(-2)
            for(let i=-1;i<5;i++){
              if(searchCurrentMonthIndex+i > 12){
                splicedMonthsFromCurrentToNextSixMonths.push({
                  month :months[(i+searchCurrentMonthIndex+12)%12],
                  year : JSON.stringify(currentyear+1)});
              }
              else if(searchCurrentMonthIndex+i < 0){
                splicedMonthsFromCurrentToNextSixMonths.push({
                  month :months[(i+searchCurrentMonthIndex+12)%12],
                  year :JSON.stringify(currentyear-1)});
              }
              else{
                splicedMonthsFromCurrentToNextSixMonths.push({
                  month :months[(i+searchCurrentMonthIndex+12)%12],
                  year : currentyear});
              }
            }
            
            months = splicedMonthsFromCurrentToNextSixMonths;
            setMonths(months);
            setCurrentMonth(currentMonthFullName);
            setLoading(false);
        }
        fetchPlans();
    }, []);

    const finalAmounts = useMemo(() => {
        if (!selectedPlan) return { total: 0, gst: 0 };
        const { amount, gstInPercentage } = selectedPlan;
        const gst = Number(((gstInPercentage / 100) * amount).toFixed(2));
        const amountWithGst = amount + gst;
        return { total: Number(amountWithGst.toFixed(2)), gst };
    }, [selectedPlan]);

    const handlePayment = async () => {
      // if (!selectedPlan || (selectedPlan?.totalMonths !== selectedMonths?.length)) return;
      if (!selectedPlan) return;

      if (!showOrderSummary) {
        MEASURE(
          INSTRUMENTATION_TYPES.SUBSCRIPTION_PAY,
          user.id,
          { selectedPlan: selectedPlan }
        );
        setShowOrderSummary(true);
        return;
      }

      if (selectedPlan?.totalMonths !== selectedMonths?.length) {
        showToast(`Please select ${selectedPlan?.totalMonths} month(s)`);
        return;
      };

      MEASURE(INSTRUMENTATION_TYPES.PLACE_ORDER, user.id, {
        selectedMonths: selectedMonths,
      });

      const data = {
        subscriptionId: selectedPlan.id,
        months: selectedMonths,
      };
      const { url } = await initiatePayment(data);
      window.location.href = url;
    };

    const checkIfAlreadySubscribed = (month) => {
      const { subscriptionExpiry = {}, subscriptionStartedAt = {} } = user;
      const isAlreadySub =
        subscriptionExpiry[month] && subscriptionStartedAt[month];
      return isAlreadySub;
    }

    const isMonthDisabled = (month) => {
      let isDisabledByPlan =
        !selectedPlan ||
        (selectedPlan?.totalMonths === selectedMonths?.length &&
          !selectedMonths?.includes(month));
      return isDisabledByPlan || checkIfAlreadySubscribed(month);
    }

    const isCurrentMonthAbsent = () => {
      const currentMonthLowerCase = currentMonth.toLowerCase();
      return (
        !checkIfAlreadySubscribed(currentMonthLowerCase) &&
        !selectedMonths?.includes(currentMonthLowerCase) &&
        selectedPlan?.totalMonths === selectedMonths?.length
      );
    }

    const onMonthChange = (e, month) => {
      if (e.target.checked) {
        setSelectedMonths([...selectedMonths, month]);
        return;
      }
      setSelectedMonths(
        selectedMonths.filter((selectedMonth) => selectedMonth !== month)
      );
    };

    const getFormattedMonth = (monthobj) => {
      const monthInThreeLetters = monthobj.month.label.slice(0, 3);
      // last two digits of current year
      const year = monthobj.year;
      return `${monthInThreeLetters} '${year}`;
    };

    const handlePlanChange = (plan) => {
      setSelectedPlan(plan);
      setSelectedMonths([]);
    };

    const renderBenefitsSection = () => {
      return (
        <div className="bg-primary-gradient-reverse p-3 rounded-lg flex flex-col w-full border border-solid border-primary-yellow max-w-xs gap-4">
          <div className="grid grid-cols-9 text-sm items-center">
            <CrownSvg className="h-[25px] aspect-square mr-4" />
            <span className="col-span-8 pt-1">
              Transfer winnings to Maidaan Vault and choose prizes from
              the&nbsp;
              <span className="text-[#E9C761]">Reward Store</span>
            </span>
          </div>
          <div className="grid grid-cols-9 text-sm items-center">
            <CrownSvg className="h-[25px] aspect-square mr-4" />
            <span className="col-span-8 pt-1">
              <span className="text-[#E9C761]">Digital Certificates</span>
              &nbsp;for Merit Ranks
            </span>
          </div>
          <div className="grid grid-cols-9 text-sm items-center">
            <CrownSvg className="h-[25px] aspect-square mr-4" />
            <span className="col-span-8 pt-1">
              Monthly&nbsp;
              <span className="text-[#E9C761]">Performance Reports</span>
              &nbsp;with strengths & areas of improvement
            </span>
          </div>
        </div>
      );
    };

    const renderPlanItem = (plan) => {
      const { id, name, amount, description, discountString } = plan;
      return (
        <AppRadio
          key={id}
          className="mt-6 mr-2"
          id={id}
          name="plan"
          value=""
          onChange={() => handlePlanChange(plan)}
          checked={selectedPlan?.id === id}
          label={
            <div className="bg-[#4a4a4aB3] h-auto w-80 rounded-lg backdrop-blur-[2px] text-white p-4 space-y-4">
              <div className="text-2xl">{name}</div>
              <div className="break-normal text-sm">{description}</div>
              <div className="flex gap-4 items-center">
                <div className="w-[108px] h-6 bg-gradient-to-r from-[#CCF900] to-[#1D664A] text-[#3a3a3a] flex justify-center items-center rounded-lg gap-2">
                  <span className="mt-1">INR {amount}</span>
                </div>
                {discountString ? <div className="uppercase text-primary-yellow">{discountString}</div> : <></>}
              </div>
            </div>
          }
        />
      );
    };

    const renderOrderSummary = () => {
      const { total, gst } = finalAmounts;
      const { name, amount, totalMonths } = selectedPlan ?? {};
      return (
        <Dialog
          open={showOrderSummary}
          onClose={() => setShowOrderSummary(false)}
          className="register-success"
        >
          <div className="bg-[#383838] text-white py-11 px-5 w-full">
            <div className="flex justify-center mb-6">
              <span className="text-2xl text-primary-yellow">
                Order Summary
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-primary-yellow">Plan Chosen:</span> {name}
              </div>
              <div>
                <span className="text-primary-yellow">Amount:</span> INR{" "}
                {amount ?? 0}
              </div>
              <div>
                <span className="text-primary-yellow">Taxes:</span> INR {gst}
              </div>
              <div>
                <span className="text-primary-yellow">Total:</span> INR {total}
              </div>
              <div>
                <span className="text-primary-yellow">
                  Choose {totalMonths} month(s):
                </span>
                &nbsp;
                <span className="text-sm">
                  For which you want to activate your subscription
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 gap-y-4 mt-8">
              {months.map((obj) => {
                const value = obj.month.value;
                const isDisabled = isMonthDisabled(value);
                return (
                  <AppCheckbox
                    key={value}
                    id={value}
                    value=""
                    onChange={(e) => onMonthChange(e, value)}
                    disabled={isDisabled}
                    containerClassName="items-center"
                    className="mr-2"
                    checked={selectedMonths?.includes(value)}
                    label={
                      <div
                        className={twMerge(
                          "bg-[#4a4a4aB3] md:text-base text-[11px] h-fit w-fit rounded-lg backdrop-blur-[2px] text-white p-2",
                          isDisabled ? "opacity-50" : ""
                        )}
                      >
                        {getFormattedMonth(obj)}
                      </div>
                    }
                  />
                );
              })}
            </div>
            {isCurrentMonthAbsent() && (
              <div className="flex w-full mt-6 text-sm">
                <span className="text-primary-yellow">Note:</span>&nbsp;
                <span>
                  You have not included {currentMonth} in your selection, points
                  won in {currentMonth} will not move to the vault.
                </span>
              </div>
            )}
            <div className="flex w-full justify-center mt-8">
              <AppButton onClick={handlePayment}>Place Order</AppButton>
            </div>
          </div>
        </Dialog>
      );
    };

    
    return (
      <Layout
        showHeader={false}
        showBack
        onBackClick={() => {
          navigate("/wallet");
        }}
        headerText="Join Premier"
        showArenaHeader={true}
      >
        <div className="h-full w-full px-3 text-white overflow-auto flex flex-col items-center">
          <span className="text-[#E9C761] mb-4 text-lg">Premier Benefits</span>
          {renderBenefitsSection()}
          <span className="text-primary-yellow my-4 text-lg">
            Choose your plan
          </span>
          <div className="mb-48 grid grid-cols-1 gap-8 md:grid-cols-2">
            {loading ? <Loader /> : plans?.map((plan) => renderPlanItem(plan))}
          </div>
          <BottomButtonBar
            text={`INR ${selectedPlan?.amount} + Taxes`}
            buttonProps={{
              onClick: handlePayment,
              text: "Pay & Choose Months",
              className: "w-48",
            }}
          />
          {renderOrderSummary()}
        </div>
        <ToastComponent />
      </Layout>
    );
}

export default SubscriptionPage;