import { Dialog } from "@mui/material";
import AppButton from "../../Common/AppButton";
import Lottie from "lottie-react";
import confettiAnimation from "../../../assets/animations/confetti.json";
import alertIconExclamationAnimation from "../../../assets/animations/alert-icon-exclamation.json";
import { CHECKOUT_ROUTE, LOBBY_ROUTE, TOURNAMENT_SELECT_ROUTE } from "../../../Constants/routes";
import { useEffect, useState } from "react";
import Loader from "../Loader";
import { useSearchParams } from "react-router-dom";


const PaymentSuccessOrFailModal = () => {
  const [searchParams] = useSearchParams();

  const paymentWithPhoneNumber = searchParams.get("paymentWithPhoneNumber");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailure, setIsFailure] = useState(false);
  useEffect(() => {
    const checkPaymentStatus = localStorage.getItem("paymentSuccess");
    localStorage.removeItem("paymentSuccess");
    if (checkPaymentStatus && checkPaymentStatus === "1") {
      setIsSuccess(true);
    } else if (checkPaymentStatus && checkPaymentStatus === "0") {
      setIsFailure(true);
    } else if (checkPaymentStatus === null || checkPaymentStatus === undefined) {
      window.location.href = LOBBY_ROUTE;
    }
  }, []);

  const handleTryAgain = () => {
    const planIdFromLS = localStorage.getItem("selectedPlanId");
    const tournamentId = localStorage.getItem("paidTournamentId");
    localStorage.removeItem("selectedPlanId");
    localStorage.removeItem("paidTournamentId");
    window.location.replace(`${CHECKOUT_ROUTE}?planId=${planIdFromLS}&tId=${tournamentId}`);
  };

    return (
      <>
        {isSuccess || isFailure ? (
          <Dialog open={true} className="register-success">
            <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-4 py-10 gap-6">
              {isSuccess ? (
                <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
              ) : (
                <Lottie
                  animationData={alertIconExclamationAnimation}
                  loop={false}
                  className="w-2/3 aspect-square mx-auto"
                />
              )}
              <span className="text-lg md:text-xl font-medium text-center">
                {isSuccess ? "Payment Success!" : "Payment Failed"}
              </span>
              <span className="text-sm text-center">
                {isSuccess
                  ? `Thank you for your purchase, ${paymentWithPhoneNumber ? 'we look forward to a lot of learning and fun together. You can exit this page': 'check out your upcoming tournaments from below'}`
                  : "Sorry, your payment has failed, please try again or talk to the support team for further assitance"}
              </span>
              {isSuccess&&!paymentWithPhoneNumber ? (
                <AppButton
                  type="button"
                  className="self-center z-10 w-full max-w-[220px] h-12"
                  onClick={() => {
                    window.location.href = TOURNAMENT_SELECT_ROUTE;
                  }}
                >
                  View Tournaments
                </AppButton>
              ) : (
                !paymentWithPhoneNumber&&
                <AppButton
                  type="button"
                  className="self-center z-10 w-full max-w-[220px] h-12"
                  onClick={handleTryAgain}
                >
                  Try Again
                </AppButton>
              )}
              {!paymentWithPhoneNumber && <AppButton
                type="button"
                className="self-center z-10 w-full max-w-[220px] h-12"
                onClick={() => {
                  window.location.href = LOBBY_ROUTE;
                }}
                variant="secondary"
              >
                Go to Lobby
              </AppButton>}
              {isSuccess ? (
                <Lottie
                  animationData={confettiAnimation}
                  loop={false}
                  className="absolute h-full w-full top-0 z-0"
                />
              ) : (
                <></>
              )}
            </div>
          </Dialog>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Loader />
          </div>
        )}
      </>
    );
};

export default PaymentSuccessOrFailModal;