import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";

export const MCQKeyboard = ({ question, onSubmit, enableSkip, isDisabled}) => {
  const [selectedOption, setSelectedOption] = useState("");
  useEffect(() => {
    setSelectedOption("");
  }, [question]);

  const handleOptionChange = (option) => {
    if(isDisabled) return;
    setSelectedOption(option);
  };
  
  const submit = (skipped = false) => {
    if(isDisabled) return;
    setSelectedOption("");
    onSubmit(selectedOption, skipped);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <ul className="mcq-keyboard">
        {question?.options?.map((option, index) => {
          return (
            <li
              key={`${option}_${index}_${question.question}`}
              className="cursor-pointer hover:bg-[#DDD]"
            >
              <input
                type="radio"
                id={option}
                name={question.question}
                onChange={() => handleOptionChange(option)}
                value={selectedOption}
                className="cursor-pointer"
              />
              <label htmlFor={option} className="cursor-pointer">
                {option}
              </label>
            </li>
          );
        })}
      </ul>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "12px",
          position: "relative",
        }}
      >
        <Button
          className="mainButton"
          sx={{
            width: "200px",
            height: "100%",
          }}
          onClick={() => submit()}
          disabled={!selectedOption}
        >
          Submit
        </Button>
        {enableSkip ? (
          <span
            style={{
              position: "absolute",
              right: "20px",
              fontSize: "14px",
              textDecoration: "underline",
            }}
            onClick={() => submit(true)}
          >
            Skip {">"}
            {">"}
          </span>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
