import { useNavigate } from "react-router-dom";
import { backButtonHandler } from "../../../Constants/Commons";
import Layout from "../../Common/Layout";
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from "../../../providers/auth-provider";
import { getHasUserVoted, getPodiumDetails } from "../../../services/child";
import PodiumBar from "./PodiumBar";
import SkeletonLoader from "../../Common/SkeletonLoader";
import YourClass from "../ProfilePage/YourClass";
import { Swiper, SwiperSlide } from 'swiper/react';
import { set } from "lodash";
import { PlayerHeader } from "../../Games/SpellBee/NewLobby";
import ProfileHeader from "../ProfilePage/ProfileHeader";
import AppButton from "../../Common/AppButton";
import { returnEncryptedUserId } from "../../utils";

const ClassJamPage = () => {
  const navigate = useNavigate();
  const { user, getUserDetails } = useAuth();
  const [loading, setLoading] = useState(true);
  const [podiumData, setPodiumData] = useState(null);
  const [selectedPodium, setSelectedPodium] = useState(null);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideChange, setSlideChange] = useState(false);
  const [userVoted, setUserVoted] = useState(false);
  const [voteCardsIndex, setVoteCardsIndex] = useState([]);
  const [peopleYouMayKnowList, setPeopleYouMayKnowList] = useState([]);
  const PrevIcon = '/Assets/Icons/swiper-prev.svg';
  const NextIcon = '/Assets/Icons/swiper-next.svg';

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const goToSlide = (index) => {
    if (swiperInstance) {
      swiperInstance.slideTo(index);
    }
  };


  const handleVoteNowClick = () => {
    //get random user id
    const randomUser = peopleYouMayKnowList[Math.floor(Math.random() * peopleYouMayKnowList.length)];
    navigate(`/profile/${returnEncryptedUserId(randomUser.id)}`);
  }
  


  useEffect(() => {
    const fetch = async () => {
      const response = await getPodiumDetails();
      setLoading(false);
      const { results } = response;
      //sort the response based on the category
      results.sort((a, b) => a.category.localeCompare(b.category));
      setPodiumData(results);
      setSelectedPodium(results?.[0]);
      let categoryWiseFirstIndex = getCategoryWiseFirstIndex(results);
      setVoteCardsIndex(categoryWiseFirstIndex);
    };

    const getCategoryWiseFirstIndex = (results) => {
      let distinctCategories = results.map((item) => item.category);
      distinctCategories = [...new Set(distinctCategories)];

      let categoryWiseFirstIndex = {};
      distinctCategories.forEach((category) => {
        categoryWiseFirstIndex[category] = results.findIndex((item) => item.category === category);
      });

      return categoryWiseFirstIndex;
    };

    const fetchUserVoted = async () => {
      const response = await getHasUserVoted(user?.id);
      const {results, hasVoted} = response;
      setUserVoted(hasVoted);
      if(!hasVoted){
        setPodiumData(results);
        setSelectedPodium(results?.[0]);
        setLoading(false);
        let categoryWiseFirstIndex = getCategoryWiseFirstIndex(results);
        setVoteCardsIndex(categoryWiseFirstIndex);
      }

      
    };

    fetch();
    fetchUserVoted();
  }, []);


  useEffect(() => {
    const index = currentSlideIndex ?? 0;

    if (podiumData && !slideChange) {
      goToSlide(index); // Ensure the carousel moves to the correct slide
    }
    else if (slideChange) {
      setSelectedPodium(podiumData?.[index]);
    }
  }, [currentSlideIndex, podiumData, slideChange]);

  return (
    // <Layout
    //   showArenaHeader
    //   headerText="Class Corner"
    //   //layoutClassName="bg-[#3a3a3a]"
    //   onBackClick={() => backButtonHandler(navigate, window.location)}
    // >
    <div className="text-white flex flex-col items-center gap-6 h-full w-full overflow-auto pt-4">
      <div className="w-screen fixed top-0 left-0 z-50">
        <ProfileHeader headerText={"Class Adda"} />
      </div>
      <div className="text-white flex flex-col items-center gap-6 h-full w-full overflow-auto pt-[64px]">
        <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
          <div className="flex gap-5 items-center text-[18px]">Class Favourites</div>
          {loading ? (
            <div className="h-44 w-full p-4 text-center">
              <SkeletonLoader
                bgColor="#5050504d"
                pulseColor="#3a3a3aa4"
                className="rounded-lg mb-4"
              />
              {/* Fetching your rank */}
            </div>
          ) : (
            <div className="max-w-[100vw] overflow-hidden">
              <div className='flex felx-col justify-center items-center gap-5'>
                <div className='flex  flex-col justify-center items-center gap-5'>
                  <div className='flex justify-center items-center gap-5'>
                    <AppButton
                      className={`border-3 ${selectedPodium?.category === "Acads" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                      variant='rectangularSecondary' onClick={() => goToSlide(voteCardsIndex["Acads"])}>
                      Acads
                    </AppButton>
                    <AppButton
                      className={`border-3 ${selectedPodium?.category === "Personality" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                      variant='rectangularSecondary'
                      onClick={() => goToSlide(voteCardsIndex["Personality"])}
                    >
                      Personality
                    </AppButton>

                    <AppButton
                      className={`border-3 ${selectedPodium?.category === "Talents" ? "bg-white text-grey border-white" : "border-white text-white"}`}
                      variant='rectangularSecondary' onClick={() => goToSlide(voteCardsIndex["Talents"])}>
                      Talents
                    </AppButton>
                  </div>

                </div>
              </div>
              <div className="flex w-full justify-between p-4 pt-6 max-w-[100vw]">

                <div className="custom-swiper-button-prev -left-10 z-10" ref={prevRef}>
                  <img src={PrevIcon} alt="prev-icon" className="block" />
                </div>
                {selectedPodium?.card}
                <div className="custom-swiper-button-next -right-10 z-10" ref={nextRef}>
                  <img src={NextIcon} alt="next-icon" className="block" />
                </div>            </div>
              <div className="flex flex-col gap-6 w-full p-4 pt-0 bg-[#4e4e4e] max-w-[100vw] podiumlass">
                <div className="h-[250px] rounded-xl">
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
                        setSlideChange(true);
                      });
                    }}
                  >
                    {podiumData?.map((cardData, index) => (
                      <SwiperSlide key={index} className=''>
                        {userVoted && selectedPodium && selectedPodium?.second ? (<div className="mx-auto rounded-xl">
                          <div className="flex justify-center items-end relative mt-[135px]">
                            {cardData?.third && <PodiumBar data={cardData?.third} type="third" />}
                            {cardData?.second && <PodiumBar data={cardData?.second} type="second" />}
                            {cardData?.first && <PodiumBar data={cardData?.first} type="first" />}
                          </div>
                        </div>) : (
                          <div className="w-[100%] h-[250px] bg-[#3a3a3a] flex flex-col justify-center items-center gap-4" >
                          <div className="text-center"> Vote for your friends to unlock </div>
                          <AppButton
                            onClick={() => handleVoteNowClick()}
                          >
                            Vote Now
                          </AppButton>
                          </div>
                        )}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            </div>
          )}
        </div>
        <YourClass headerTop={false} setPeopleYouMayKnowList={setPeopleYouMayKnowList}/>
      </div>
    </div>

  );
};

export default ClassJamPage;
