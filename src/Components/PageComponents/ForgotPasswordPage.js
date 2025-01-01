import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useToast from '../../hooks/use-toast';
import { MEASURE } from '../../instrumentation';
import { INSTRUMENTATION_TYPES } from '../../instrumentation/types';
import AppButton from '../Common/AppButton';
import Layout from '../Common/Layout';
import PhoneNumberInput from '../Common/PhoneInput';
import { forgotPassword } from '../../services/child';
import { Dialog } from '@mui/material';
import mixpanel from 'mixpanel-browser';
import axios from 'axios';
import { signInWithPhoneNumber, signOut, RecaptchaVerifier } from 'firebase/auth';
import { firebaseAuth } from '../../firebase-config';
import useTimer from '../../hooks/use-timer';
import OTPScreen from './Register/OTPScreen';
import SuccessRegistrationModal from './Register/SuccessRegistrationModal';
import { generatePasswordString } from '../utils';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { startTimer, timer } = useTimer();
  const { ToastComponent, hideToast, showToast } = useToast();
  // eslint-disable-next-line no-unused-vars
  const [searchParams, _] = useSearchParams();

  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loadSendingOtp, setLoadSendingOtp] = useState(false);
  const [otp, setOTP] = useState('');
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isLoading, isSubmitting },
  } = useForm({ phoneNumber: "", password: "" });

  useEffect(() => {
    const phone = localStorage.getItem("phoneNumber");
    if (phone) {
      setPhoneNumber(phone);
    }
    window.recaptchaVerifier = new RecaptchaVerifier(
      'send-otp-button',
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

  const handleLogin = async (formData) => {
    hideToast();
    const { phoneNumber } = formData;
    setPhoneNumber(phoneNumber);
    const phoneWithCode = `+91${phoneNumber}`;
    MEASURE(INSTRUMENTATION_TYPES.FORGOT_PASSWORD, phoneWithCode, {});
    try {
      const data = await forgotPassword({
        phoneNumber: phoneNumber,
      });
      if (data) {
        setIsSuccess(true);
      }
    } catch (error) {
      showToast(error.response.data.message);
    }
  };

  const handleDialogClose = () => {
    setIsContactDialogOpen(c => !c);
  };

  const renderHeader = () => {
    return (
      <div className="my-4 flex flex-col justify-center items-center text-white gap-4">
        <img
          src="/Assets/Images/logo-horizontal.svg"
          alt="logo-horizontal"
          className="h-8"
        />
      </div>
    );
  };

  const sendOtp = async (tenantId = '', referral = false) => {
    setLoadSendingOtp(true);
    if (phoneNumber.length < 10) return;
    let source = 'Open';
    let id = 'NA'
    if (!!tenantId) {
      source = 'School';
      id = tenantId;
    }
    else if (referral) {
      source = 'Referral'
      id = referral
    };
    mixpanel.identify(phoneNumber);
    mixpanel.track('Registration_Start', {
      'Source': source,
      'SourceID': id
    });
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
      const password = generatePasswordString(child.firstName, phoneNumber);

      setGeneratedPassword(password);
      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth,
        phoneWithCode,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      localStorage.setItem("phoneNumber", phoneNumber);
      setIsOtpSent(true);
      setLoadSendingOtp(false);
      return;
    } catch (error) {
      console.error(error);
      showToast(error.message);
    }
  };

  const resendOtp = async () => {
    // setIsLoading(true);
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
    // setIsLoading(false);
    startTimer(30, () => {
      console.log("Timer completed");
    });
    return;
  };

  const renderSuccessDialog = () => {
    return (
      <Dialog open={isSuccess} className="register-success" slotProps={{
        backdrop: {
          style: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
        },
      }}>
        <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
          <span className="text-center">
            Credentials sent successfully to your WhatsApp.
          </span>
          <div className="flex flex-col items-center justify-center gap-4 ">
            <AppButton
              type="button"
              className="self-center z-10 min-w-[150px]"
              onClick={() => navigate('/login')}
            >
              Message Received
            </AppButton>

            <AppButton
              type="button"
              variant="secondary"
              className="self-center z-10 min-w-[150px]"
              onClick={() => sendOtp()}
              isLoading={loadSendingOtp}
            >
              Not received
            </AppButton>
          </div>
        </div>
      </Dialog>
    );
  };


  const renderContactDialog = () => {
    return (
      <Dialog open={isContactDialogOpen} className="register-success">
        <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
          <span className="text-lg md:text-xl font-medium text-center text-primary-yellow">
            Call us at<br />+918618006284
          </span>
          <span className="text-sm text-center">
            We are available between 9 am and 9 pm
          </span>
          <AppButton
            type="button"
            className="self-center z-10"
            onClick={handleDialogClose}
          >
            Okay
          </AppButton>
        </div>
      </Dialog>
    );
  };


  const renderLoginScreen = () => {
    return (
      <div className="flex flex-col items-center justify-around h-full">
        {renderHeader()}
        <div className="flex flex-col gap-4 justify-center items-center mx-8 w-full max-w-xs text-center">
          <div>
            <span className="text-white text-xl">Regenerate Password</span>
          </div>
          <form
            onSubmit={handleSubmit(handleLogin)}
            className="w-full flex flex-col gap-2"
          >
            <Controller
              name="phoneNumber"
              control={control}
              rules={{
                required: "Phone number is required",
                maxLength: {
                  value: 10,
                  message: "Please enter 10 digit phone number",
                },
              }}
              render={(renderProps) => {
                const { field } = renderProps;
                return (
                  <PhoneNumberInput
                    {...field}
                    className="!text-base text-center"
                    wrapperClassName="mb-4"
                    placeholder="Registered Phone Number"
                    //  showLabel
                    //  label="Phone number"
                    //  labelClassName="text-white"
                    error={
                      errors && errors.phoneNumber && errors.phoneNumber.message
                    }
                  />
                );
              }}
            />
            <AppButton
              type="submit"
              className="self-center h-12 w-[216px]"
              disabled={!isValid || isSubmitting || isLoading}
              isLoading={isSubmitting}
            >
              Receive on WhatsApp
            </AppButton>
          </form>
          <div className="h-full flex flex-col items-center gap-4 mt-2 text-white">
            <div>
              Don't have WhatsApp?{" "}
              <span
                className="text-primary-yellow underline"
                onClick={() => setIsContactDialogOpen(true)}
              >
                Contact Us
              </span>
            </div>
            <div>
              <span
                className="text-primary-yellow underline"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleOtpChange = (val) => {
    setOTP(val);
  };

  const verifyOTP = async () => {
    // setIsLoading(true);
    hideToast();

    setVerifyOtpLoading(true);

    try {
      const result = await window.confirmationResult.confirm(otp);
      if (result.user) {
        setShowPasswordPopup(true);
      }
    } catch (error) {
      // setIsError(true);
      if (error.code === "auth/invalid-verification-code") {
        showToast("Invalid OTP, please try again");
      } else {
        showToast("Something went wrong, please try again");
      }
      setOTP("");
      setVerifyOtpLoading(false);
    }

    setVerifyOtpLoading(false);
  };

  if (isOtpSent) {
    return (
      <Layout>
        <OTPScreen
          handleOtpChange={handleOtpChange}
          isLoading={verifyOtpLoading}
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
        <SuccessRegistrationModal
          open={showPasswordPopup}
          handleDialogClose={() => navigate('/login')}
          password={generatedPassword}
          isForgotPassword={true}
        />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col h-full w-full">
        <img
          src="/Assets/Images/cover-image.jpg"
          alt="boy"
          className="h-[50%] sm:h-[60%] sm:object-bottom object-cover object-center"
        />
        <div className="max-w-md h-full w-full m-auto">
          <div className="flex flex-col justify-between h-full w-full">
            {renderLoginScreen()}
          </div>
        </div>
      </div>
      <ToastComponent />
      {renderContactDialog()}
      {renderSuccessDialog()}
      <div id="send-otp-button"></div>
    </Layout>
  );
};

export default ForgotPasswordPage;