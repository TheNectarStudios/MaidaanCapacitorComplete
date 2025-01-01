import { Dialog } from "@mui/material";
import AppButton from "../../Common/AppButton";
import Lottie from "lottie-react";
import confettiAnimation from "../../../assets/animations/confetti.json";
import { handleShare } from "../../../GamesArena/utils";

const SuccessRegistrationModal = ({ open, handleDialogClose, password = '', isForgotPassword = false }) => {
  if (isForgotPassword) {
    return (
      <Dialog open={open} className="register-success">
        <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-4">
          <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
          <span className="text-lg md:text-xl font-medium text-center">
            {"Success"}
          </span>

          <div className="flex flex-col items-center justify-center space-x-2 gap-4 ">
            <span className="text-sm text-center">
              {
                "Your maidaan password -"
              }
            </span>
            <div className="flex flex-col items-center justify-end space-x-2">
              <div className="relative border border-solid border-primary-yellow text-center rounded-lg p-4 w-[200px] md:w-[300px] bg-[#ffffff17] mb-4">
                <div className="truncate">{password}</div>
                <img
                  src="/Assets/Icons/copyIcon.svg"
                  className="w-6 h-6 cursor-pointer z-10 absolute right-4 top-1/2 transform -translate-y-1/2"
                  alt="copy"
                  onClick={() => handleShare(password)}
                />
              </div>
            </div>
          </div>

          <AppButton
            type="button"
            className="self-center z-10"
            onClick={handleDialogClose}
            style={{ minWidth: "120px", height: "40px" }}
          >
            {"Login"}
          </AppButton>
          <Lottie
            animationData={confettiAnimation}
            loop={false}
            className="absolute h-full w-full top-0 z-0"
          />
        </div>
      </Dialog>
    );
  }
  return (
    <Dialog open={open} className="register-success">
      <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
        <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
        <span className="text-lg md:text-xl font-medium text-center">
          {"Congratulations, you're in!"}
        </span>

        <div className="flex flex-col items-center justify-center space-x-2 gap-4 ">
          <span className="text-sm text-center">
            {
              "Your maidaan password -"
            }
          </span>

          <div className="flex flex-col items-center justify-end space-x-2">
            <div className="relative border border-solid border-primary-yellow text-center rounded-lg p-4 w-[200px] md:w-[300px] bg-[#ffffff17] mb-4">
              <div className="truncate">{password}</div>
              <img
                src="/Assets/Icons/copyIcon.svg"
                className="w-6 h-6 cursor-pointer z-10 absolute right-4 top-1/2 transform -translate-y-1/2"
                alt="copy"
                onClick={() => handleShare(password)}
              />
            </div>
          </div>


        </div>


        <span className="text-sm text-center">
          {
            "Your password will also be shared over WhatsApp. Login to play a demo and get set!"
          }
        </span>
        <AppButton
          type="button"
          className="self-center z-10"
          onClick={handleDialogClose}
          style={{ minWidth: "120px", height: "40px" }}
        >
          {"Login"}
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

export default SuccessRegistrationModal;