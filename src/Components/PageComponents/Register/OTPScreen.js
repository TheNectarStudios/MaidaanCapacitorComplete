import OTPInput from "react-otp-input";
import AppButton from "../../Common/AppButton";

const OTPScreen = ({ otp, handleOtpChange, phoneNumber, onPhoneClick, hidePhoneChange=false, resendOtp, verifyOTPHandler, timer, isLoading }) => {
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
      <>
        <div className="flex m-auto h-full">
          <div className="flex flex-col gap-8 justify-center items-center mx-4">
            <OTPInput
              value={otp}
              onChange={handleOtpChange}
              numInputs={6}
              inputType="tel"
              containerStyle="flex gap-4"
              renderInput={(props) => (
                <input
                  {...props}
                  className="!w-11 h-12 text-center !text-base rounded-lg outline-none border border-solid focus:border-primary-yellow focus:scale-110 animate-scale-100 transition-scale duration-200"
                />
              )}
            />
            {/* <OtpInput onChange={handleOtpChange} /> */}
            <div className="text-white text-xs mx-12 text-center">
              <span>We’ve sent you an SMS with a 6-digit verification </span>
              <span className="inline-flex mt-1">
                code on +91
                {phoneNumber}{" "}
                {!hidePhoneChange ? <span
                  className="px-1"
                  onClick={onPhoneClick}
                >
                  <img src="/Assets/Icons/edit-pencil.svg" alt="edit-pencil" />
                </span> : <></>}
              </span>
            </div>
            <div className="text-[#949494] text-xs mx-12 text-center">
              Didn't receive the code?{" "}
              {timer > 0 ? (
                <span className="text-white">Resend</span>
              ) : (
                <span
                  className="text-primary-yellow underline"
                  onClick={resendOtp}
                >
                  Resend
                </span>
              )}{" "}
              in {timer} seconds
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <AppButton
            onClick={verifyOTPHandler}
            disabled={!otp || otp.length < 6 || isLoading}
            isLoading={isLoading}
            className="mb-2"
          >
            Proceed
          </AppButton>
          {renderTermsConditions()}
        </div>
      </>
    );
};

export default OTPScreen;