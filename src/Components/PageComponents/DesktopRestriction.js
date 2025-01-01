import React from "react";
import { twMerge } from "tailwind-merge";

const DesktopRestriction = ({ mode = "dark" }) => {
  return (
    <div className={twMerge("flex justify-center items-center flex-col", mode === 'light' ? "text-white" : "text-black")}>
      <h2>This application works on mobile only!</h2>
      <h3>Please open this link on your phone</h3>
    </div>
  );
};

export default DesktopRestriction;
