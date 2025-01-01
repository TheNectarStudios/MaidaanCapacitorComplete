import React, { useEffect, useState } from "react";

export const JumbledWord = ({ question }) => {
  const [word, setWord] = useState("");
  // useEffect(() => {
  //   function checkCurrentWord() {
  //     const ls = localStorage.getItem("currentWord") || "{}";
  //     const jsonLS = JSON.parse(ls);
  //     if (jsonLS && jsonLS.length) {
  //       const questionWordArray = jsonLS[0].question.split(' ');
  //       let finalWord = '';
  //       let finalJumbledWord = '';
  //       let finalWordArray = [];
  //       let finalJumbledWordArray = [];
  //       if (questionWordArray.length) {
  //         questionWordArray.forEach((w) => {
  //           const { wordFormated, word } = getJumbledWord(w);
  //           finalWordArray.push(word);
  //           finalJumbledWordArray.push(wordFormated);
  //         });
  //         finalWord = finalWordArray.join(' ');
  //         finalJumbledWord = finalJumbledWordArray.join(' ');
  //       }
  //       localStorage.setItem("currentJumbledWord", finalWord);
  //       setWord(finalJumbledWord);
  //     }
  //   }
  //   checkCurrentWord();
  //   window.addEventListener("storage", checkCurrentWord);

  //   return () => {
  //     window.removeEventListener("storage", checkCurrentWord);
  //   };
  // }, []);

  // useEffect(() => {
  //   if (question) {
  //     const questionWordArray = question?.question?.split(" ");
  //     let finalWord = "";
  //     let finalJumbledWord = "";
  //     let finalWordArray = [];
  //     let finalJumbledWordArray = [];
  //     if (questionWordArray.length) {
  //       questionWordArray.forEach((w) => {
  //         const { wordFormated, word } = getJumbledWord(w);
  //         finalWordArray.push(word);
  //         finalJumbledWordArray.push(wordFormated);
  //       });
  //       finalWord = finalWordArray.join(" ");
  //       finalJumbledWord = finalJumbledWordArray.join(" ");
  //     }
  //     localStorage.setItem("currentJumbledWord", finalWord);
  //     setWord(finalJumbledWord);
  //   }

  // }, [question]);

  return (
    <div
      className="w-full border-2 border-[#d9d9d9] rounded-2xl p-4 m-0 filter drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)] bg-white"
    >
      <h1
        className="text-[32px] md:text-4xl font-extrabold tracking-[1] uppercase text-center m-0"
      >
        {question?.jumbledWord}
      </h1>
    </div>
  );
};
