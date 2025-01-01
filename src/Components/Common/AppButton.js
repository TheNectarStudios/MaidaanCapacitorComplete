import { CircularProgress } from "@mui/material";
import React from "react";
import { twMerge } from "tailwind-merge";

const variants = {
	primary: "bg-primary-yellow text-primary-gray-20 border-none",
	secondary:
		"bg-transparent text-primary-yellow border border-solid border-primary-yellow",
	rectangularPrimary:
		"bg-primary-yellow text-primary-gray-20 border-none rounded-[10px]",
	rectangularSecondary:
		"bg-transparent text-primary-yellow border border-solid border-primary-yellow rounded-[10px]",
};

const AppButton = ({
	children,
	className = "",
	isLoading = false,
	variant = "primary",
	progressSize = 30,
	...rest
}) => {
	const commonClasses =
		"h-auto disabled:bg-disabled-gray disabled:cursor-not-allowed disabled:text-primary-gray-20 disabled:border-none rounded-[115px] w-fit text-black font-normal text-sm md:text-base px-4 py-[6px] cursor-pointer md:h-auto";
	return (
		<button
			className={twMerge(commonClasses, variants[variant], className)}
			{...rest}>
			{isLoading ? <CircularProgress size={progressSize} /> : <>{children}</>}
		</button>
	);
};

export default AppButton;
