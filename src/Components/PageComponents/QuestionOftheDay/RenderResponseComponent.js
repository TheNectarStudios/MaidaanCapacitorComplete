import AppButton from "../../Common/AppButton"


export const RenderResponseComponent = ({ questionOfTheDayData, endResponse = false }) => {
    return (
        <div className="flex flex-col items-center justify-center w-[100%] bg-[rgba(58,58,58,0.2)] rounded-lg mt-4 p-2 md:p-4">
            <div className="flex flex-col justify-center items-start gap-3 md:gap-6 mt-2 p-2 md:p-4">
                {!endResponse && <span className="text-2xl">
                    You Have Attempted
                </span>}
                <div className="flex items-center justify-center w-[100%]">
                {questionOfTheDayData.imageUrl && (
                    <img
                        src={questionOfTheDayData.imageUrl}
                        alt="Question"
                        style={{ width: '60%' }}
                    />
                )}
                </div>

                <span>
                    <span className="font-extrabold">
                    {"Question: "}
                    </span>
                    <span>
                    {questionOfTheDayData.question}
                    </span>
                </span>

                <div className="grid grid-cols-2 gap-2 md:gap-5">
                    <div>
                        <span className="font-bold">Correct Answer: </span>
                        <span>{questionOfTheDayData.answer[0]}</span>
                    </div>
                    <div>
                        <span className="font-bold">Your Response: </span>
                        <span>{questionOfTheDayData.response}</span>
                    </div>
                    <div>
                        <span className="font-bold">Time Taken: </span>
                        <span>{questionOfTheDayData.responseTime}s</span>
                    </div>
                    <div>
                        <span className="font-bold">You Scored: </span>
                        <span>{questionOfTheDayData.score}</span>
                    </div>
                </div>

                {!!questionOfTheDayData.solution && questionOfTheDayData.solution !=="N/A" && <span>
                    <span className="font-extrabold">
                    {"Solution: "}
                    </span>
                    <span>
                    {questionOfTheDayData.solution}
                    </span>
                </span>}


                {!endResponse && <AppButton
                    buttonText="Next"
                    onClick={() => { window.location.reload() }}
                    className="bg-primary-yellow text-black"
                >
                    Back to questions
                </AppButton>}
            </div>


        </div>
    )
}