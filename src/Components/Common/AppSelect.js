import React from "react";
import * as Select from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import { twMerge } from "tailwind-merge";

const AppSelect = ({
  wrapperClassName = '',
  showLabel = false,
  error = "",
  label = "Select value",
  placeholder,
  options,
  id = "app-select",
  onChange,
  textStyle,
  ...rest
}) => {
  const handleOnChange = (value) => {
    onChange(value);
  };
  return (
    <div className={twMerge("flex flex-col w-full", wrapperClassName)}>
      {showLabel && (
        <label htmlFor={id} className="italic">
          {label}
        </label>
      )}
      <Select.Root onValueChange={handleOnChange} {...rest}>
        <Select.Trigger
          className={`w-full h-[42px] rounded-lg outline-none border-solid focus:border-primary-yellow text-center ${textStyle ?  'text-sm data-[placeholder]:text-gray-400' :'!text-base data-[placeholder]:text-black'}   inline-flex items-center justify-center px-[15px] leading-none gap-[5px] bg-white [&>*:first-child]:w-full`}
          aria-label="Grade"
          id={id}
        >
          <Select.Value placeholder={placeholder} className="text-black" />
          <Select.Icon className="text-black">
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="overflow-hidden bg-[#D9D9D9] rounded-lg w-full select-content"
            position="popper"
          >
            <Select.ScrollUpButton className="flex items-center justify-center h-[25px] bg-white cursor-default">
              <ChevronUpIcon />
            </Select.ScrollUpButton>
            <Select.Viewport className="bg-[#D9D9D9] p--2 rounded-lg shadow-lg w-full">
              <Select.Group>
                {options.map((option) => {
                  return (
                    <Select.Item
                      className={twMerge(
                        "w-full text-sm leading-none text-black flex items-center h-8 px-8 relative select-none data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-white data-[highlighted]:text-black"
                      )}
                      key={`${option?.label}_${option?.value}`}
                      value={option?.value}
                    >
                      <Select.ItemText>{option?.label}</Select.ItemText>
                      <Select.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
                        <CheckIcon />
                      </Select.ItemIndicator>
                    </Select.Item>
                  );
                })}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-[25px] bg-white cursor-default">
              <ChevronDownIcon />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {error && <div className="text-red-500 text-sm h-5">{error}</div>}
    </div>
  );
};


export default AppSelect;
