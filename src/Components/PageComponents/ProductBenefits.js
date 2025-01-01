
export const ProductBenefitsItem = ({ header, description, icon }) => {
    return (
        <div className="flex items-center justify-center w-[90%] p-2 m-2 md:p-[20px] md:m-[20px] rounded-xl bg-[#ffffff] bg-opacity-80 h-[196px]">
            <div className="flex flex-col items-center justify-center w-2/5 h-full">
                <img src={icon} alt="icon" className="w-[100px] md:w-[139px]" />
            </div>
            <div className="flex flex-col items-start justify-center w-3/5 h-full">
                <h3 className="text-[20px] md:text-[24px] font-bold ml-4">{header}</h3>
            </div>
        </div>
    );
};


export const ProductBenefits = () => {

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <span className="text-center text-2xl md:text-[32px] p-6 pt-0 pb-10 w-full"> The Maidaan Advantage</span>

            <div className="flex flex-col items-center justify-center w-full h-full bg-[#CCF900] bg-opacity-50">

                <div className="flex flex-col sm:flex-row items-center justify-center w-full h-1/2 mt-2">

                    <ProductBenefitsItem icon={"/Assets/Icons/mindset_benifit.svg"} header={"Build a competitive mindset"} description={["Know where you stand", "Represent your school"]}/>

                    <ProductBenefitsItem icon={"/Assets/Icons/problemSolving_benifit.svg"} header={"Master problem solving"} description={["Real world application-based quizzes", "Concepts and difficulty as per grade"]} />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center w-full h-1/2 mb-2">

                    <ProductBenefitsItem icon={"/Assets/Icons/awards_benifit.svg"} header={"Play hard and win awards"} description={["Certificates and awards every month", "Recognition from school"]} />

                    <ProductBenefitsItem icon="/Assets/Icons/convenient_benifit.svg" header={"Do all of this from home"} description={["All from home, no need to go anywhere", "Less than 30 mins over a weekend"]} />
                </div>
            </div>
        </div>
    );

}
