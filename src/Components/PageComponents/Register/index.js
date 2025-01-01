import { Dialog } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_TENANT_ID, getDatefromFirebaseTimeStamp, getWhatsappMessageForInvite, GRADE_OPTIONS, shareOnWhatsapp, gameTypes } from '../../../Constants/Commons';
import AppButton from '../../Common/AppButton';
import AppInput from '../../Common/AppInput';
import AppSelect from '../../Common/AppSelect';
import Layout from '../../Common/Layout';
import TournamentScreen from './TournamentScreen';
import VerifyPhonePage from './VerifyPhone';
import Lottie from "lottie-react";
import confettiAnimation from "../../../assets/animations/confetti.json";
import { checkReferralCode, registerChildService } from '../../../services/child';
import { addChildToTournament, getTournaments } from '../../../services/tournament';
import { useAuth } from '../../../providers/auth-provider';
import { getAllTenants, getTenantDetails } from '../../../services/tenant';
import { twMerge } from 'tailwind-merge';
import mixpanel from 'mixpanel-browser';
import SuccessRegistrationModal from './SuccessRegistrationModal';
import { QODHeader } from '../QuestionOftheDay/QODHeader';
import { generatePasswordString } from '../../utils';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    // eslint-disable-next-line no-unused-vars
    const [searchParams, _] = useSearchParams();
    const registerSource = searchParams.get("source");
    const tenantId = searchParams.get("tenantId");
    const referralCode = searchParams.get("referralCode");
    const leadType = searchParams.get("l");
    const teacherLead = searchParams.get("l") === "T";
    const studentLead = searchParams.get("l") === "S";
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isPhoneVerified, setIsPhoneVerified] = React.useState(false);
    const [isRegisterSuccess, setIsRegisterSuccess] = React.useState(false);
    const [tournaments, setTournaments] = React.useState([]);
    const [isTournamentLoading, setIsTournamentLoading] =
      React.useState(false);
    const [isTournamentScreen, setIsTournamentScreen] =
      React.useState(false);
    const [registeredChildId, setRegisteredChildId] = React.useState('');
    const [registeredChildData, setRegisteredChildData] = React.useState(null);
    const [selectedTournament, setSelectedTournament] = React.useState(null);
    const [tenantDetails, setTenantDetails] = React.useState(null);
    const [isReferralCodeValid, setIsReferralCodeValid] =
      React.useState(false);
    const [openReferralDialog, setOpenReferralDialog] = React.useState(false);
    const [openSuccessDialog, setOpenSuccessDialog] = React.useState(false);
    const [firstOpenTournament, setFirstOpenTournament] = React.useState(null);
    const [allTenants, setAllTenants] = React.useState([]);
    const [selectedMedium, setSelectedMedium] = React.useState('english');
    const [isTenantSchoolSelected, setIsTenantSchoolSelected] = React.useState(false);
    const designationOptions = [
      { label: "Director", value: "Director" },
      { label: "Owner/Trustee", value: "OwnerTrustee" },
      { label: "Principal", value: "Principal" },
      { label: "Teacher", value: "Teacher" },
    ]; 

    const isValidRegisterSource = ["lobby", "new"].includes(registerSource);
    const {
      control,
      handleSubmit,
      formState: { errors, isSubmitting },
      setValue,
    } = useForm({});

    useEffect(() => {
      const userId = localStorage.getItem("userId");
      if (!isValidRegisterSource && user && userId === user.id) {
        navigate('/lobby');
      }
      const fetchAllTenants = async () => {
        const data = await getAllTenants();
        setAllTenants(data);
      };
      fetchAllTenants();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (tenantId && tenantId !== DEFAULT_TENANT_ID) {
        const fetchTenantDetails = async () => {
          const tenantDetails = await getTenantDetails(tenantId);
          setTenantDetails(tenantDetails);
          if (!Array.isArray(tenantDetails.name)) {
            setValue("school", tenantDetails.name);
          } else if (tenantDetails.name.length === 1) {
            setValue("school", tenantDetails.name[0]);
          }
          if (!Array.isArray(tenantDetails.location)) {
            setValue("city", tenantDetails.location);
          } else if (tenantDetails.location.length === 1) {
            setValue("city", tenantDetails.location[0]);
          }
        };
        fetchTenantDetails();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId]);

    useEffect(() => {
      if (referralCode) {
        const fetchReferralCode = async () => {
          const isReferralCodeValid = await checkReferralCode({ referralCode });
          if (isReferralCodeValid) {
            setIsReferralCodeValid(true);
          } else {
            setOpenReferralDialog(true);
          }
        };
        fetchReferralCode();
      }
    }, [referralCode]);

    const isSchoolArray = Array.isArray(tenantDetails?.name) && tenantDetails?.name.length > 1;
    const isCityArray = Array.isArray(tenantDetails?.location) && tenantDetails?.location.length > 1;

    const gradeOptions = useMemo(() => {
      if (tenantDetails) {
        const { grades } = tenantDetails;
        const filteredGrades = GRADE_OPTIONS.filter((grade) =>
          grades.includes(+grade.value)
        );
        return filteredGrades;
      }
        return GRADE_OPTIONS;
    }, [tenantDetails]);

    const schoolOptions = useMemo(() => {
      if (tenantDetails) {
        const { name } = tenantDetails;
        if (Array.isArray(name)) {
          return name.map((school) => ({ label: school, value: school }));
        }
      }
      return [];
    }, [tenantDetails]);

    const cityOptions = useMemo(() => {
      if (tenantDetails) {
        const { location } = tenantDetails;
        if (Array.isArray(location)) {
          return location.map((city) => ({ label: city, value: city }));
        }
      }
      return [];
    }, [tenantDetails]);

    const isMaidaanTenant = !tenantId || (tenantId && tenantId === DEFAULT_TENANT_ID);

    const fetchTournaments = async (grade) => {
        setIsTournamentLoading(true);
        const data = await getTournaments(grade);
        setIsTournamentLoading(false);
        return data;
    };

    const handleRegister = async (formData) => {
      
      for (const key in formData) {
        if (Object.hasOwnProperty.call(formData, key)) {
            // Trim the value associated with the current key
            formData[key] = formData[key].trim();
        }
      }
      setErrorMessage('');
      const phoneNumber = localStorage.getItem('phoneNumber');
      const phoneWithCode  = `+91${phoneNumber}`;
      let eloScore ={} ;
      let source = 'Open';
      let id = 'NA' 
      if(tenantId){
        source = 'School';
        id = tenantId;
      }
      else if (referralCode){
        source = 'Referral'
        id = referralCode
      };
      mixpanel.identify(phoneNumber);
      mixpanel.track('Registration_Complete', {
        'Source': source,
        'SourceID' : id
      });
      
      gameTypes.forEach((gameType) => {
        eloScore[gameType] = 1000;
      });
      let finalData = {
        ...formData,
        phoneNumber: phoneWithCode,
        ...(tenantId ? { tenantId } : {}),
        ...(referralCode && isReferralCodeValid
          ? { referredBy: referralCode }
          : {}),
          eloScore,
      };
      
      if (isTenantSchoolSelected) {
        finalData.tenantId = formData.school;
        const school = allTenants.find(
          (tenant) => tenant.id === formData.school
        );
        finalData.school = school.name;
      }

      if(!!teacherLead){
        finalData.grade = 15;
        finalData.parentName = 'faculty';
        finalData.mediumOfInstruction = selectedMedium;
        finalData.schoolLead = true;
      }
      if(!!studentLead){
        finalData.schoolLead = true;
      }

      // remove undefined values from finalData
      Object.keys(finalData).forEach(
        (key) => !finalData[key] && delete finalData[key]
      );
      try {
          const { id, createdAt, firstOpenTournament, ...rest } = await registerChildService(finalData);
          if (createdAt) {
            setRegisteredChildId(id);

            setRegisteredChildData({ ...rest });
            //localStorage.setItem("userId", id);
            if(!!leadType){
              setOpenSuccessDialog(true);
            }
            else{
              localStorage.setItem("userId", id);
              if (!firstOpenTournament) {
                setIsRegisterSuccess(true);
                return;
              };
              setIsTournamentScreen(true);
              setFirstOpenTournament(firstOpenTournament);
            }
            // if(tournaments.length === 0){
            //     setIsRegisterSuccess(true);
            //     selectedTournament(false);
            // }
          }
      } catch (error) {
          setErrorMessage(error.response.data.message);
      }
    };

    const handleGradeChange = async (value) => {
        const numberValue = Number(value);
        setValue('grade', numberValue);
        if (!isMaidaanTenant) {
          return;
        }
        const tournamentsData = await fetchTournaments(numberValue);
        const uniqueSubjects = [
          ...new Set(tournamentsData.map((tournament) => tournament.subject)),
        ];
        const filteredTournaments = uniqueSubjects.map((subject) => {
          const subjectTournaments = tournamentsData.filter(
            (tournament) => tournament.subject === subject
          );
          const nearestStartDate = subjectTournaments.reduce(
            (prev, current) => {
              const prevStartDate = getDatefromFirebaseTimeStamp(
                prev.startDate
              );
              const currentStartDate = getDatefromFirebaseTimeStamp(
                current.startDate
              );
              return prevStartDate < currentStartDate ? prev : current;
            }
          );
          return nearestStartDate;
        });
        setSelectedTournament(filteredTournaments[0]);
        setTournaments(filteredTournaments);
    };

    const handleDialogClose = async (event, reason) => {
      if (reason && reason === "backdropClick") return;
      setIsRegisterSuccess(false);
      localStorage.clear();
      const url = isMaidaanTenant ? "/login" : "/login?s=0";
      navigate(url, { replace: true });
    };

    const handleShare = async () => {
      try {
        const location = window.location;
        const registerUrl = `${location.protocol}//${location.host}/register?referralCode=${registeredChildData?.referralCode}`;
        const whatsappMsg = getWhatsappMessageForInvite(registerUrl);
        await shareOnWhatsapp(whatsappMsg);
      } catch (err) {
        console.log(err);
      }
    };


    const renderDetailsForm = () => (
      <div className="flex flex-col justify-around px-9 mb-4 h-full w-full max-w-lg md:gap-[8%]">
        <div>
          <Controller
            name="firstName"
            control={control}
            rules={{
              required: "First Name is required",
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
                  id={field.firstName}
                  showLabel
                  label="First Name"
                  maxLength={50}
                  error={errors && errors.firstName && errors.firstName.message}
                />
              );
            }}
          />
        </div>
        <div>
          <Controller
            name="lastName"
            control={control}
            rules={{
              required: "Last Name is required",
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
                  id={field.lastName}
                  showLabel
                  label="Last Name"
                  maxLength={50}
                  error={errors && errors.lastName && errors.lastName.message}
                />
              );
            }}
          />
        </div>
        {!teacherLead && <div>
          <Controller
            name="parentName"
            control={control}
            rules={{
              required: "Parent's name is required",
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
                  maxLength={50}
                  error={
                    errors && errors.parentName && errors.parentName.message
                  }
                />
              );
            }}
          />
        </div>}
        {teacherLead && <div>
          <Controller
          name="designation"
          control={control}
          rules={{
            required: "Designation is required",
          }}
          render={(renderProps) => {
            const { field } = renderProps;
            return (
              <AppSelect
                {...field}
                options={designationOptions}
                wrapperClassName="items-start"
                placeholder="Director"
                showLabel
                label="Designation"
                id={field.name}
                onChange={(value) => {
                  field.onChange(value);
                }}
                error={errors && errors.grade && errors.grade.message}
              />
            );
          }}
        />
      </div>}
       { !teacherLead &&<div>
          <Controller
            name="grade"
            control={control}
            rules={{
              required: "Class/Grade is required",
            }}
            render={(renderProps) => {
              const { field } = renderProps;
              return (
                <AppSelect
                  {...field}
                  options={gradeOptions}
                  wrapperClassName="items-start"
                  placeholder="Select class/grade"
                  showLabel
                  label="Class/Grade"
                  id={field.name}
                  onChange={(value) => {
                    handleGradeChange(value);
                    field.onChange(value);
                  }}
                  error={errors && errors.grade && errors.grade.message}
                />
              );
            }}
          />
        </div>}
        <div className="relative">
          {!isSchoolArray ? (
            <>
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
                      isAutocomplete={!tenantId}
                      disabled={!isMaidaanTenant}
                      onChange={(value) => {
                        if (typeof value === "string") {
                          const school = allTenants.find((tenant) => {
                            if (!tenant.name) {
                              return false;
                            }
                            const tenantName = Array.isArray(tenant.name) ? tenant.name[0] : tenant.name;
                            return tenantName?.toLowerCase() === value?.toLowerCase();
                          });
                          if (school) {
                            setIsTenantSchoolSelected(true);
                            field.onChange(school.id);
                            if (!Array.isArray(school?.location)) {
                              setValue("city", school?.location);
                            } else if (school?.location.length === 1) {
                              setValue("city", school?.location[0]);
                            }
                          } else {
                            setIsTenantSchoolSelected(false);
                            field.onChange(value);
                          }
                        } else {
                          setIsTenantSchoolSelected(true);
                          field.onChange(value?.id);
                          if (!Array.isArray(value?.location)) {
                            setValue("city", value?.location);
                          } else if (value?.location.length === 1) {
                            setValue("city", value?.location[0]);
                          }
                        }
                      }}
                      items={allTenants ?? []}
                    />
                  );
                }}
              />
            </>
          ) : (
            <Controller
              name="school"
              control={control}
              rules={{
                required: "School is required",
              }}
              render={(renderProps) => {
                const { field } = renderProps;
                return (
                  <AppSelect
                    {...field}
                    options={schoolOptions}
                    wrapperClassName="items-start"
                    placeholder="Select school"
                    showLabel
                    label="School"
                    id={field.name}
                    onChange={(value) => {
                      // handleGradeChange(value);
                      field.onChange(value);
                    }}
                    error={errors && errors.school && errors.school.message}
                  />
                );
              }}
            />
          )}
        </div>
        <div>
          {!isCityArray ? (
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
                    disabled={!isMaidaanTenant}
                  />
                );
              }}
            />
          ) : (
            <Controller
              name="city"
              control={control}
              rules={{
                required: "City/Region is required",
              }}
              render={(renderProps) => {
                const { field } = renderProps;
                return (
                  <AppSelect
                    {...field}
                    options={cityOptions}
                    wrapperClassName="items-start"
                    placeholder="Select city"
                    showLabel
                    label="City"
                    id={field.name}
                    onChange={(value) => {
                      // handleGradeChange(value);
                      field.onChange(value);
                    }}
                    error={errors && errors.city && errors.city.message}
                  />
                );
              }}
            />
          )}
        </div>
        {teacherLead && 
        <div className='flex flex-col gap-1 text-base'>
          <span className="text-start">
            Medium of Instruction
          </span>
          <div className='flex gap-4'>
            <label>
              <input type="radio" name="language" value="english" checked = {selectedMedium === 'english'} onChange = {() => setSelectedMedium('english')}
                style={{ accentColor: '#ccf900' }}
              />
              English
            </label>
        
            <label>
              <input type="radio" name="language" value="other" checked = {selectedMedium === 'other'} onChange = {() => setSelectedMedium('other')}
                style={{ accentColor: '#ccf900' }}
              />
              Other
            </label>
          </div>
        </div>}
        {/*{!isMaidaanTenant && <div>
          <Controller
            name="schoolId"
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
                  label="School ID/Admission Number"
                  maxLength={50}
                  error={errors && errors.schoolId && errors.schoolId.message}
                />
              );
            }}
          />
          </div>}*/}
        {referralCode && isReferralCodeValid ? (
          <div>
            <AppInput
              wrapperClassName="items-start"
              className="text-center !text-base"
              showLabel
              label="Referral Code - You get 5 Extra Coins!"
              disabled
              value={referralCode}
            />
          </div>
        ) : (
          <></>
        )}
      </div>
    );

    const renderTournamentForm = () => (
      <div className="h-full max-w-lg flex flex-col justify-evenly md:gap-14">
        <TournamentScreen
          firstOpenTournament={firstOpenTournament}
        />
      </div>
    );

    const renderReferralDialog = () => {
      return (
        <Dialog open={openReferralDialog} className="register-success">
          <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
            <span className="text-sm text-center">
              The referral link you have is broken and the bonus won’t be
              applicable, you can ask your friend to reshare or click proceed to
              go ahead anyway
            </span>
            <AppButton
              type="button"
              className="self-center z-10"
              onClick={() => setOpenReferralDialog(false)}
            >
              Proceed
            </AppButton>
          </div>
        </Dialog>
      );
    };
    
    const renderSuccessDialog = () => {
      return (
        <Dialog open={openSuccessDialog} className="register-success">
          <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
            <span className="text-sm text-center">
              You have been successfully registered!!
            </span>
            <AppButton
              type="button"
              className="self-center z-10"
              onClick={() => navigate('/login?redirect=/questionoftheday')}
            >
              Proceed
            </AppButton>
          </div>
        </Dialog>
      );
    };

    if (isPhoneVerified) {
      return (
        <Layout>
          <div
            className={twMerge(
              "flex flex-col items-center md:justify-center text-white min-w-[320px] overflow-auto",
              isTournamentScreen ? "md:gap-[5%]" : "",
              !leadType ? "py-6" : "",
            )}
          >
            {!!leadType && 
            <QODHeader/>
            }
            <div className={`text-2xl font-extrabold text-primary-yellow ${!leadType ? `mb-4` : ``} text-center`}>
              {isTournamentScreen ? <></> : "Welcome to maidaan!"}
              {isTournamentScreen ? (
                <></>
              ) : (
                <div className={`${!leadType ? `mb-9` : `mb-3`} text-white text-base`}>
                  Fill in these details to get you started!
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit(handleRegister)}
              className="w-full gap-2 h-full md:h-auto grid place-items-center"
            >
              {isTournamentScreen
                ? renderTournamentForm()
                : renderDetailsForm()}
              {errorMessage ? (
                <div className="text-red-500">{errorMessage}</div>
              ) : (
                <></>
              )}
              {!isTournamentScreen && (
                <AppButton
                  type="submit"
                  className={twMerge(
                    "self-center",
                    isTournamentScreen ? "md:mt-[5%]" : "md:mt-[20%]",
                    "mn-[5%]"
                  )}
                  disabled={isTournamentLoading || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Proceed
                </AppButton>
              )}
            </form>
          </div>
          <SuccessRegistrationModal
            handleDialogClose={handleDialogClose}
            open={isRegisterSuccess}
            password={generatePasswordString(registeredChildData?.firstName, registeredChildData?.phoneNumber)}
          />
          {renderSuccessDialog()}
        </Layout>
      );
    }

    return (
      <>
        <VerifyPhonePage setIsPhoneVerified={setIsPhoneVerified} />
        {renderReferralDialog()}
      </>
    );

};

export default RegisterPage;