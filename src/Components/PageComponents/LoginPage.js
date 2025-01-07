import axios from 'axios';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { firebaseAuth } from '../../firebase-config';
import useToast from '../../hooks/use-toast';
import { MEASURE } from '../../instrumentation';
import { INSTRUMENTATION_TYPES } from '../../instrumentation/types';
import AppButton from '../Common/AppButton';
import AppInput from '../Common/AppInput';
import Layout from '../Common/Layout';
import PasswordInput from '../Common/PasswordInput';
import PhoneNumberInput from '../Common/PhoneInput';
import { login } from '../../services/child';
import { db } from '../../firebase-config';
import { setDoc, doc, addDoc, collection } from 'firebase/firestore';
import mixpanel from 'mixpanel-browser';
import { DEMO_REGISTRATION_TOURNAMENTS, calculateAppHeight, getDemoRoundOneData } from '../../Constants/Commons';
import { QODHeader } from './QuestionOftheDay/QODHeader';
import { Dialog } from '@mui/material';

const LoginPage = ({ isDemoGameInput = false }) => {
  const navigate = useNavigate();
  const { ToastComponent, hideToast, showToast } = useToast();
  const [searchParams] = useSearchParams();
  const redirectPathAfterLogin = searchParams.get('redirect') ?? '/lobby';
  const isDemoGame = searchParams.get('d') === 'Y' || isDemoGameInput;
  const hideSignup = searchParams.get('s') === '0';
  const group = searchParams.get('group') ?? '';
  const leadType = searchParams.get('l');

  const demoFlowUrl = `/chat?tId=Demo_Pitch_A&back=lobby&d=S`;
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [letsGoLoading, setLetsGoLoading] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isLoading, isSubmitting },
  } = useForm({ phoneNumber: '', password: '' });
  const [localUserId, setLocalUserId] = useState('');

  useEffect(() => {
    if (isDemoGame) {
      calculateAppHeight();
    }
    const phone = localStorage.getItem('phoneNumber');
    if (phone) {
      setValue('phoneNumber', phone);
    }
    const userId = localStorage.getItem('userId');
    if (userId && userId !== 'null') {
      navigate(redirectPathAfterLogin);
    }
  }, []);

  const handleLogin = async (formData) => {
    hideToast();
    if (isDemoGame) {
      setLetsGoLoading(true);
      MEASURE(INSTRUMENTATION_TYPES.DEMO_LOGIN, localUserId, {});
      localStorage.setItem('userId', localUserId);
      mixpanel.identify(localUserId);
      mixpanel.track('Login', {
        LoginType: 'Demo',
      });
      let url = '/tournament-lobby?d=Y';
      if (group) {
        url += `&group=${group}`;
      }
      const tournamdentIDs = DEMO_REGISTRATION_TOURNAMENTS;
      if (isDemoGameInput) {
        url = '/lobby-demo?d=S';
        const docRef = await addDoc(collection(db, 'children'), {
          firstName: localUserId,
          lastName: '',
          createdAt: new Date(),
          currentSubscription: {
            plan: 'FREE',
          },
          tenantIds: ['maidaan'],
          grade: 6,
          registrations: tournamdentIDs,
        });

        localStorage.setItem('userId', docRef.id);
        localStorage.setItem('firstName', localUserId);

        const registrationPromises = tournamdentIDs.map((tournamentId) =>
          setDoc(
            doc(db, 'tournaments', tournamentId, 'registrations', docRef.id),
            {
              childId: docRef.id,
              createdAt: new Date(),
            },
            { merge: true }
          )
        );

        const leaderboardPromise = setDoc(
          doc(db, 'tournaments', 'Demo_Pitch_A', 'leaderboard', docRef.id),
          {
            attempts: [12],
            correctAttempts: [10],
            daysPlayed: [new Date()],
            firstName: localUserId,
            grade: 6,
            lastName: '',
            round: ['1'],
            score: [10],
          }
        );

        const data = getDemoRoundOneData();
        const gameDocPromise = addDoc(collection(db, 'children', docRef.id, 'games'), {
          ...data,
        });

        await Promise.all([
          ...registrationPromises,
          leaderboardPromise,
          gameDocPromise,
        ]);
      }
      await signInAnonymously(firebaseAuth);
      setLetsGoLoading(false);
      if (isDemoGameInput) {
        setShowDemoPopup(true);
      } else {
        navigate(url);
      }
      calculateAppHeight();
      return;
    }
    const phoneWithCode = `+91${formData.phoneNumber}`;
    MEASURE(INSTRUMENTATION_TYPES.LOGIN, phoneWithCode, {});
    try {
      const data = await login({
        phoneNumber: phoneWithCode,
        password: formData.password,
      });
      const { id, token, verifiedOTP } = data;
      const userCredentials = await signInWithCustomToken(firebaseAuth, token);
      if (userCredentials.user.uid) {
        localStorage.setItem('userId', id);
        mixpanel.identify(id);
        mixpanel.track('Login', {
          LoginType: 'Main',
        });
        if (!verifiedOTP) {
          navigate(`/register?source=lobby&redirect=${redirectPathAfterLogin}`);
          return;
        }
        await updateQODResponseDoc(id);
        navigate(redirectPathAfterLogin, { replace: true, state: { from: 'login' } });
      } else {
        showToast('Something went wrong. Please try again');
      }
    } catch (error) {
      showToast(error.response.data.message);
    }
  };

  const updateQODResponseDoc = async (userId) => {
    const qodResponseDocId = localStorage.getItem('QODResponseDocumentId');
    if (qodResponseDocId || !userId) {
      await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/questionOfTheDay/update-response-doc`, {
        userId,
        qodResponseDocId,
      });
    }
  };

  const goToforgotPassword = () => {
    navigate('/forgot-password');
  };

  const renderHeader = () => (
    <div className="my-4 flex flex-col justify-center items-center text-white gap-4">
      <img
        src="/Assets/Images/logo-horizontal.svg"
        alt="logo-horizontal"
        className="h-8"
      />
    </div>
  );

  const renderDemoFlowPopup = () => (
    <Dialog
      open={showDemoPopup}
      onClose={() => {
        window.location.href = demoFlowUrl;
      }}
      className="register-success"
    >
      <div className="relative flex flex-col bg-primary-gray-20 text-white h-full overflow-hidden py-6 px-6 text-base">
        <ul className="my-6 mx-0 flex flex-col gap-4 p-0">
          <p className="my-2 mx-0 text-center text-[18px] text-[#ccf900]">
            SITUATION BRIEF
          </p>
          <p className="my-2 mx-0 text-start">
            <strong>You're representing DPS</strong> in Maidaan's Pune Masterminds. Round 1 is done & <strong>Round 2 is LIVE</strong>.
          </p>
          <p className="my-2 mx-0 text-start">
            <strong>Score &gt; 10</strong> here to finish in the Top 5 of your pool & <strong>qualify for the finals</strong>.
          </p>
          <p className="my-2 mx-0 text-start">All set?</p>
        </ul>

        <div className="flex items-center justify-center w-full h-full">
          <AppButton
            onClick={() => {
              window.location.href = demoFlowUrl;
            }}
            className="rounded-[115px] min-w-[100px] h-[35px] min-h-[35px] self-center items-center"
          >
            Understood
          </AppButton>
        </div>
      </div>
    </Dialog>
  );

  const renderMaidaanHeader = () => (
    <div className="my-4 flex flex-col justify-center items-center text-white gap-4 mt-16 md:mt-4">
      <img
        src="/Assets/Images/logo-horizontal.svg"
        alt="logo-horizontal"
        className="h-8"
      />
      <div className="text-l font-medium ">Mini Online Olympiads</div>
    </div>
  );

  const renderTermsConditions = () => (
    <div className="text-white text-xs mb-3 text-center mx-3 mt-3">
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

  const renderLoginScreen = () => (
    <div className="flex flex-col items-center justify-around h-full">
      {renderMaidaanHeader()}
      <div className="flex flex-col gap-4 justify-center items-center mx-8 w-full max-w-xs">
        {isDemoGame ? (
          <>
            <div className="w-full flex flex-col gap-8">
              <AppInput
                onChange={setLocalUserId}
                value={localUserId}
                placeholder="Enter your name to play a demo"
                className="text-center"
              />
              <AppButton
                type="button"
                className="self-center w-[128px] md:w-[216px]"
                disabled={!localUserId}
                onClick={handleLogin}
                isLoading={letsGoLoading}
              >
                Let's Go
              </AppButton>
            </div>
            {renderTermsConditions()}
          </>
        ) : (
          <>
            <form
              onSubmit={handleSubmit(handleLogin)}
              className="w-full flex flex-col gap-3"
            >
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  required: 'Phone number is required',
                  maxLength: {
                    value: 10,
                    message: 'Please enter 10 digit phone number',
                  },
                }}
                render={(renderProps) => {
                  const { field } = renderProps;
                  return (
                    <PhoneNumberInput
                      {...field}
                      className="!text-base text-center"
                      wrapperClassName="mb-4"
                      placeholder="Enter Phone Number"
                      error={
                        errors &&
                        errors.phoneNumber &&
                        errors.phoneNumber.message
                      }
                    />
                  );
                }}
              />
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Password is required',
                }}
                render={(renderProps) => {
                  const { field } = renderProps;
                  return (
                    <PasswordInput
                      {...field}
                      className="!text-base text-center"
                      wrapperClassName="mb-4"
                      placeholder="Enter Password"
                      error={
                        errors &&
                        errors.password &&
                        errors.password.message
                      }
                    />
                  );
                }}
              />
              <AppButton
                type="submit"
                className="self-center w-[216px] h-12"
                disabled={!isValid || isSubmitting || isLoading}
                isLoading={isSubmitting}
              >
                Login
              </AppButton>
            </form>
            <div className="text-white">
              <span>Forgot Password?&nbsp;</span>
              <span
                className="text-primary-yellow underline cursor-pointer"
                onClick={goToforgotPassword}
              >
                Regenerate
              </span>
            </div>
          </>
        )}
        {!isDemoGameInput && (
          <div className="h-full flex flex-col items-center gap-4 mt-2">
            {isDemoGame ? (
              <div className="text-white">
                Already have an account?&nbsp;
                <span
                  className="text-primary-yellow underline"
                  onClick={() => navigate('/login')}
                >
                  Login
                </span>
              </div>
            ) : (
              <></>
            )}
            {!hideSignup && (
              <div className="text-white">
                {isDemoGame ? 'Register for Tournaments?' : 'New to Maidaan?'}
                &nbsp;
                <span
                  className="text-primary-yellow underline cursor-pointer"
                  onClick={() => navigate('/register')}
                >
                  Sign up
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (showDemoPopup) {
    return (
      <Layout>
        <div className="h-full w-full">{renderDemoFlowPopup()}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col w-full relative">
        {!!leadType && (
          <div className="absolute top-0 left-0 w-full">
            <QODHeader />
          </div>
        )}

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
    </Layout>
  );
};

export default LoginPage;
