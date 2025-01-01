import axios from 'axios';
import { set } from 'lodash';
import React, { useEffect, useState } from 'react';

const ScrapBookCards = ({userScrapBookCardsSubset, friendStatus, setAddFriendPopup, user, userProfileDetails, setUserScrapBookCards, userScrapBookCards, setViewLikesPopup}) => {
  const [activeCard, setActiveCard] = useState(null);
  const [cards, setCards] = useState(userScrapBookCardsSubset);
  const [state, setState] = useState(true);

  // Define the card data including question text
  /*const cards = [
    { id: 1, question: "What's your favorite memory?" ,answer:"My favorite memory is when I went to the beach with my family and we built a sandcastle together.My favorite memory is when I went to the beach with my family and we built a sandcastle together.",scrapIconName : "/Assets/Icons/outline-muscle.svg"},
    { id: 2, question: "Best vacation you've ever had?" ,answer:"The best vacation I've ever had was when I went to Disney World with my family.",scrapIconName : "/Assets/Icons/outline-muscle.svg"},
    { id: 3, question: "A skill you'd love to learn?" ,answer:"I'd love to learn how to play the guitar.",scrapIconName : "/Assets/Icons/outline-muscle.svg"},
    { id: 4, question: "One thing you can't live without?" ,answer:"I can't live without my dog, Max.",scrapIconName : "/Assets/Icons/outline-muscle.svg"},
  ];*/
  //add scrapicon name to the userScrapBookCards
  const scrapIconNames = ["/Assets/Icons/outline-muscle.svg","/Assets/Icons/outline-muscle.svg","/Assets/Icons/outline-muscle.svg","/Assets/Icons/outline-muscle.svg"];
  userScrapBookCardsSubset.map((card,index) => {
    card.scrapIconName = scrapIconNames[index];
  });
  //filter the userScrappBookCards to length of 3
  const totalScrapBookCards = userScrapBookCards;
  console.log(totalScrapBookCards, "totalScrapBookCardsinsideScrapBookCards");
  userScrapBookCardsSubset = userScrapBookCardsSubset.slice(0,3);

  console.log(userScrapBookCards, "allUserScrapBookCards");
  
  const handleCardClick = (cardId) => {
    setActiveCard(cardId === activeCard ? null : cardId); // Toggle the active state of the card
  };

  const updateScrapCardLike = async() => {

    if(user?.id === userProfileDetails?.id){
    
    setViewLikesPopup(
        {
            show: true,
            cardId: userScrapBookCardsSubset[activeCard].questionId,
            userId: user.id,
        }
    )

    }

    else{
    
    const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/update-scrap-card-likes`, {
      likedUserId: user.id,
      likedUserFirstName: user.firstName,
      cardId: userScrapBookCardsSubset[activeCard].questionId,
      profileUserId: userProfileDetails.id,
    });

    //update the likedByUser in the userScrapBookCards of the current active card

    userScrapBookCardsSubset[activeCard].likedByUser = !userScrapBookCardsSubset[activeCard].likedByUser;

    let tempUserScrapBookCards = totalScrapBookCards;
    console.log(tempUserScrapBookCards, "tempUserScrapBookCards1");
    console.log(userScrapBookCardsSubset[activeCard],"userScrapBookCardsSubset[activeCard]")
    //console.log(userScrapBookCardsSubset[activeCard].likedByUser,"userScrapBookCardsSubset[activeCard]")
    //find the index of the active card in the tempUserScrapBookCards using questionId and update the likedByUser
    tempUserScrapBookCards.map((card,index) => {
      if(card.questionId === userScrapBookCardsSubset[activeCard].questionId){
        card.likedByUser = !card.likedByUser;
      }
    });

    console.log(tempUserScrapBookCards[activeCard].likedByUser, "tempUserScrapBookCards[activeCard]1");
    tempUserScrapBookCards[activeCard].likedByUser = !tempUserScrapBookCards[activeCard].likedByUser;
    console.log(tempUserScrapBookCards[activeCard].likedByUser, "tempUserScrapBookCards[activeCard]2");
    console.log(tempUserScrapBookCards, "tempUserScrapBookCards2");
    setState(!state);
    setUserScrapBookCards(tempUserScrapBookCards);
  }
  }

  console.log(userScrapBookCardsSubset, "userScrapBookCardsdemo");

  // Function to get different shades of green based on card ID
  const getGreenShade = (id) => {
    const shades = ['bg-[#4F6100]', 'bg-[#252D00]', 'bg-[#4F6100]','bg-[#799400]'];
    return shades[(id) % shades.length]; // Cycle through shades based on ID
  };
  console.log(activeCard, "activeCard");
  return (
    <div className="flex flex-col items-center mt-7" style={{ fontFamily: "Avenir" }}>
      {userScrapBookCardsSubset.map((card,index) => (
        <div
          key={card.id}
          className={`w-80 h-[130px] 'min-h-70' ${getGreenShade(index)} text-white flex felx-col justify-start cursor-pointer transition-all duration-300 transform rounded-tl-2xl rounded-tr-2xl ${
            activeCard === index? 'mt-2 scale-120 -translate-y-10 z-10' : ''
          } ${cards.indexOf(card) !== 2 ? '-mb-16 ' : 'mb-0'}`}
          onClick={friendStatus.isFriend ? () => handleCardClick(index) : () => setAddFriendPopup(true)}
        >
            {/*<div className='p-4'>
                <img src={card.scrapIconName} alt="scrap-icon" className="h-20 w-20"/>
        </div>*/}
        {console.log(card, "card")}
          <div className="text-start m-4 w-full">
            {(activeCard === null || (activeCard !==null && activeCard === index)) && <div className="text-sm font-avenir" >{card.question}</div>}
            {/* Optionally display additional info when the card is active */}
            {activeCard === index ? <div className='mt-4'>{`${card.answer}`}</div> : ''}
            {activeCard === index && card.answer !=="" ? <div className='mt-4 flex justify-end items-end mr-2 mb-2' onClick={()=>updateScrapCardLike()}>
              <img
                src={card.likedByUser ? '/Assets/Icons/like.svg' : '/Assets/Icons/like-outline.svg'}
                alt="scrap-icon"
                className="h-5 w-5 mr-5 mb-5"
                onClick={(e) => {
                  e.stopPropagation(); // This prevents the click event from propagating to the parent elements
                  updateScrapCardLike();
                }}
                //onClick={(e) => {e.preventDefault(); e.stopPropagation();}
              />
            </div> : ''}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScrapBookCards;
