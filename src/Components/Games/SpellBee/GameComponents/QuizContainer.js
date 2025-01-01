import React, { useEffect, useState } from "react";

export const QuizContainer = ({ question }) => {
  // const [question, setQuestion] = useState("");
  // useEffect(() => {
  //   function checkCurrentWord() {
  //     const ls = localStorage.getItem("currentWord") || "{}";
  //     const jsonLS = JSON.parse(ls);
  //     if (jsonLS && jsonLS.length) {
  //       setQuestion(jsonLS[0].question);
  //     }
  //   }
  //   checkCurrentWord();
  //   window.addEventListener("storage", checkCurrentWord);

  //   return () => {
  //     window.removeEventListener("storage", checkCurrentWord);
  //   };
  // }, []);

  return (
    <div
      style={{
        padding: "2px 18px",
        fontSize: "20px",
        textAlign: "left",
        whiteSpace: "pre-line",
        lineHeight: 1.3
      }}
      dangerouslySetInnerHTML={{
        __html: question?.question,
      }}
    >
      {/*{question?.question?.replace("\\\\n", "\n")} */}
    </div>
  );
};
