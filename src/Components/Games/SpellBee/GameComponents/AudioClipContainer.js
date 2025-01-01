import React, { useRef, useEffect } from "react";
import { audioElRef, playAudioClip } from "../../../Utils/AudioPlayer";
import { ReactComponent as PlayButtonSvg } from "../../../../assets/icons/play-button.svg"

function AudioClipContainer({ question }) {
  // useEffect(() => {
  //   const audioEl = document.querySelector("audio");
  //   audioElRef.current = audioEl;
  // }, []);
  
  const handlePlay = () => {
    const audioEl = document.querySelector("audio");
    audioEl.play();
  };

  const audioElRef = useRef(null);
    return (
      <div>
        <div
          className="flex justify-around items-end my-[3vh] mx-auto py-0 px-[10%] max-w-[450px]"
        >
          <div className="flex justify-center">
            <div
              className="flex flex-col items-center"
            >
              <audio
                  className="absolute -top-[9999px]"
                  src={question.audioClip} 
                  preload="auto"
                  ref={audioElRef}
              />
              <div
                className="iconButtonContainer p-4 !w-[78px] !h-[78px]"
                onClick={(e) => handlePlay()}
              >
                <PlayButtonSvg className="h-[50px] w-[50px]" />
              </div>
              <div
                className="text-sm mt-2 text-center text-[#3a3a3a] font-bold"
              >
                PLAY AUDIO
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  export default AudioClipContainer;