import React from "react";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { twMerge } from "tailwind-merge";

const AppInput = ({
  onChange,
  value,
  showLabel = false,
  label = "Phone number",
  id = "app-input",
  className = "",
  labelClassName = "",
  wrapperClassName = "",
  error = "",
  isAutocomplete = false,
  items = [],
  ...rest
}) => {
  const handleOnChange = (event) => {
    const inputValue = event.target.value;
    onChange(inputValue);
  };

  const handleOnSearch = (string) => {
    onChange(string);
  };

  // const handleOnHover = (result) => {
  //   // the item hovered
  //   console.log(result);
  // };

  const handleOnSelect = (item) => {
    // the item selected
    onChange(item);
  };

  // const handleOnFocus = () => {
  //   console.log("Focused");
  // };

  return (
    <div
      className={twMerge(
        "flex flex-col w-full justify-center items-center",
        wrapperClassName
      )}
    >
      {showLabel && (
        <label
          htmlFor={id}
          className={twMerge("text-base italic", labelClassName)}
        >
          {label}
        </label>
      )}
      {isAutocomplete ? (
        <ReactSearchAutocomplete
          items={items}
          showIcon={false}
          onSearch={handleOnSearch}
          // onHover={handleOnHover}
          onSelect={handleOnSelect}
          // onFocus={handleOnFocus}
          onClear={() => onChange("")}
          showNoResults={false}
          autoFocus={false}
          className="autocomplete-input w-full"
          styling={{
            height: "42px",
            borderRadius: "8px",
          }}
        />
      ) : (
        <input
          value={value}
          onChange={handleOnChange}
          className={twMerge(
            "w-full h-[42px] rounded-lg outline-none border-solid border focus:border-primary-yellow disabled:border-primary-yellow disabled:bg-disabled-gray disabled:cursor-not-allowed disabled:text-black disabled:opacity-100 md:text-lg text-sm",
            className
          )}
          id={id}
          {...rest}
        />
      )}

      {error && <div className="text-red-500 text-sm h-5">{error}</div>}
    </div>
  );
};

export default AppInput;
