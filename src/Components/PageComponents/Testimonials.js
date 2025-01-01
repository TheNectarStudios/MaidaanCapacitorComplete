import { Swiper, SwiperSlide } from 'swiper/react';
import './Ticker.css';
import { Box, Grid } from '@mui/material';


const TestimonialItem = ({ icon, header, subHeader, comment, displayImage }) => {
    return (
        <div className="flex flex-col items-start justify-start rounded-lg relative">
            {console.log(icon, "icon")}
            {displayImage && <img
                src={icon}
                alt="icon"
                className="w-40 h-40 z-10 relative ml-[10vw] md:ml-[80px]"
                style={{ marginBottom: '-48px' }}
            />}
            <div className="h-[237px] bg-[#3a3a3a] bg-opacity-50 rounded-lg z-0 flex flex-col items-start p-2 text-[#F5F5F5] ">
                <p className="text-[16px] md:text-[24px] text-[#ccf900]  m-2 mt-4 mb-2">{header}</p>
                {subHeader && <p className="text-[12px] md:text-[14px] m-2 mt-0">{subHeader}</p>}
                <p className="text-[14px] md:text-[16px] m-2">{comment}</p>
            </div>
        </div>
    );
};

const TestimonialsSlider = ({ listOfTestimonials, displayImage = true }) => {

    return (
        <Swiper
            spaceBetween={40}
            slidesPerView={1.2}
            navigation={false}
            pagination={{ clickable: true }}
            style={{ height: '279px', width: '100%' }}
            breakpoints={{
                500: {
                    slidesPerView: 1.5,
                    spaceBetween: 20,
                    style: { height: '200px' }

                },
                700: {
                    slidesPerView: 1.7,
                    spaceBetween: 20,
                    style: { height: '200px' }

                },
                1100: {
                    slidesPerView: 2.2,
                    spaceBetween: 20,
                    style: { height: '200px' }

                },
            }}
        >
            {listOfTestimonials.map((tournament, index) => (
                <SwiperSlide key={index} style={{ overflow: 'hidden', borderRadius: '10px' }}>
                    <div style={{ height: '100%' }}>
                        <TestimonialItem icon={tournament.icon} header={tournament.header} subHeader={tournament.subHeader} comment={tournament.comment} displayImage={displayImage} />
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
};


export const Testimonials = () => {

    const listOfStudentTestimonials = [
        { icon: `/Assets/Images/testimonialImage2.svg`, header: `Riddham`, subHeader: `Student`, comment: `I like the competitiveness in Maidaan tournaments, the best part is the level of questions that allows me to grasp new topics. Maidaan tests our awareness, keeping calm under pressure and our subject knowledge, this truly makes Maidaan unique.` },
        { icon: `/Assets/Images/testimonialImage4.svg`, header: `Rudra Singh`, subHeader: `Student`, comment: `Its been 2 years since I have playing on Maidaan - I love it because of its unique formats and questions, and the reward system keeps me motivated rather than grades.` },
        { icon: `/Assets/Images/testimonialImage3.svg`, header: `Kaamya Agarwal`, subHeader: `Student`, comment: `Maidaan offers a great blend of learning and competition, it is the best way to learn without feeling pressurised. It provides immediate feedback and friendly competition, a refreshing change from exams.` },
        { icon: `/Assets/Images/testimonialImage1.svg`, header: `Kalyani Gunjal`, subHeader: `Student`, comment: `Maidaan gives me an opportunity to show my talent and test my knowledge. Without the mental pressure of exams, on Maidaan students like me can play confidently and win exciting prizes.` },
    ];

    const listOfParentTestimonials = [
        { icon: `/Assets/Images/testimonialImage2.svg`, header: `Riddham's mother`, comment: `My son has immensely enjoyed his time on Maidaan. The tournaments can be played from anywhere and have become an essential part of our weekend plans. Riddham gets motivated to read about the diverse subjects covered on Maidaan, enhancing his knowledge` },
        { icon: `/Assets/Images/testimonialImage3.svg`, header: `Rudra's mother`, comment: `Maidaan has been instrumental in boosting my child's confidence. Since the quizzes are across different schools in India, it has broadened his perspectives and developed a sense of healthy competition in him, while at the same time enhancing his critical thinking` },
        { icon: `/Assets/Images/testimonialImage1.svg`, header: `Kaamya's mother`, comment: `Kaamya has been playing Maidaan since 2023. As a parent I always want my child to gain knowledge beyond school textbooks and through Maidaan she has explored a wide range of topics. She is more confident and inquisitive to learn more. Kaamya always waits eagerly for the Maidaan weekends!` },
        { icon: `/Assets/Images/testimonialImage4.svg`, header: `Kalyani's father`, comment: `Maidaan tournaments have enhanced my daughter's General Knowledge tremendously and since they happen over the weekends they are very convenient and do not interfere with her school work!` },
    ];

    return (
        <div className="flex flex-col items-center justify-center w-full md:w-[80%] h-full gap-[40px] mt-[40px] ml-[8px]">

            <div className="flex flex-col items-center justify-center w-full">
                <span className="text-2xl md:text-[32px]">Why Students LOVE Maidaan</span>
            </div>

            <TestimonialsSlider listOfTestimonials={listOfStudentTestimonials} displayImage={false} />
            <Box
                sx={{
                    width: "100%",
                    minHeight: "50vh",
                    flexGrow: 1,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    zIndex: "0",
                }}
                id="watch-demo"
            >

                <Grid container spacing={2}>
                    <Grid
                        item
                        xs={12}
                        md={12}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: { xs: "8px", md: "0" },
                        }}
                    >
                        <iframe
                            width="100%"
                            height="315"
                            src="https://www.youtube.com/embed/M2Vd-fM9tn0"
                            title="YouTube video player"
                            allowFullScreen
                            style={{ border: 0, maxWidth: "560px" }}
                        ></iframe>
                    </Grid>
                </Grid>
            </Box>

            <div className="flex flex-col items-center justify-center w-full">
                <span className=" text-2xl md:text-[32px]">Why Parents LOVE Maidaan</span>
            </div>

            <TestimonialsSlider listOfTestimonials={listOfParentTestimonials} displayImage={false} />

            <Box
                sx={{
                    width: "100%",
                    minHeight: "50vh",
                    flexGrow: 1,
                    backgroundImage: "url('./Assets/Images/pattern.png')",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    zIndex: "0",
                }}
                id="watch-demo"
            >
                <Grid container spacing={2}>
                    <Grid
                        item
                        xs={12}
                        md={12}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: { xs: "8px", md: "0" },
                        }}
                    >
                        <iframe
                            width="100%"
                            height="315"
                            src="https://www.youtube.com/embed/UkBhAdcegL8"
                            title="YouTube video player"
                            allowFullScreen
                            style={{ border: 0, maxWidth: "560px" }}
                        ></iframe>
                    </Grid>
                </Grid>
            </Box>
        </div>
    );
};

export default Testimonials;
