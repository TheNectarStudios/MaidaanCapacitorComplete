import { twMerge } from "tailwind-merge";
import { ReactComponent as CrossRedIconSvg } from "../../../../../assets/icons/cross-red.svg";
import { ReactComponent as TickGreenIconSvg } from "../../../../../assets/icons/tick-green.svg";

const PaperCheckingOptions = ({ localAnswers, currentActiveQuestion, index, recordAnswer, submitted, question, currentActiveIndex }) => {
    const value = localAnswers?.[currentActiveIndex]?.[index];
    if (submitted) {
        if (value === question.isCorrect) {
          return (
            <div
              className={twMerge(
                "border border-solid w-4 px-[2px] flex justify-center items-center shrink-0 aspect-square bg-primary-gray-20"
              )}
            >
              <TickGreenIconSvg />
            </div>
          );
        } else {
          return (
            <div
              className={twMerge(
                "border border-solid w-4 px-[2px] flex justify-center items-center shrink-0 aspect-square bg-primary-gray-20"
              )}
            >
              <CrossRedIconSvg />
            </div>
          );
        }
    }
    return (
      <div className="flex gap-2">
        <div
          className={twMerge(
            "border border-solid w-4 px-[2px] flex justify-center items-center shrink-0 aspect-square",
            value === false && "bg-primary-gray-20"
          )}
          onClick={() => recordAnswer(index, false)}
        >
          <CrossRedIconSvg />
        </div>
        <div
          className={twMerge(
            "border border-solid w-4 px-[2px] flex justify-center items-center shrink-0 aspect-square",
            value === true && "bg-primary-gray-20"
          )}
          onClick={() => recordAnswer(index, true)}
        >
          <TickGreenIconSvg />
        </div>
      </div>
    );
};

export default PaperCheckingOptions;