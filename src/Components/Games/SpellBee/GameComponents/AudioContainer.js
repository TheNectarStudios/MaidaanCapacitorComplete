import React from "react";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import { useSpeechSynthesis } from "react-speech-kit";
import { PlayAudio } from "../../../Utils/AudioPlayer";

const RATE = {
  FAST: 0.75,
  SLOW: 0.5,
};

function AudioContainer({ question }) {
  const { speak, voices } = useSpeechSynthesis();

  const playAudio = (rate) => {
    let encAudio = "";
    if (RATE.FAST === rate) {
      encAudio = question.audioEncFast;
    } else {
      encAudio = question.audioEncSlow;
    }

    PlayAudio(encAudio);
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "3vh auto",
          alignItems: "end",
          padding: "0 10%",
          maxWidth: "450px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              className="iconButtonContainer mainBtnSmall"
              onClick={(e) => playAudio(RATE.SLOW)}
            >
              <img
                src="/Assets/Icons/SlowSpeak.svg"
                style={{ width: "80%", height: "auto" }}
                alt="slow-speak"
              />
            </div>
            <div
              style={{
                fontSize: "12px",
                margin: "8px 0 0 0",
                textAlign: "center",
                color: "#3a3a3a",
                fontWeight: "700",
              }}
            >
              SLOW MOTION
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            className="mainBtn1"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <VolumeUpOutlinedIcon
              className="iconButtonContainer !text-[42px] p-2.5"
              onClick={(e) => playAudio(RATE.FAST)}
            />
            <div
              style={{
                fontSize: "12px",
                marginTop: "8px",
                textAlign: "center",
                color: "#3a3a3a",
                fontWeight: "700",
              }}
            >
              HEAR WORD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioContainer;
