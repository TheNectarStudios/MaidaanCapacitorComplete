import { Controller, useForm } from "react-hook-form";
import Layout from "../Common/Layout";
import AppInput from "../Common/AppInput";
import { useEffect, useState } from "react";
import PhoneNumberInput from "../Common/PhoneInput";
import AppButton from "../Common/AppButton";
import { Dialog } from "@mui/material";
import Lottie from "lottie-react";
import confettiAnimation from "../../assets/animations/confetti.json";
import { db } from "../../firebase-config";
import { addDoc, collection } from "firebase/firestore";

const mediumOfInstructions = ["English", "Marathi", "Hindi"];
const schoolLevels = [
  "Both",
  "U14 Spell-a-Thon (Grades 7 & 8)",
  "U12 Spell-a-Thon (Grades 5 & 6)"
];

const AppRadio = ({
  label,
  name = "",
  value,
  onChange,
  id,
  className,
  wrapperClassName = "",
  defaultValue,
  checked,
  selectedValue,
  ...rest
}) => {
  return (
    <div className="flex items-center">
      <div>
        <input
          id={id}
          name={name ?? id}
          type="radio"
          className="h-4 w-4 accent-primary-yellow"
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          checked={selectedValue === value}
          {...rest}
        />
      </div>
      <div>
        <label htmlFor={id} className="text-sm">{label}</label>
      </div>
    </div>
  );
};

