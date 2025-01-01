import React, { useEffect, useRef, } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css'; // Ensure Swiper styles are imported
import ProfileVoteCard from './ProfileVoteCards';
import AppButton from '../../Common/AppButton';
import { useSearchParams } from 'react-router-dom';

const RenderProfileVoteCards = ({ user, userProfileDetails, profileVoteCards, setProfileVoteCards, setVoteCardsFilter, voteCardsFilter, voteCardsIndex, setViewVotesPopup, friendStatus, setAddFriendPopup }) => {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [swiperInstance, setSwiperInstance] = React.useState(null);
    const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
    const PrevIcon = '/Assets/Icons/swiper-prev.svg';
    const NextIcon = '/Assets/Icons/swiper-next.svg';

    const goToSlide = (index) => {
        if (swiperInstance) {
            swiperInstance.slideTo(index);
        }
    };

    useEffect(() => {
        if (profileVoteCards.length > 0) {
            setVoteCardsFilter(profileVoteCards[currentSlideIndex]?.category);
        }
    }, [currentSlideIndex])


    return (
        <div className='flex flex-col gap-7 w-full h-full pt-[12px]'>

            <div className="flex justify-between items-center">
                <div className="custom-swiper-button-prev -left-10 z-10" ref={prevRef}>
                    <img src={PrevIcon} alt="prev-icon" className="block" />
                </div>
                <div className="w-[250px] h-[100px] rounded-xl">
                <Swiper
                    slidesPerView={1}
                    loop={true} // Enable infinite scrolling
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                    }}
                    onSwiper={(swiper) => {
                        setSwiperInstance(swiper); // Save the Swiper instance
                        if (prevRef.current && nextRef.current) {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }
                        swiper.on('slideChange', () => {
                            const currentIndex = swiper.realIndex; // Use realIndex for loop mode
                            setCurrentSlideIndex(currentIndex);
                        });
                    }}
                >
                    {profileVoteCards.map((cardData, index) => (
                        <SwiperSlide key={index} className=''>
                            <div className="w-[250px] h-[100px] mx-auto rounded-xl">
                                
                                <ProfileVoteCard
                                    user={user}
                                    userProfileDetails={userProfileDetails}
                                    cardData={cardData}
                                    profileVoteCards={profileVoteCards}
                                    setProfileVoteCards={setProfileVoteCards}
                                    setViewVotesPopup={setViewVotesPopup}
                                    friendStatus={friendStatus}
                                    setAddFriendPopup={setAddFriendPopup}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
                </div>
                <div className="custom-swiper-button-next -right-10 z-10" ref={nextRef}>
                    <img src={NextIcon} alt="next-icon" className="block" />
                </div>
            </div>
            <div className='flex felx-col justify-center items-center gap-5'>
                <div className='flex  flex-col justify-center items-center gap-5'>
                    <div className='flex justify-center items-center gap-5'>
                        <AppButton
                            className={`border-3 ${voteCardsFilter === "Acads" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                            variant='rectangularSecondary' onClick={() => goToSlide(voteCardsIndex["Acads"])}>
                            Acads
                        </AppButton>
                        <AppButton
                            className={`border-3 ${voteCardsFilter === "Personality" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                            variant='rectangularSecondary'
                            onClick={() => goToSlide(voteCardsIndex["Personality"])}
                        >
                            Personality
                        </AppButton>

                        <AppButton
                            className={`border-3 ${voteCardsFilter === "Talents" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                            variant='rectangularSecondary' onClick={() => goToSlide(voteCardsIndex["Talents"])}>
                            Talents
                        </AppButton>
                    </div>

                    {/* <div className='flex justify-center items-center gap-5 pt-[4px]'>
                        <AppButton
                            className={`border-3 ${voteCardsFilter === "Emotional Quotient (Heart)" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                            variant='rectangularSecondary' onClick={() => goToSlide(voteCardsIndex["Emotional Quotient (Heart)"])}>
                            Emotional
                        </AppButton>
                        <AppButton
                            className={`border-3 ${voteCardsFilter === "Social Quotient (Vibe)" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                            variant='rectangularSecondary' onClick={() => goToSlide(voteCardsIndex["Social Quotient (Vibe)"])}>
                            Social Vibe
                        </AppButton>
                    </div> */}
                </div>
            </div>


        </div>
    );
}

export default RenderProfileVoteCards;