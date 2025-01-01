import React, { useEffect, useState } from "react";
import AppInput from "./AppInput";

const PhoneNumberInput = ({ onChange, className, defaultValue, showLabel = false, label, ...rest }) => {
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (defaultValue) {
      setPhoneNumber(defaultValue);
    }
  }, [defaultValue]);

  const handlePhoneNumberChange = (value) => {
    const onlyNumbers = value.replace(/[^0-9]/g, "");
    if (onlyNumbers.length <= 10) {
      setPhoneNumber(onlyNumbers);
      onChange(onlyNumbers);
    }
  };

  return (
    <>
      {showLabel && (
        <label htmlFor="phone-number-input" className="text-sm italic">
          {label}
        </label>
      )}
      <AppInput
        id="phone-number-input"
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        pattern="[0-9]{10}"
        maxLength="10"
        className={className}
        {...rest}
      />
    </>
  );
}

export default PhoneNumberInput;
