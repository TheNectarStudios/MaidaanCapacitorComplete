import SwiperCore from 'swiper';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';

import ScrapBookCards from './ScrapBookCards';

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);


const VerticalCarousel = ({ userScrapBookCards, friendStatus, setAddFriendPopup, user, userProfileDetails, setUserScrapBookCards, setViewLikesPopup }) => {
    //console.log(userScrapBookCards, "userScrapBookCards");

    //divide the userScrapBookCards into set of 3 cards ands store them in an array
    let cardsArray = [];
    let tempArray = [];
    userScrapBookCards.map((card, index) => {
        tempArray.push(card);
        if (tempArray.length === 3) {
            cardsArray.push(tempArray);
            tempArray = [];
        }
    });
    if (tempArray.length > 0) {
        cardsArray.push(tempArray);
    }
    console.log(cardsArray, "cardsArray");
    return (
      <Swiper
        direction={'vertical'}
        slidesPerView={1} 
        spaceBetween={30}
        className="h-[260px] pb-0 mb-0"
      >
        {cardsArray.map((cards, index) => (
          <SwiperSlide key={index} className='mb-0 pb-0 h-[260px]'>
            <ScrapBookCards userScrapBookCardsSubset={cards} friendStatus={friendStatus} setAddFriendPopup={setAddFriendPopup} user={user} userProfileDetails={userProfileDetails} setUserScrapBookCards={setUserScrapBookCards} userScrapBookCards={userScrapBookCards} setViewLikesPopup={setViewLikesPopup} />
          </SwiperSlide>
        ))}
        </Swiper>
    );
}
  export default VerticalCarousel;