import Lottie from "lottie-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import cardPaymentAnimation from "../../../assets/animations/card-payment.json";
import greenCheckAnimation from "../../../assets/animations/green-check.json";
import alertIconExclamationAnimation from "../../../assets/animations/alert-icon-exclamation.json";
import { checkPaymentStatus, checkPaymentStatusById } from "../../../services/payment";
import { PAYMENT_REDIRECT_ROUTE } from "../../../Constants/routes";

const PAYMENT_CODES = {
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_PENDING: "PAYMENT_PENDING",
};

let timeout;

const PaymentVerifyPage = () => {
  // eslint-disable-next-line no-unused-vars
  const [searchParams, _] = useSearchParams();
  const id = searchParams.get("id");
  console.log("id", id);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentCode, setPaymentCode] = useState('');
  const retryAttempts = useRef(0);

  useEffect(() => {
    const verifyPayment = async () => {
      const { code, paymentWithPhoneNumber } = await checkPaymentStatusById(id);
      console.log("code", code);
      setPaymentCode(code);
      retryAttempts.current += 1;
      if (
        code === PAYMENT_CODES.PAYMENT_PENDING &&
        retryAttempts.current < 10
      ) {
        timeout = setTimeout(() => {
          verifyPayment();
        }, 1000);
      } else {
        setIsLoading(false);
        setTimeout(() => {
          if (code === PAYMENT_CODES.PAYMENT_SUCCESS) {
            localStorage.setItem("paymentSuccess", 1);
          } else {
            setPaymentCode("FAILURE");
            localStorage.setItem("paymentSuccess", 0);
          }
          if(!paymentWithPhoneNumber) {
            navigate(PAYMENT_REDIRECT_ROUTE);
          }
          else{
            navigate(`/payment/redirect?paymentWithPhoneNumber=${paymentWithPhoneNumber}`);
          }
        }, 2000);
      }
    };
    verifyPayment();
    return () => {
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const renderPendingState = () => {
    return (
      <div className="space-y-5">
        <Lottie
          animationData={cardPaymentAnimation}
          loop
          className="w-2/3 aspect-square mx-auto"
        />
        <div className="text-2xl">Verifying Payment...</div>
      </div>
    );
  };
  
  const renderSuccessOrFailure = () => {
    if (paymentCode === PAYMENT_CODES.PAYMENT_SUCCESS) {
      return (
        <div className="space-y-5">
          <Lottie
            animationData={greenCheckAnimation}
            loop={false}
            className="w-2/3 aspect-square mx-auto"
          />
          <div className="text-2xl">Payment Successful!</div>
          <div>Redirecting, Please wait a moment...</div>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <Lottie
          animationData={alertIconExclamationAnimation}
          loop={false}
          className="w-2/3 aspect-square mx-auto"
        />
        <div className="text-2xl">Payment Failed!</div>
        <div>Redirecting, Please wait a moment...</div>
      </div>
    );
  };
        

  return (
    <div className="flex flex-col justify-center items-center h-full w-full">
      <div className="w-full max-w-sm text-center space-y-12 px-5">
        {isLoading ? renderPendingState() : renderSuccessOrFailure()}
        <div className="text-red-500 font-bold">
          Important: Do not press the back button or refresh this page!
        </div>
      </div>
    </div>
  );
};

export default PaymentVerifyPage;
