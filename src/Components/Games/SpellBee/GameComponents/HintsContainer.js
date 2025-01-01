import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GAME_FORMATS } from "../../../../Constants/Commons";

export const HintsContainer = ({ question, roundFormat }) => {
  const [searchParams] = useSearchParams();
  const isDemoGame = searchParams.get("d") === "Y";
  const [relatedWords, setRelatedWord] = useState([]);


  useEffect(() => {
    if (question) {
      const hints = question?.hints?.length ? question.hints : question?.relatedWords;
      // const hints = isDemoGame ? question.relatedWords : question.hints;
      setRelatedWord(hints);
    }
  }, [isDemoGame, question]);

  return relatedWords && relatedWords.length ? (
    <div
      style={{
        textAlign: "left",
        width: "100%",
        maxWidth: "90vw",
        alignSelf: "center",
        marginBottom:
          roundFormat === GAME_FORMATS.AUDIO
            ? "12vh"
            : roundFormat === GAME_FORMATS.AUDIOCLIP
            ? "12vh"
            : "2vh",
      }}
    >
      <span>
        <b>Hint</b>
      </span>
      <br />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          flexWrap: "wrap",
          borderRadius: "10px",
          border: "1px solid #d9d9d9",
          background: "#f5f5f5",
          boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
        }}
      >
        {relatedWords.map((synonym, index) => (
          <div
            style={{
              color: "#3a3a3a",
              fontSize: "calc(0.5vw + 12px)",
              margin: "10px",
            }}
            key={index}
          >
            {synonym}
          </div>
        ))}
      </div>
    </div>
  ) : (
    <></>
  );
};