const PuneSpellathonForm = () => {
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm({});

    const [mediumOfInstruction, setMediumOfInstruction] = useState(mediumOfInstructions[0]);
    const [schoolLevel, setSchoolLevel] = useState(schoolLevels[0]);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMediumOfInstruction(mediumOfInstructions[0]);
        setSchoolLevel(schoolLevels[0]);
    }, []);

    const handleRegister = async (data) => {
        setIsSubmitting(true);
        const finalData = {
            ...data,
            mediumOfInstruction,
            schoolLevel,
            createdAt: new Date(),
            schoolAddress: {
                locality: data.schoolAddressLocality ?? "",
                lineOne: data.schoolAddressLineOne ?? "",
                lineTwo: data.schoolAddressLineTwo ?? "",
                pincode: data.pincode ?? "",
            }
        }
        delete finalData.schoolAddressLocality;
        delete finalData.schoolAddressLineOne;
        delete finalData.schoolAddressLineTwo;
        delete finalData.pincode;
        const collectionRef = collection(db, "puneSpellathonNov23");
        await addDoc(collectionRef, finalData);
        setIsSubmitting(false);
        setIsSuccess(true);
    };

        const renderSuccessDialog = () => {
          return (
            <Dialog open={isSuccess} className="register-success">
              <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
                <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
                <span className="text-lg md:text-xl font-medium text-center">
                  Registration Successful!
                </span>
                <span className="text-sm text-center">
                  Our team will connect with you in the coming week to share next steps
                </span>
                <AppButton
                  type="button"
                  className="self-center z-10 !text-base cursor-pointer"
                  onClick={() =>
                    (window.location.href = "https://maidaan.app/")
                  }
                >
                  Checkout Our Website
                </AppButton>
                <Lottie
                  animationData={confettiAnimation}
                  loop={false}
                  className="absolute h-full w-full top-0 z-0"
                />
              </div>
            </Dialog>
          );
        };

         const handlePinCodeChange = (value, fieldOnChange) => {
           const onlyNumbers = value.replace(/[^0-9]/g, "");
           if (onlyNumbers.length <= 6) {
             // setValue("pincode", onlyNumbers);
             fieldOnChange(onlyNumbers);
             // if (onlyNumbers.length === 6) {
             //   clearErrors("pincode");
             // }
           }
         };



    return (
      <Layout>
        <div className="w-full h-full flex justify-center items-center">
          <div className="md:bg-primary-gray-20 text-white w-full max-w-3xl h-full py-6 overflow-auto scrollbar">
            <div className="mb-8 text-center">
              <div className="text-2xl font-extrabold text-primary-yellow mb-4">
                Maidaan's Pune Spell-a-Thon
              </div>
              <div>School Registration Form</div>
            </div>
            <form
              onSubmit={handleSubmit(handleRegister)}
              className="w-full h-fit flex justify-center"
            >
              <div className="flex flex-col items-center px-9 h-full w-full max-w-lg gap-6">
                <Controller
                  name="schoolName"
                  control={control}
                  rules={{
                    required: "School name is required",
                    maxLength: {
                      value: 100,
                      message: "Maximum 100 characters allowed",
                    },
                  }}
                  render={(renderProps) => {
                    const { field } = renderProps;
                    return (
                      <AppInput
                        {...field}
                        wrapperClassName="items-start"
                        className="text-center !text-base"
                        id={field.schoolName}
                        showLabel
                        label="School's Name"
                        labelClassName="text-base text-primary-yellow"
                        maxLength={100}
                        error={
                          errors &&
                          errors.schoolName &&
                          errors.schoolName.message
                        }
                      />
                    );
                  }}
                />
                <Controller
                  name="schoolPointOfContactName"
                  control={control}
                  rules={{
                    required: "Name is required",
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
                        id={field.schoolPointOfContactName}
                        showLabel
                        label="Your Name"
                        labelClassName="text-base text-primary-yellow"
                        maxLength={50}
                        error={
                          errors &&
                          errors.schoolPointOfContactName &&
                          errors.schoolPointOfContactName.message
                        }
                      />
                    );
                  }}
                />
                <Controller
                  name="designation"
                  control={control}
                  rules={{
                    required: "Designation is required",
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
                        id={field.designation}
                        showLabel
                        label="Your Designation/Role"
                        labelClassName="text-base text-primary-yellow"
                        maxLength={50}
                        error={
                          errors &&
                          errors.designation &&
                          errors.designation.message
                        }
                      />
                    );
                  }}
                />
                <Controller
                  name="schoolPointOfContactPhone"
                  control={control}
                  rules={{
                    required: "Phone number is required",
                    maxLength: {
                      value: 50,
                      message: "Maximum 50 characters allowed",
                    },
                  }}
                  render={(renderProps) => {
                    const { field } = renderProps;
                    return (
                      <PhoneNumberInput
                        {...field}
                        className="!text-base text-center"
                        wrapperClassName="mb-4 items-start"
                        showLabel
                        placeholder="Enter 10 Digit Mobile Number"
                        label="Your Contact Number"
                        labelClassName="text-base text-primary-yellow text-left"
                        error={
                          errors &&
                          errors.schoolPointOfContactPhone &&
                          errors.schoolPointOfContactPhone.message
                        }
                      />
                    );
                  }}
                />
                <Controller
                  name="schoolAddressLineOne"
                  control={control}
                  rules={{
                    required: "Line 1 is required",
                    maxLength: {
                      value: 200,
                      message: "Maximum 200 characters allowed",
                    },
                  }}
                  render={(renderProps) => {
                    const { field } = renderProps;
                    return (
                      <AppInput
                        {...field}
                        wrapperClassName="items-start"
                        className="text-center !text-base"
                        id={field.schoolAddressLineOne}
                        showLabel
                        placeholder="Line 1"
                        label="School's Address"
                        labelClassName="text-base text-primary-yellow"
                        maxLength={200}
                        error={
                          errors &&
                          errors.schoolAddressLineOne &&
                          errors.schoolAddressLineOne.message
                        }
                      />
                    );
                  }}
                />
                <Controller
                  name="schoolAddressLineTwo"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 200,
                      message: "Maximum 200 characters allowed",
                    },
                  }}
                  render={(renderProps) => {
                    const { field } = renderProps;
                    return (
                      <AppInput
                        {...field}
                        wrapperClassName="items-start"
                        className="text-center !text-base"
                        id={field.schoolAddressLineTwo}
                        showLabel
                        placeholder="Line 2"
                        label=""
                        labelClassName="text-base text-primary-yellow"
                        maxLength={200}
                        error={
                          errors &&
                          errors.schoolAddressLineTwo &&
                          errors.schoolAddressLineTwo.message
                        }
                      />
                    );
                  }}
                />
                <Controller
                  name="schoolAddressLocality"
                  control={control}
                  rules={{
                    required: "Locality is required",
                    maxLength: {
                      value: 200,
                      message: "Maximum 200 characters allowed",
                    },
                  }}
                  render={(renderProps) => {
                    const { field } = renderProps;
                    return (
                      <AppInput
                        {...field}
                        wrapperClassName="items-start"
                        className="text-center !text-base"
                        id={field.schoolAddressLocality}
                        showLabel
                        placeholder="Locality"
                        label=""
                        labelClassName="text-base text-primary-yellow"
                        maxLength={200}
                        error={
                          errors &&
                          errors.schoolAddressLocality &&
                          errors.schoolAddressLocality.message
                        }
                      />
                    );
                  }}
                />
                <Controller
                  name="pincode"
                  control={control}
                  rules={{
                    required: "Pincode is required",
                    minLength: {
                      value: 6,
                      message: "Please enter 6 digit pincode",
                    },
                  }}
                  render={(renderProps) => {
                    const { field } = renderProps;
                    return (
                      <AppInput
                        {...field}
                        wrapperClassName="items-start"
                        className="text-center !text-base"
                        id={field.pincode}
                        showLabel
                        placeholder="Pincode"
                        label=""
                        maxLength={50}
                        error={
                          errors && errors.pincode && errors.pincode.message
                        }
                        onChange={(value) => {
                          handlePinCodeChange(value, field.onChange);
                          // field.onChange(value);
                        }}
                      />
                    );
                  }}
                />
                <div className="w-full">
                  <div className="text-base text-primary-yellow italic mb-2">
                    School's Medium of Instruction
                  </div>
                  <div>
                    <div className="flex flex-col gap-4 mb-2 flex-wrap">
                      {mediumOfInstructions.map((item, index) => (
                        <AppRadio
                          key={index}
                          label={item}
                          id={item}
                          name="mediumOfInstruction"
                          value={item}
                          onChange={() => setMediumOfInstruction(item)}
                          wrapperClassName="items-center"
                          selectedValue={mediumOfInstruction}
                          className="m-0 mr-1"
                        />
                      ))}
                    </div>
                    {mediumOfInstruction === "Other" && (
                      <Controller
                        name="otherMediumOfInstruction"
                        control={control}
                        rules={{
                          required: "Please specify medium of instruction",
                          maxLength: {
                            value: 100,
                            message: "Maximum 100 characters allowed",
                          },
                        }}
                        render={(renderProps) => {
                          const { field } = renderProps;
                          return (
                            <AppInput
                              {...field}
                              wrapperClassName="items-start"
                              className="text-center !text-base"
                              id={field.otherMediumOfInstruction}
                              showLabel
                              label=""
                              maxLength={100}
                              error={
                                errors &&
                                errors.otherMediumOfInstruction &&
                                errors.otherMediumOfInstruction.message
                              }
                            />
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="w-full">
                  <div className="text-base text-primary-yellow italic mb-2">
                    Levels you want to enrol your school for
                  </div>
                  <div>
                    <div className="flex flex-col gap-4 mb-2">
                      {schoolLevels.map((item, index) => (
                        <AppRadio
                          key={index}
                          label={item}
                          id={item}
                          name="schoolLevel"
                          value={item}
                          onChange={() => setSchoolLevel(item)}
                          wrapperClassName="items-center"
                          className="m-0 mr-1"
                          selectedValue={schoolLevel}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <AppButton
                  type="submit"
                  className="cursor-pointer !text-base mt-6"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Submit
                </AppButton>
              </div>
            </form>
          </div>
        </div>
        {renderSuccessDialog()}
      </Layout>
    );
};

export default PuneSpellathonForm;