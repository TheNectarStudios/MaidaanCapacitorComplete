import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import AppInput from "./AppInput";

const PasswordInput = ({ onChange, wrapperClassName = '',  ...rest }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handlePasswordChange = (value) => {
    setPassword(value);
    onChange(value);
  };

  return (
      <div className={twMerge("flex relative", wrapperClassName)}>
        <AppInput
          type={showPassword ? "text" : "password"}
          id="password"
          value={password}
          onChange={handlePasswordChange} 
          {...rest}
        />
        <button
          type="button"
          className="absolute right-0 top-0 bottom-0 flex items-center bg-transparent border-none outline-none"
          onClick={togglePasswordVisibility}
        >
          {showPassword ? (
            <img src="/Assets/Icons/eye-slash.svg" alt="password-eye-slash" />
          ) : (
            <img src="/Assets/Icons/eye.svg" alt="password-eye" />
          )}
        </button>
      </div>
  );
};

export default PasswordInput;
