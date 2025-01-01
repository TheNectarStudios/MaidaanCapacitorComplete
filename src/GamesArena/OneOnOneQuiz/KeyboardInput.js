import { useEffect, useRef, useState } from "react";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { Button } from "@mui/material";
import Keyboard from "react-simple-keyboard";
import { GAME_FORMATS, KEYBOARD_TYPES } from "../../Constants/Commons";
import { MCQKeyboard } from "../../Components/Games/SpellBee/GameComponents/MCQKeyboard";

const KeyboardInput = ({ quiz, currentQuestion, submitAnswer, isDisabled }) => {
    const [isDesktop, setIsDesktop] = useState(false);
    const [input, setInput] = useState("");
    const keyboardRef = useRef(null);

    useEffect(() => {
      const resizeListener = () => {
        setIsDesktop(window.innerWidth > window.innerHeight);
      };
      window.addEventListener("resize", resizeListener);
      return () => {
        window.removeEventListener("resize", resizeListener);
      };
    }, []);

    useEffect(() => {
        clearInput();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion]);

    const clearInput = () => {
        keyboardRef?.current?.clearInput();
        setInput("");
    }

    const handleSubmitAnswer = () => {
        if (isDisabled) return;
        submitAnswer(input);
        setInput("");
        clearInput();
    }

    const onKeyPress = () => {
      if(isDisabled) return;
      const canVibrate = window.navigator.vibrate;
      if (canVibrate) {
        navigator.vibrate(10);
      }
    };

    const onChange = (input) => {
      if (isDisabled) return;
      setInput(input);
    };

    if (quiz?.keyboardType === GAME_FORMATS.MCQ) {
        return (
          <MCQKeyboard
            question={currentQuestion}
            onSubmit={submitAnswer}
            enableSkip={false}
            isDisabled={isDisabled}
          />
        );
    }

    return (
      <>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center justify-center gap-2 w-full px-2">
            <div className="relative flex w-full gap-2">
              <div className="w-full relative">
                <input
                  type="text"
                  // ref={inputBox}
                  {...(!isDesktop ? { readOnly: true } : {})}
                  className="border border-solid border-primary-yellow outline-none flex items-center p-[10px] w-full bg-[#f5f5f5] rounded-md shadow-[0px_6px_10px_-3px_#80808029] font-semibold text-gray-500 text-[20px] text-center"
                  defaultValue={input}
                  disabled={isDisabled}
                  onChange={(e) => onChange(e.target.value)}
                />
                {input && input.length > 0 && (
                  <div className="text-lg text-black flex absolute top-1/2 transform -translate-y-1/2 right-1 z-10">
                    <HighlightOffIcon onClick={clearInput} />
                  </div>
                )}
              </div>
              <Button
                variant="contained"
                // ref={submitBtn}
                className="mainButton submitBtn"
                onClick={() => handleSubmitAnswer(input)}
                disabled={isDisabled}
              >
                ⏎
              </Button>
            </div>
          </div>
        </div>
        <Keyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          layoutName="default"
          layout={{
            default: quiz?.keyboardType
              ? KEYBOARD_TYPES[quiz?.keyboardType]
              : KEYBOARD_TYPES.ALPHABETS,
          }}
          display={{
            "{bksp}": "⌫",
            "{space}": "Space",
          }}
          physicalKeyboardHighlight={true}
          onChange={(input) => {
            if (isDisabled) return;
            setInput(input);
          }}
          onKeyPress={onKeyPress}
          theme={"hg-theme-default myTheme1"}
          disab
        />
      </>
    );
};

export default KeyboardInput;