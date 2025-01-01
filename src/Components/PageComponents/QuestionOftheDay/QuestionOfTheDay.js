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
import alertIconExclamationAnimation from "../../../assets/animations/alert-icon-exclamation.json";
import { useAuth } from "../../../providers/auth-provider";
import { RenderGameContainer } from "./RenderGameContainer";
import { RenderHintsaAndOptions } from "./HintsContainer";
import { RenderResponseComponent } from "./RenderResponseComponent";
import { QODHeader } from "./QODHeader";
const GAME_TIMER = 30;

const QuestionOfTheDay = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedGrade, setSelectedGrade] = useState("Beginner");
    const [selectedSubject, setSelectedSubject] = useState("Maths");
    const [questionOfTheDayData, setQuestionOfTheDay] = useState({});
    const [gradeSubjectSelected, setGradeSubjectSelected] = useState(false);
    const [questionCompleted, setQuestionCompleted] = useState(false);
    const [input, setInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [score, setScore] = useState(0);
    const [imageLoadSuccess, setImageLoadSuccess] = useState(false);
    const [showCategoeryPopup, setShowCategoeryPopup] = useState(false);
    const [showSubmitAnswerPopup, setShowSubmitAnswerPopup] = useState(false);

    const [leaderboardData, setLeaderboardData] = useState([]);
    const gradeOptions = [
        { value: "1", label: "Beginner" },
        { value: "2", label: "Intermediate" },
        { value: "3", label: "Pro" },
    ];
    const subjectOptions = [
        { value: "Maths", label: "Maths" },
        { value: "GK", label: "GK" },
    ];
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    const loggedInUser = !!userId && !!token;

    const timeRef = useRef();
    useEffect(() => {

        async function getQuestionOfTheDay() {
            if (!gradeSubjectSelected) {
                return;
            }
            //get the question of the day
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/questionOfTheDay/get-todays-question`,
                {
                    subject: selectedSubject, userId,
                    level: selectedGrade === "Beginner" ? "1" : selectedGrade === "Intermediate" ? "2" : "3"
                });

            setQuestionOfTheDay(response.data.data);

        }
        getQuestionOfTheDay();

        getLeaderboardData();

    }, [gradeSubjectSelected]);

    async function getLeaderboardData() {
        const userId = localStorage.getItem("userId");
        const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/questionOfTheDay/get-leaderboard-list`,
            { grade: selectedGrade, subject: selectedSubject, userId });
        setLeaderboardData(response.data.data);
    }


    async function updateQuestionResponseAndLeaderboard(input, score, questionCompleted, timeLeft) {
        await updateQuestionResponse(input, score, questionCompleted, timeLeft);
        await getLeaderboardData();
    }

    async function updateQuestionResponse(input, score, questionCompleted, timeLeft) {
        if (questionCompleted) {
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/questionOfTheDay/add-question-response`, {
                ...questionOfTheDayData,
                response: input ? input : "",
                score: score ? score : 0,
                ...(loggedInUser ? { userId } : {}),
                ...(loggedInUser ? { school: user?.school } : {}),
                ...(loggedInUser ? { grade: user?.grade } : {}),
                ...(loggedInUser ? { city: user?.city } : {}),
                ...(loggedInUser ? { firstName: user?.firstName } : {}),
                ...(loggedInUser ? { lastName: user?.lastName } : {}),
                correctAnswer: score ? true : false,
                responseTime: GAME_TIMER - timeLeft,

            });

            if (!loggedInUser) {
                localStorage.setItem("QODResponseDocumentId", response.data.data);
            }

            //set the documentId from the response in the localstorage if userId is not present

            //get the updated leadeboard data and update in ui..
        }

    }




    const failedAttempt = () => {
        updateQuestionResponse("", 0, true, 0);
        setQuestionCompleted(true);
        setScore(0);
    }

    const handleSubmitAnswer = (input) => {
        const answer = questionOfTheDayData.answer;
        if (input.toLowerCase() === answer[0].toLowerCase()) {
            const timeLeft = timeRef.current;
            setQuestionCompleted(true);
            setInput(input);
            setScore(timeLeft);
            setTimeLeft(timeLeft);
            updateQuestionResponseAndLeaderboard(input, timeLeft, true, timeLeft);
        }
        else {
            setInput(input);
            failedAttempt();
            const timeLeft = timeRef.current;
            setTimeLeft(timeLeft);
            updateQuestionResponse(input, 0, true, timeLeft);
        }
        setShowSubmitAnswerPopup(true);
        setTimeout(() => {
            setShowSubmitAnswerPopup(false);
        }, 4000);
    }

    const handleSelectGrade = (value) => {
        const corresponding = gradeOptions.find((grade) => grade.value === value);
        setSelectedGrade(corresponding.label);
    }


    const handleSignUp = async () => {
        setShowCategoeryPopup(true);
    }

    const renderCategoryPopup = () => {
        return (
            <div>
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1000,

                    }}
                    onClick={() => setShowCategoeryPopup(false)
                    }
                />

                <div
                    style={{
                        width: "70%",
                        color: "white",
                        boxShadow: 24,
                        textAlign: "center",
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#3a3a3a',
                        padding: '20px',
                        borderRadius: '10px',
                        zIndex: 9999,
                        maxWidth: '600px',
                    }}
                >
                    Select one
                    <div className="flex  flex-col justify-center items-center gap-2  md:gap-4 pt-4">
                        <div className="flex gap-2 md:gap-4">
                            <AppButton
                                variant="rectangularPrimary"
                                onClick={() => {
                                    navigate("/register?l=S")
                                }}
                                className="w-[100px]"
                            >
                                Student
                            </AppButton>

                            <AppButton
                                variant="rectangularPrimary"
                                onClick={() => {
                                    navigate("/register?l=S")
                                }}
                                className="w-[100px]"
                            >
                                Parent
                            </AppButton>
                        </div>
                        <AppButton
                            variant="rectangularPrimary"
                            onClick={() => {
                                navigate("/register?l=T")
                            }}
                            className="w-[100px]"
                        >

                            Teacher
                        </AppButton>
                    </div>
                </div>
            </div>
        );
    }


    const SubmitAnswerPopup = () => {
        return (
            <div>
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1000,

                    }}
                    onClick={() => setShowSubmitAnswerPopup(false)
                    }
                />

                <div
                    style={{
                        width: "70%",
                        color: "white",
                        boxShadow: 24,
                        textAlign: "center",
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#3a3a3a',
                        padding: '20px',
                        borderRadius: '10px',
                        zIndex: 9999,
                        maxWidth: '600px',
                    }}
                >
                    <div className="flex flex-col items-center justify-center gap-2 text-[14px] md:text-base">
                        {!score ? (
                            <div>
                                <Lottie
                                    animationData={alertIconExclamationAnimation}
                                    loop={false}
                                    className="aspect-square mx-auto h-[64px]"
                                />
                            </div>
                        ) : (
                            <div>
                                <Lottie
                                    animationData={greeCheckAnimation}
                                    loop={false}
                                    className="aspect-square mx-auto h-[64px]"
                                />
                            </div>
                        )}

                        <div>
                            <span>{score > 0 ? "Correct Answer!" : "Better luck next time"}</span>
                        </div>

                        <div>
                            Your Score is {score}
                        </div>
                    </div>

                </div>
            </div>
        );
    };




    const renderSelectedGradeSubject = () => {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-4">

                <span className="pb-8 text-xl"> All set? Try all questions!</span>

                <div className="w-full">
                    <span>Select difficulty Level</span>
                    <AppSelect
                        onChange={handleSelectGrade}
                        options={gradeOptions}
                        placeholder={selectedGrade}
                        className="border-primary-yellow"
                        textStyle={true}
                    />
                </div>
                <div className="w-full">
                    <span>Select Subject</span>
                    <AppSelect
                        onChange={setSelectedSubject}
                        options={subjectOptions}
                        placeholder={selectedSubject}
                        className="border-primary-yellow"
                        textStyle={true}
                    />
                </div>

                <div className="w-full flex justify-center pt-12">
                    <AppButton variant='rectangularPrimary' className="w-[120px]"
                        onClick={() => {
                            setGradeSubjectSelected(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        isLoading={gradeSubjectSelected && !imageLoadSuccess}
                        progressSize={19}
                    >
                        Start Quiz
                    </AppButton>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-start h-full w-full overflow-auto">
            <div className="h-screen flex flex-col w-full items-center justify-start max-w-[800px] bg-white ">
                {(!gradeSubjectSelected || gradeSubjectSelected && questionCompleted) &&                  
                    
                    <QODHeader>
                        <span>TODAY'S QUIZ</span>
                    </QODHeader>

                }
                <div className={`${!gradeSubjectSelected
                    ? 'h-[calc(75vh-84px)]'
                    : questionCompleted
                        ? 'h-[calc(92vh-84px)]'
                        : 'h-[100vh]'} 
                    flex flex-col items-center gap-4 w-[80vw] max-w-[400px] 
                    ${!gradeSubjectSelected
                        ? 'justify-center'
                        : 'justify-start'}`}>
                    {
                        !gradeSubjectSelected ? (
                            renderSelectedGradeSubject()
                        ) : (
                            <>
                                {!questionCompleted && !questionOfTheDayData?.playedRound ? (
                                    <>
                                        <>

                                            {Object.keys(questionOfTheDayData).length > 0 && !questionOfTheDayData.imageUrl || questionOfTheDayData.imageUrl && imageLoadSuccess ? (

                                                <QODHeader>
                                                    <Timer
                                                        duration={GAME_TIMER}
                                                        stroke={5}
                                                        timerEnd={failedAttempt}
                                                        timeRef={timeRef}
                                                        startTimer={true}
                                                        size={64}
                                                    />
                                                </QODHeader>
                                            ) : (
                                                <div className="h-screen">
                                                    <Loader />
                                                </div>
                                            )}
                                            <div className="flex flex-col h-1/2 md:h-[40%] md:mt-[3vh] items-center justify-center w-[100vw] max-w-[800px]">

                                                <div style={{ opacity: !questionOfTheDayData.imageUrl || questionOfTheDayData.imageUrl && imageLoadSuccess ? 1 : 0 }}>

                                                    <RenderGameContainer questionOfTheDayData={questionOfTheDayData} setImageLoadSuccess={setImageLoadSuccess} imageLoadSuccess={imageLoadSuccess} />
                                                </div>
                                                {(!questionOfTheDayData.imageUrl || questionOfTheDayData.imageUrl && imageLoadSuccess) && (
                                                    <div>
                                                        {questionOfTheDayData && Object.keys(questionOfTheDayData).length > 0 && (
                                                            <RenderHintsaAndOptions
                                                                currentActiveQuestion={questionOfTheDayData}
                                                                handleSubmitAnswer={handleSubmitAnswer}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                        {/* )} */}
                                    </>
                                ) : (
                                    <div>
                                        <div className="flex flex-col items-center justify-center gap-4 text-[14px] md:text-base ">
                                            <div className=" flex flex-col items-center justify-center w-full max-w-[640px]">
                                                {questionOfTheDayData?.playedRound &&

                                                    <div className="text-2xl text-center flex flex-col items-center justify-center mt-2  md:mt-4">
                                                        Already Attempted
                                                    </div>
                                                }
                                                {!questionOfTheDayData?.playedRound ? (

                                                    <RenderResponseComponent
                                                        questionOfTheDayData={{ ...questionOfTheDayData, response: input, score: score, responseTime: GAME_TIMER - timeLeft }}
                                                        endResponse={true}
                                                    />
                                                )
                                                    : (
                                                        <RenderResponseComponent
                                                            questionOfTheDayData={questionOfTheDayData}
                                                            endResponse={true}
                                                        />
                                                    )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center gap-2 bg-white">

                                            {!loggedInUser && (
                                                <div className="bg-[rgba(58,58,58,0.2)] flex flex-col items-center justify-center w-full max-w-[640px] rounded-lg mt-4 p-4">
                                                    <div className="flex flex-col items-center justify-center gap-4 text-2xl p-2 md:p-4">
                                                        <span>Join the Leaderboard</span>
                                                    </div>
                                                    <div className="flex gap-4">

                                                        <div className="flex flex-col items-center text-[12px]">
                                                            <br />
                                                            <AppButton className="w-[150px]"
                                                                onClick={handleSignUp}
                                                            >Sign Up</AppButton>
                                                        </div>

                                                        <div className="flex flex-col items-center text-[12px]">
                                                            <span>Already on Maidaan?</span>
                                                            <AppButton
                                                                className="w-[150px]"
                                                                onClick={() => navigate("/login?redirect=/questionoftheday&l=S")}
                                                            >
                                                                Login
                                                            </AppButton>
                                                        </div>
                                                        {showCategoeryPopup && renderCategoryPopup()}
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center gap-4 mt-2 md:mt-4">
                                                        <button
                                                            className="underline text-blue-500 bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none text-lg"
                                                            onClick={() => { window.location.reload(); }}
                                                        >
                                                            Back to questions
                                                        </button>

                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                        {loggedInUser && <div className="flex flex-col items-center justify-center gap-4 mt-2 md:mt-4">
                                            <button
                                                className="underline text-blue-500 bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none text-lg"
                                                onClick={() => { window.location.reload(); }}
                                            >
                                                Back to questions
                                            </button>

                                        </div>}

                                        {(!gradeSubjectSelected || questionCompleted || questionOfTheDayData?.playedRound) && <div className="w-[100vw] max-w-[600px] items-center justify-start max-w-[800px] pb-6 bg-white">
                                            <div className="flex flex-col items-center justify-start gap-4 p-4">
                                                <span className="text-2xl text-center">Leaderboard For The Month</span>
                                            </div>
                                            <Leaderboard leaderboardData={leaderboardData} gradeOptions={gradeOptions} subjectOptions={subjectOptions} />
                                        </div>}
                                        {showSubmitAnswerPopup && SubmitAnswerPopup()}
                                    </div>
                                )}
                            </>
                        )
                    }

                </div>


            </div >

            {(!gradeSubjectSelected) && <div className="w-[100vw] max-w-[600px] items-center justify-start max-w-[800px] pb-6 bg-white">
                <div className="flex flex-col items-center justify-start gap-4 p-4">
                    <span className="text-2xl text-center">Leaderboard For The Month</span>
                </div>
                <Leaderboard leaderboardData={leaderboardData} gradeOptions={gradeOptions} subjectOptions={subjectOptions} />
            </div>}
            {showSubmitAnswerPopup && SubmitAnswerPopup()}



        </div >

    );
}

export default QuestionOfTheDay;
