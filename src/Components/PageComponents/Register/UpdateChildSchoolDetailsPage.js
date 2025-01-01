import { Controller, useForm } from "react-hook-form";
import Layout from "../../Common/Layout";
import AppInput from "../../Common/AppInput";
import { useEffect, useRef, useState } from "react";
import PhoneNumberInput from "../../Common/PhoneInput";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { db, firebaseAuth } from "../../../firebase-config";
import { useAuth } from "../../../providers/auth-provider";
import { GRADE_OPTIONS } from "../../../Constants/Commons";
import axios from "axios";
import AppButton from "../../Common/AppButton";
import SuccessRegistrationModal from "./SuccessRegistrationModal";
import { useNavigate } from "react-router-dom";
import OTPScreen from "./OTPScreen";
import useTimer from "../../../hooks/use-timer";
import useToast from "../../../hooks/use-toast";
import { LOBBY_ROUTE } from "../../../Constants/routes";
import AppCheckbox from "../../Common/AppCheckbox";
import { doc, setDoc } from "firebase/firestore";

const UpdateChildSchoolDetailsPage = () => {
    const navigate = useNavigate();
    const { user, logout, setDontShowUpdateDetails, getUserDetails } =
      useAuth();
    const { startTimer, timer } = useTimer();
    const { showToast, hideToast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
  } = useForm({});
  const [otp, setOTP] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);
  const [isDontShowAgain, setIsDontShowAgain] = useState(false);

  const phoneRef = useRef('');

  useEffect(() => {
    if (user.grade) {
      const findGrade = GRADE_OPTIONS.find( grade => +grade.value === user.grade);
      setValue("grade", findGrade.label);
      setValue("school", user.school);
      setValue("city", user.city);
    }
    const phone = localStorage.getItem("phoneNumber");
    if (user.id && !user.grade && phone) {
      setIsRegisterSuccess(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
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
    // update user with dontShowUpdateDetails
    const userRef = doc(db, "children", user.id);
    await setDoc(
      userRef,
      { dontShowUpdateDetails: isDontShowAgain },
      { merge: true }
    );
    getUserDetails();
    const phone = localStorage.getItem("phoneNumber");
    if (!phoneRef.current && !phone) {
      setDontShowUpdateDetails(true);
      navigate(LOBBY_ROUTE, { replace: true });
      return;
    }
    localStorage.setItem("phoneNumber", phoneRef.current);
    const appVerifier = window.recaptchaVerifier;
    const phoneWithCode = `+91${phoneNumber}`;
    try {
      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth,
        phoneWithCode,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      // setIsLoading(false);

      startTimer(30, () => {});
    } catch (error) {}
  };

  const handleDialogClose = async (event, reason) => {
    if (reason && reason === "backdropClick") return;
    localStorage.removeItem("phoneNumber");
    await logout();
    setIsRegisterSuccess(false);
    const url = "/login";
    navigate(url, { replace: true });
  };

  const handleOtpChange = (val) => {
    setOTP(val);
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
        const { data } = await axios.post(
          `${process.env.REACT_APP_NODE_BASE_URL}/user/update-child-school`,
          {
            phoneNumber: phoneWithCode,
            parentName: getValues("parentName"),
          }
        );
        if (data.data) {
            setIsLoading(false);
            setIsRegisterSuccess(true);
          return;
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

    const resendOtp = async () => {
      setIsLoading(true);
      hideToast();
      const appVerifier = window.recaptchaVerifier;
      const phone = localStorage.getItem("phoneNumber");
      const phoneWithCode = `+91${phone}`;
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

  const renderDetailsForm = () => (
    <>
      <div className="flex flex-col justify-around px-9 mb-4 h-full w-full max-w-lg md:gap-[8%]">
        <div>
          <PhoneNumberInput
            onChange={(phone) => {
              phoneRef.current = phone;
              setPhoneNumber(phone);
            }}
            className="!text-base text-center max-w-xs"
            placeholder="Please share your phone number"
            label="Phone Number"
            showLabel
          />
        </div>
        <div>
          <Controller
            name="parentName"
            control={control}
            rules={{
              maxLength: {
                value: 50,
                message: "Maximum 50 characters allowed",
              },
            }}
            render={(renderProps) => {
              const { field } = renderProps;
              return (
                <AppInput
                  {...field}
                  wrapperClassName="items-start"
                  className="text-center !text-base"
                  id={field.name}
                  showLabel
                  label="Parent's Name"
                  placeholder="Please share your parent's name"
                  maxLength={50}
                  error={
                    errors && errors.parentName && errors.parentName.message
                  }
                />
              );
            }}
          />
        </div>
        <div>
          <Controller
            name="grade"
            control={control}
            rules={{
              required: "Class/Grade is required",
            }}
            render={(renderProps) => {
              const { field } = renderProps;
              return (
                <AppInput
                  {...field}
                  wrapperClassName="items-start"
                  className="text-center !text-base"
                  id={field.name}
                  showLabel
                  label="Class/Grade"
                  maxLength={50}
                  error={errors && errors.grade && errors.grade.message}
                  disabled
                />
              );
            }}
          />
        </div>
        <div className="relative">
          <Controller
            name="school"
            control={control}
            rules={{
              required: "School is required",
            }}
            render={(renderProps) => {
              const { field } = renderProps;
              return (
                <AppInput
                  {...field}
                  wrapperClassName="items-start"
                  className="text-center !text-base"
                  id={field.name}
                  showLabel
                  label="School"
                  autoComplete="off"
                  error={errors && errors.school && errors.school.message}
                  // isAutocomplete={!tenantId}
                  disabled
                  items={[]}
                />
              );
            }}
          />
        </div>
        <div>
          <Controller
            name="city"
            control={control}
            rules={{
              required: "City/Region is required",
            }}
            render={(renderProps) => {
              const { field } = renderProps;
              return (
                <AppInput
                  {...field}
                  wrapperClassName="items-start"
                  className="text-center !text-base"
                  id={field.name}
                  showLabel
                  label="City"
                  maxLength={50}
                  error={errors && errors.city && errors.city.message}
                  disabled
                />
              );
            }}
          />
        </div>
      </div>
      <AppButton
        id="send-otp-button"
        type="submit"
        className="self-center md:mt-[20%]"
        disabled={
          isSubmitting || (phoneNumber.length && phoneNumber.length < 10)
        }
        isLoading={isSubmitting}
      >
        Proceed
      </AppButton>
      {user?.dontShowUpdateDetails !== undefined ? (
        <AppCheckbox
          id="dontShowAgain"
          // value={isDontShowAgain}
          onChange={(e) => setIsDontShowAgain(e.target.checked)}
          containerClassName="items-center"
          className=""
          checked={isDontShowAgain}
          label={
            <div className="text-white mt-1 text-center ml-1">
              Don't show this again
            </div>
          }
        />
      ) : (
        <></>
      )}
    </>
  );

  return (
    <Layout>
      <div className="flex flex-col items-center md:justify-center h-full text-white min-w-[320px] py-6 overflow-auto">
        <div id="recaptcha-container"></div>
        <div className="text-2xl font-extrabold text-primary-yellow mb-4 text-center">
          Welcome to maidaan!
          <div className="mb-9 text-white text-base">
            Fill in these details to get you started!
          </div>
        </div>

        <form
          onSubmit={handleSubmit(sendOtp)}
          className="w-full gap-2 h-full md:h-auto grid place-items-center"
        >
          {isOtpSent ? (
            <OTPScreen
              handleOtpChange={handleOtpChange}
              isLoading={isLoading}
              otp={otp}
              phoneNumber={phoneNumber}
              verifyOTPHandler={verifyOTP}
              resendOtp={resendOtp}
              timer={timer}
              onPhoneClick={() => {
                setIsOtpSent(false);
                setOTP("");
              }}
              hidePhoneChange
            />
          ) : (
            renderDetailsForm()
          )}
          {/* {errorMessage ? (
            <div className="text-red-500">{errorMessage}</div>
          ) : (
            <></>
          )} */}
        </form>
      </div>
      <SuccessRegistrationModal
        open={isRegisterSuccess}
        handleDialogClose={handleDialogClose}
      />
    </Layout>
  );
};

export default UpdateChildSchoolDetailsPage;