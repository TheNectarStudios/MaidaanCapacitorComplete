import React, { useRef, useState } from "react";

const OtpInput = ({ onChange, showLabel = false, label = 'Enter OTP'}) => {
    const [otp, setOtp] = useState([]);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const handleInput = (event, index) => {
    if (
      !/[0-9]/.test(event.key) &&
      event.key !== "Backspace"
    ) {
      event.preventDefault();
      return;
    }
    const { value } = event.target;
    if (value.length === 1 && index < inputRefs.length - 1) {
      inputRefs[index + 1].current.focus();
    } else if (value.length === 0 && index > 0) {
      inputRefs[index - 1].current.focus();
    }
    const finalOtp = [...otp];
    finalOtp[index] = value;
    setOtp(finalOtp);
    onChange(finalOtp.join("").trim());
  };

  const handleKeyDown = (event) => {
    if (
      !/[0-9]/.test(event.key) &&
      event.key !== "Backspace" &&
      event.key !== "Enter" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight"
    ) {
      event.preventDefault();
    }
  };

  return (
    <div>
      {showLabel && <label htmlFor="otp">{label}</label>}
      <div className="flex gap-4">
        {inputRefs.map((ref, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            pattern="[0-9]{1}"
            id={`otp-${index}`}
            name={`otp-${index}`}
            ref={ref}
            onKeyUp={(event) => handleInput(event, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className="w-11 h-12 text-center !text-base rounded-lg outline-none border border-solid focus:border-primary-yellow focus:scale-110 animate-scale-100 transition-scale duration-200"
          />
        ))}
      </div>
    </div>
  );
};

export default OtpInput;
