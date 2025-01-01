import { twMerge } from "tailwind-merge";
import AppButton from "./AppButton";

const BottomButtonBar = ({ text, buttonProps }) => {
    const { text: buttonText, className, ...rest } = buttonProps;
    return (
      <div className="fixed bottom-0 right-0 left-0 flex justify-center items-center pl-5 pr-9 mb-8">
        <div className="bg-[#7f7f7f] rounded-lg h-12 md:h-16 w-full max-w-lg">
          <div className="flex justify-start items-center relative h-full">
            <span className="text-white italic ml-4 md:text-2xl">
              {text}
            </span>
            <AppButton
              className={twMerge("min-w-44 w-44 h-full absolute -right-4 md:h-16 md:-right-5 md:text-lg md:w-56", className)}
              {...rest}
            >
              {buttonText}
            </AppButton>
          </div>
        </div>
      </div>
    );
};

export default BottomButtonBar;