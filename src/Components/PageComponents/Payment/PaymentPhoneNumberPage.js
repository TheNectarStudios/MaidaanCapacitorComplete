import React, { useEffect } from "react";
import VerifyPhonePage from "../Register/VerifyPhone";
import { GAME_HOUR_START_TIME, GAME_HOUR_END_TIME } from "../../../Constants/Commons";
import { checkplanTest } from "../../../services/child";
import CheckoutPage from "./CheckoutPage";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { set } from "lodash";
import Loader from "../Loader";



const PaymentPhoneNumberPage = () => {
    const navigate = useNavigate();
    const [searchParams,] = useSearchParams();
    const [isPhoneVerified, setIsPhoneVerified] = React.useState(false);
    const [otpVerified, setOtpVerified] = React.useState(false);
    const [navigatePayment, setNavigatePayment] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const planId = searchParams.get("planId");

    useEffect(() => {
     function run() {
        
        const phoneNumber = localStorage.getItem("phoneNumber");
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if(userId && token) {
          navigate(`/checkout?planId=${planId}`);
        }
        else if(phoneNumber && token ) {
          setNavigatePayment(true);
        }

      }

      run();
    }
    ,[]);

    // useEffect(() => {

    //   const formData = {
    //     startTime: GAME_HOUR_START_TIME,
    //     endTime: GAME_HOUR_END_TIME,
    //   };

    //   checkplanTest(formData).then((isGameHour) => {
        
          
    //     if (!isGameHour) {
    //         console.log("isGameHour", isGameHour);
    //     } else {
    //       console.log("isGameHour", isGameHour);

    //     }
    //   });

    // }, []);


    return (
      loading ? (
        <Loader />
      ) : (
        (!otpVerified && !navigatePayment) ? (
          <VerifyPhonePage 
            setIsPhoneVerified={setIsPhoneVerified} 
            setOtpVerified={setOtpVerified} 
            paymentLink={true} 
          />
        ) : (
          <CheckoutPage paymentLink={true} />
        )
      )
    );
    
      
};

export default PaymentPhoneNumberPage;