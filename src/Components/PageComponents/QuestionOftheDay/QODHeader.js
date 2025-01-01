
export const QODHeader = ({ children }) => {
    return (
        <div className="grid grid-cols-4 items-center justify-between h-[64px] md:h-[84px] bg-[#3a3a3a] w-[100vw] max-w-[800px] text-2xl">
            <div className="col-span-1 flex justify-center">
                <img src="Assets/Icons/dps1.png" alt="quiz-icon" className="h-12 md:h-16" />
            </div>
            {/* Conditionally render the middle component if children are provided */}
            <div className="col-span-2 flex justify-center text-white">

            {children ? (
                    children
            ) : null}
            </div>
            <div className={`col-span-1 flex justify-center`}>
                <img src="Assets/Icons/dps2.png" alt="quiz-icon" className=" h-16 md:h-[84px]" />
            </div>
        </div>
    );
};