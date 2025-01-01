import axios from 'axios';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { INSTRUMENTATION_TYPES } from '../../../instrumentation/types';
import { firebaseAuth } from '../../../firebase-config';
import useTimer from '../../../hooks/use-timer';
import useToast from '../../../hooks/use-toast';
import AppButton from '../../Common/AppButton';
import Layout from '../../Common/Layout';
import PhoneNumberInput from '../../Common/PhoneInput';
import OtpInput from "react-otp-input";
import { twMerge } from 'tailwind-merge';
import mixpanel from 'mixpanel-browser';
import OTPScreen from './OTPScreen';
import { MEASURE } from '../../../instrumentation';
import { QODHeader } from '../QuestionOftheDay/QODHeader';

const VerifyPhonePage = ({ setIsPhoneVerified, setOtpVerified, setNavigatePayment, paymentLink = false }) => {
  const navigate = useNavigate();
  const { ToastComponent, hideToast, showToast } = useToast();
  const { startTimer, timer } = useTimer();
  // eslint-disable-next-line no-unused-vars
  const [searchParams, _] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const registerSource = searchParams.get("source");
  const leadType = searchParams.get("l");
  const isComingFromLobby = registerSource === "lobby";
  const tenantId = searchParams.get("tenantId") ?? '';
  const referral = searchParams.get("referralCode") ?? '';
  const planId = searchParams.get("planId") ?? '';

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOTP] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onChangePhone = (phone) => {
    setPhoneNumber(phone);
  };

  useEffect(() => {
    const phone = localStorage.getItem("phoneNumber");
    if (phone) {
      setPhoneNumber(phone);
    }
    window.recaptchaVerifier = new RecaptchaVerifier(
      "send-otp-button",
      {
        size: "invisible",
        callback: (response) => {
          sendOtp();
        },
      },
      firebaseAuth
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOtp = async () => {
    // if (!isComingFromLobby) {
    //   window.location = GOOGLE_FORM_REGISTER_URL;
    //   return;
    // }
    hideToast();
    
    if (phoneNumber.length < 10) return;

    let source = 'Open';
    let id = 'NA' 
      if(tenantId){
        source = 'School';
        id = tenantId;
      }
      else if (referral){
        source = 'Referral'
        id = referral
      }; 
    mixpanel.identify(phoneNumber);
    mixpanel.track('Registration_Start', {
      'Source': source,
      'SourceID' : id
    });

    setIsLoading(true);
    const appVerifier = window.recaptchaVerifier;
    const phoneWithCode = `+91${phoneNumber}`;
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_NODE_BASE_URL}/user/send-otp`,
        {
          phoneNumber: phoneWithCode,
        }
      );
      const [child] = data.data;

      if(paymentLink){
        const childId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if(childId && token){
          navigate(`/checkout?planId=${planId}`);
          return;
        }
        else if(token){
          //signOut(firebaseAuth);
          localStorage.clear();
        }
          //add instrumentation

          MEASURE(
              INSTRUMENTATION_TYPES.PAYMENT_WITH_PHONENUMBER,
              phoneNumber,
              { tenantId: tenantId }
            );

          const confirmationResult = await signInWithPhoneNumber(
            firebaseAuth,
            phoneWithCode,
            appVerifier
          );
          window.confirmationResult = confirmationResult;
          localStorage.setItem("phoneNumber", phoneNumber);
          setIsOtpSent(true);
          setIsLoading(false);
          startTimer(30, () => {});
        return;
      }
      if (!child || !child.verifiedOTP ) {
        const confirmationResult = await signInWithPhoneNumber(
          firebaseAuth,
          phoneWithCode,
          appVerifier
        );
        window.confirmationResult = confirmationResult;
        localStorage.setItem("phoneNumber", phoneNumber);
        setIsOtpSent(true);
        setIsLoading(false);
        startTimer(30, () => {});
        return;
      }
      if (child.createdAt) {
        showToast("User already exist, please login");
        // localStorage.setItem("userId", child.id);
        signOut(firebaseAuth);
        localStorage.clear();
        setIsLoading(false);
        navigate("/login");
        return;
      }
      setIsLoading(false);
      localStorage.setItem("phoneNumber", phoneNumber);
      setIsPhoneVerified(true);
      // navigate('/register');
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      showToast(error.message);
    }
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    hideToast();
    // setErrorMessage('');
    // setIsError(false);
    const phoneWithCode = `+91${phoneNumber}`;
    try {
      const result = await window.confirmationResult.confirm(otp);
      if (result.user) {
        if(paymentLink){
          const idToken = await result.user.getIdToken();
          localStorage.setItem("token", idToken);
          setOtpVerified(true);
          setNavigatePayment(true);
          //setIsLoading(false);
        }
        else{
        const { data } = await axios.post(
          `${process.env.REACT_APP_NODE_BASE_URL}/user/save-verified-number`,
          {
            phoneNumber: phoneWithCode,
          }
        );
        const [child] = data.data;
        if (child.createdAt) {
          localStorage.setItem("userId", child.id);
          setIsLoading(false);
          navigate(redirectPath ?? "/lobby");
          return;
        }
        if (child.verifiedOTP) {
          localStorage.setItem("phoneNumber", phoneNumber);
          setIsLoading(false);
          setIsPhoneVerified(true);
          // navigate('/register');
        }
        }
      }
    } catch (error) {
      // setIsError(true);
      if (error.code === "auth/invalid-verification-code") {
        showToast("Invalid OTP, please try again");
      } else {
        showToast("Something went wrong, please try again");
      }
      setOTP("");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (val) => {
    setOTP(val);
  };

  const resendOtp = async () => {
    setIsLoading(true);
    hideToast();
    const appVerifier = window.recaptchaVerifier;
    const phoneWithCode = `+91${phoneNumber}`;
    const confirmationResult = await signInWithPhoneNumber(
      firebaseAuth,
      phoneWithCode,
      appVerifier
    );
    window.confirmationResult = confirmationResult;
    setIsOtpSent(true);
    setIsLoading(false);
    startTimer(30, () => {
      console.log("Timer completed");
    });
    return;
  };

  const renderTermsConditions = () => (
    <div className="text-white text-xs mb-3 text-center mx-8 mt-6">
      By signing up you agree to our&nbsp;
      <a href="/terms-and-conditions" className="text-primary-yellow">
        <span>T&C</span>
      </a>
      &nbsp;and&nbsp;
      <a href="/privacy-policy" className="text-primary-yellow">
        <span>Privacy Policy</span>
      </a>
    </div>
  );

   const renderHeader = () => {
     return (
       <div className="my-4 flex flex-col justify-center items-center text-white gap-4">
         <img
           src="/Assets/Images/logo-horizontal.svg"
           alt="logo-horizontal"
           className="h-8"
         />
         <div className="text-xl font-medium">Mini Online Olympiads</div>
       </div>
     );
   };


  const renderPhoneScreen = () => {
    return (
      <div className='w-[100vw] max-w-md' >
          {renderHeader()}
            <PhoneNumberInput
              onChange={onChangePhone}
              className="!text-base text-center max-w-xs"
              wrapperClassName="mb-4"
              placeholder="Enter mobile number"
              defaultValue={phoneNumber}
            />
        <div className={`flex flex-col items-center ${paymentLink ? 'p-4' : ''}`}>
          <AppButton
            id="send-otp-button"
            onClick={sendOtp}
            disabled={phoneNumber.length < 10 || isLoading}
            className="rounded-[115px] w-[216px] mb-4 h-12"
            isLoading={isLoading}
          >
            {isComingFromLobby ? 'Get OTP' : paymentLink ? 'Submit' : 'Register'}
          </AppButton>
          {!paymentLink && <div className="text-white text-center">
            <span
              className="font-medium text-sm"
              onClick={() => navigate("/enter-phone")}
            >
              Existing user?&nbsp;
              <span className="underline text-primary-yellow">
                Re-Enter Mobile Number
              </span>
            </span>
          </div>}
        </div>
        {!paymentLink && renderTermsConditions()}
      </div>
    );
  };

  if(!leadType){
  return (
    <Layout>
      <div className="flex flex-col h-full w-full">
        <div id="recaptcha-container"></div>
        <img
          src="/Assets/Images/cover-image.jpg"
          alt="boy"
          className={twMerge(
            "h-[50%] sm:h-[60%] sm:object-bottom object-cover object-center",
            isOtpSent ? "hidden md:block" : ""
          )}
        />
        <div className="max-w-md h-full m-auto">
        <div className={`flex flex-col items-center h-full ${paymentLink ? '' : 'justify-around'}`}>
            {isOtpSent ? (
              <OTPScreen
                handleOtpChange={handleOtpChange}
                isLoading={isLoading}
                onPhoneClick={() => {
                    setIsOtpSent(false);
                    setOTP("");
                  }
                }
                otp={otp}
                phoneNumber={phoneNumber}
                resendOtp={resendOtp}
                timer={timer}
                verifyOTPHandler={verifyOTP}
              />
            ) : (
              renderPhoneScreen()
            )}
          </div>
        </div>
      </div>
      <ToastComponent />
    </Layout>
  );
  }

  return (
    <Layout>
      <div className="flex flex-col w-full relative">
  <div id="recaptcha-container"></div>

  {/* QODHeader Component on top of the image */}
  <div className="absolute top-0 left-0 w-full">
    <QODHeader/>
  </div>

  <img
    src="/Assets/Images/cover-image.jpg"
    alt="boy"
    className={twMerge(
      "h-[50%] sm:h-[60%] sm:object-bottom object-cover object-center",
      isOtpSent ? "hidden block" : ""
    )}
  />
  <div className="max-w-md h-full m-auto">
    <div className={`flex flex-col items-center h-full ${paymentLink ? '' : 'justify-around'} `}>
      {isOtpSent ? (
        <OTPScreen
          handleOtpChange={handleOtpChange}
          isLoading={isLoading}
          onPhoneClick={() => {
            setIsOtpSent(false);
            setOTP("");
          }}
          otp={otp}
          phoneNumber={phoneNumber}
          resendOtp={resendOtp}
          timer={timer}
          verifyOTPHandler={verifyOTP}
        />
      ) : (
        renderPhoneScreen()
      )}
    </div>
  </div>
</div>
<ToastComponent />

    </Layout>)

};

export default VerifyPhonePage;
