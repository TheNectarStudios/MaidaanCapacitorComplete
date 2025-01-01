import { useEffect, useState, React, useRef } from "react";
import { GAME_FORMATS, KEYBOARD_TYPES, calculateAppHeight } from "../../../Constants/Commons";
import FlashImagesTournamentContainer from "../../Games/SpellBee/GameComponents/FlashImagesTournamentContainer";
import { ImageContainer } from "../../Games/SpellBee/GameComponents/ImageContainer";
import { ImageJumbledContainer } from "../../Games/SpellBee/GameComponents/ImageJumbledContainer";
import { JumbledWord } from "../../Games/SpellBee/GameComponents/JumbledWord";
import { MCQContainer } from "../../Games/SpellBee/GameComponents/MCQContainer";
import { QuizContainer } from "../../Games/SpellBee/GameComponents/QuizContainer";
import axios from "axios";
import { result, set } from "lodash";
import { HintsContainer } from "../../Games/SpellBee/GameComponents/HintsContainer";
import AudioContainer from "../../Games/SpellBee/GameComponents/AudioContainer";
import AudioClipContainer from "../../Games/SpellBee/GameComponents/AudioClipContainer";
import { MCQKeyboard } from "../../Games/SpellBee/GameComponents/MCQKeyboard";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import Button from "@mui/material/Button";
import { Keyboard } from "@mui/icons-material";
import AppSelect from "../../Common/AppSelect";
import AppButton from "../../Common/AppButton";
import { Timer } from "../../Games/SpellBee/GameComponents/CountdownTimer";
import Loader from "../Loader";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaderboard } from "./Leaderboard";
import Lottie from "lottie-react";
import greeCheckAnimation from "../../../assets/animations/green-check.json";
//alertIconExclamationAnimation
import alertIconExclamationAnimation from "../../../assets/animations/alert-icon-exclamation.json";
import { useAuth } from "../../../providers/auth-provider";
import { renderGameContainer } from "./RenderGameContainer";

export const RenderHintsaAndOptions = ({ currentActiveQuestion, handleSubmitAnswer }) => {

    const [input, setInput] = useState("");
    const keyboard = useRef();

    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const resizeListener = () => {
            setIsDesktop(window.innerWidth > window.innerHeight);
        };
        window.addEventListener("resize", resizeListener);
        return () => {
            window.removeEventListener("resize", resizeListener);
        };
    }, []);


    const renderSlowInternetBanner = () => {
        return (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <span>Please wait while we get your question</span>
            </div>
        );
    };//


    const clearInput = () => {
        keyboard?.current?.clearInput();
        setInput("");
    };

    //const inputBox = React.useRef();

    const isInternetSlow = false;
    const enableSkip = false;
    const ROUND_FORMAT = currentActiveQuestion.format;
    const keyboardType = currentActiveQuestion.keyboardType;
    //console.log("currentActiveQuestion", currentActiveQuestion);
    console.log("ROUND_FORMAT", ROUND_FORMAT);
    console.log("keyboardType", keyboardType);
    return (
        <>
            {!isInternetSlow && (
                <HintsContainer
                    question={currentActiveQuestion}
                    roundFormat={ROUND_FORMAT}
                />
            )}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "auto",
                }}
            >
                <div
                    style={{
                        maxWidth: "800px",
                        margin: "15px auto 0 auto",
                        position: "absolute",
                        bottom: "0",
                        width: "100%",
                    }}
                >
                    {ROUND_FORMAT === GAME_FORMATS.AUDIO ? (
                        isInternetSlow ? (
                            renderSlowInternetBanner()
                        ) : (
                            <div>
                                <AudioContainer
                                    question={currentActiveQuestion}
                                />
                            </div>
                        )
                    ) : (
                        <></>
                    )}
                    {ROUND_FORMAT === GAME_FORMATS.AUDIOCLIP ? (
                        isInternetSlow ? (
                            renderSlowInternetBanner()
                        ) : (
                            <div>
                                <AudioClipContainer
                                    question={currentActiveQuestion}
                                />
                            </div>
                        )
                    ) : (
                        <></>
                    )}
                    {keyboardType === GAME_FORMATS.MCQ ? (
                        isInternetSlow ? (
                            <></>
                        ) : (
                            <MCQKeyboard
                                question={currentActiveQuestion}
                                onSubmit={handleSubmitAnswer}
                                enableSkip={enableSkip}
                            />
                        )
                    ) : (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                        gap: "6px",
                                        width: "100%",
                                        padding: "0 10px",
                                    }}
                                >
                                    {enableSkip ? (
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                textDecoration: "underline",
                                                minWidth: "fit-content",
                                            }}
                                        // onClick={() =>
                                        //   handleSubmitAnswer(input, true)
                                        // }
                                        >
                                            Skip {">>"}
                                        </span>
                                    ) : (
                                        <></>
                                    )}
                                    <div
                                        style={{
                                            position: "relative",
                                            display: "flex",
                                            width: "100%",
                                            gap: "10px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "100%",
                                                position: "relative",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                //ref={inputBox}
                                                {...(!isDesktop
                                                    ? { readOnly: true }
                                                    : {})}
                                                style={{
                                                    border: "1px solid #CCF900",
                                                    outline: "none",
                                                    // minWidth: "40vw",
                                                    // height: "2.5vh",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "10px",
                                                    width: "100%",
                                                    backgroundColor: "#F5F5F5",
                                                    borderRadius: "6px",
                                                    boxShadow:
                                                        "0px 6px 10px -3px #80808029",
                                                    fontWeight: "600",
                                                    color: "grey",
                                                    fontSize: "20px",
                                                    textAlign: "center",
                                                }}
                                                defaultValue={input}
                                                onChange={(e) => setInput(e.target.value)}
                                            />
                                            {input && input.length > 0 && (
                                                <div
                                                    style={{
                                                        fontSize: "18px",
                                                        color: "black",
                                                        display: "flex",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        position: "absolute",
                                                        right: "3px",
                                                        zIndex: "10",
                                                    }}
                                                >
                                                    <HighlightOffIcon
                                                        onClick={clearInput}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="contained"
                                            //ref={submitBtn}
                                            //className="mainButton submitBtn"
                                            onClick={() => handleSubmitAnswer(input)}
                                        >
                                            ⏎
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Keyboard
                                keyboardRef={(r) => (keyboard.current = r)}
                                layoutName="default"
                                layout={{
                                    default: keyboardType
                                        ? KEYBOARD_TYPES[keyboardType]
                                        : KEYBOARD_TYPES.ALPHABETS,
                                }}
                                display={{
                                    "{bksp}": "⌫",
                                    "{space}": "Space",
                                }}
                                physicalKeyboardHighlight={true}
                                //onChange={onChange}
                                //onKeyPress={handleSubmitAnswer}
                                theme={"hg-theme-default myTheme1"}
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}