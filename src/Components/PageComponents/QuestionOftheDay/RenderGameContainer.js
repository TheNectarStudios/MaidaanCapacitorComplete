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

export const RenderGameContainer = ({questionOfTheDayData, setImageLoadSuccess, imageLoadSuccess}) => {

    let gameFormat = <></>;
    const ROUND_FORMAT = questionOfTheDayData.format;
    switch (ROUND_FORMAT) {
        case GAME_FORMATS.JUMBLE:
            gameFormat = (
                <div className="w-full h-full flex items-center">
                    <JumbledWord
                        question={questionOfTheDayData}
                    />
                </div>
            );
            break;
        case GAME_FORMATS.IMAGE:
            gameFormat = (
                <div>
                    <ImageContainer
                        currentImageUrl={questionOfTheDayData.imageUrl}
                        question={questionOfTheDayData}
                        isImageLoaded={imageLoadSuccess}
                        setIsImageLoaded={setImageLoadSuccess}
                    />
                </div>
            );
            break;
        case GAME_FORMATS.AUDIOCLIP:
        case GAME_FORMATS.QUIZ:
            gameFormat = (
                <div>
                    <QuizContainer
                        question={questionOfTheDayData}
                    />
                </div>
            );
            break;
        case GAME_FORMATS.MCQ:
            gameFormat = (
                <div style={{ marginTop: "16vh" }}>
                    <MCQContainer
                        question={questionOfTheDayData}
                    />
                </div>
            );
            break;
        case GAME_FORMATS.IMAGE_JUMBLED:
            gameFormat = (
                <div>
                    <ImageJumbledContainer
                        isImageLoaded={imageLoadSuccess}
                        currentImageUrl={questionOfTheDayData.imageUrl}
                        setIsImageLoaded={setImageLoadSuccess}
                        question={questionOfTheDayData}
                    />
                </div>
            );
            break;
        case GAME_FORMATS.FLASH_IMAGES:
            gameFormat = (
                <div>
                    <FlashImagesTournamentContainer

                        question={questionOfTheDayData}
                    />
                </div>
            );
            break;

        default:
            break;
    }
    return gameFormat;
};