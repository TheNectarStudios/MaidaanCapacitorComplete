import { twMerge } from "tailwind-merge";

const ConditionButton = ({ onClick, children, className, ...rest }) => {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "bg-primary-gray-20 text-primary-yellow w-full h-9 border-none outline-none flex justify-center items-center active:bg-[#2b2b2b] active:text-primary-yellow focus:outline-none focus:ring-0",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default ConditionButton;
