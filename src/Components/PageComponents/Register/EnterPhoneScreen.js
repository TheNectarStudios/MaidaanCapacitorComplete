import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppButton from "../../Common/AppButton";
import Layout from "../../Common/Layout";
import useToast from "../../../hooks/use-toast";
import PhoneNumberInput from "../../Common/PhoneInput";
import { Dialog } from "@mui/material";
import mixpanel from 'mixpanel-browser';
import { School } from "@mui/icons-material";

const EnterPhoneScreen = () => {
  const navigate = useNavigate();
  const { ToastComponent, showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchParams, _] = useSearchParams();

  useEffect(() => {
    const phone = localStorage.getItem("phoneNumber");
    if (phone) {
      setPhoneNumber(phone);
    }
    const userId = localStorage.getItem("userId");
    if (userId && userId !== "null") {
      navigate("/lobby");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPhoneNumber = async () => {
    setIsLoading(true);
    const phoneWithCode = `+91${phoneNumber}`;
    localStorage.setItem('phoneNumber', phoneNumber);
    
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_NODE_BASE_URL}/user/send-otp`,
        {
          phoneNumber: phoneWithCode,
        }
      );
      const [child] = data.data;
      if(!child) {
        navigate("/register?source=new");
      } else if (!child.verifiedOTP && child.createdAt) {
        navigate("/register?source=lobby");
      } else if (child.verifiedOTP && child.createdAt) {
        navigate("/login");
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      showToast(error.message);
    }
  }

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


    const renderWhatIsMaidaan = () => {
      return (
        <div className="underline text-white text-center">
          <span
            className="font-medium text-sm text-white"
            onClick={() => setOpenDialog(true)}
          >
            <img
              src="/Assets/Icons/help.svg"
              alt="help"
              className="align-middle mr-2 text-white"
            />
            What is Maidaan?
          </span>
          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            className="register-success"
          >
            <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-6 py-10 leading-6">
              A platform where any student can participate in tournaments that
              aid learning, know where they stand, and win exciting prizes.{" "}
              <br />
              Empowering parents to give children exposure beyond school in a
              super fun way!
              <AppButton
                onClick={() => setOpenDialog(false)}
                className="rounded-[115px] min-w-[159px] w-[159px] h-[35px] mt-8 min-h-[35px]"
              >
                Proceed
              </AppButton>
            </div>
          </Dialog>
        </div>
      );
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

  return (
    <Layout>
      <div className="flex flex-col h-full w-full">
        <img
          src="/Assets/Images/cover-image.jpg"
          alt="boy"
          className="h-[50%] sm:h-[60%] sm:object-bottom object-cover object-center"
        />
        <div className="max-w-md h-full m-auto mt--4">
          <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col items-center justify-around h-full">
              {renderHeader()}
              <PhoneNumberInput
                onChange={setPhoneNumber}
                className="!text-base text-center max-w-xs"
                wrapperClassName="mb-4"
                placeholder="Enter mobile number"
                defaultValue={phoneNumber}
              />
              <div className="flex flex-col items-center">
                <AppButton
                  id="send-otp-button"
                  onClick={checkPhoneNumber}
                  disabled={phoneNumber.length < 10 || isLoading}
                  className="rounded-[115px] min-w-[216px] w-[216px] mb-4"
                  isLoading={isLoading}
                >
                  Proceed
                </AppButton>
                {renderWhatIsMaidaan()}
              </div>
              {renderTermsConditions()}
            </div>
          </div>
        </div>
      </div>
      <ToastComponent />
    </Layout>
  );
};

export default EnterPhoneScreen;
