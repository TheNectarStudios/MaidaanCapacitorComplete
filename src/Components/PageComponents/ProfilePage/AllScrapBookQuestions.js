import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { decrypt } from '../../utils';
import { useState } from 'react';
import { useAuth } from "../../../providers/auth-provider";
import ProfileHeader from './ProfileHeader';
import axios from 'axios';

export default function AllScrapBookQuestions() {

const { user } = useAuth();

let { userId } = useParams();
console.log(userId, "profileId");
const profileUserID = decrypt(userId);
console.log(profileUserID, "profileUserID");

const [activeCard, setActiveCard] = useState(null);
 const [userScrapBookCards, setUserScrapBookCards] = useState([]);
  const [cards, setCards] = useState(userScrapBookCards);
  const [state, setState] = useState(true);
  const scrapIconNames = ["/Assets/Icons/outline-muscle.svg","/Assets/Icons/outline-muscle.svg","/Assets/Icons/outline-muscle.svg","/Assets/Icons/outline-muscle.svg"];
  userScrapBookCards.map((card,index) => {
    card.scrapIconName = scrapIconNames[index];
  });
  //filter the userScrappBookCards to length of 3
  const totalScrapBookCards = userScrapBookCards;
  console.log(totalScrapBookCards, "totalScrapBookCardsinsideScrapBookCards");
  //userScrapBookCards = userScrapBookCards.slice(0,3);

  console.log(userScrapBookCards, "allUserScrapBookCards");

  useEffect(() => {
    async function getUserScrapBookCards(profileUserId) {
        try {
          //API endpoint :”get-user-scrap-book-cards”
          //Payload: { userId }
          const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-user-scrap-book-cards`, { userId: profileUserId, viewUserId: user?.id});
          //iterate through each card and fill out answer dtaa for editformdata
          //const scrapBookCards = response.data.data;

          //scrapBookCards.map((card,index) => {

            

          setUserScrapBookCards(response.data.data);
        } catch (error) {
          console.error('Error getting user scrap book cards:', error);
        }
      };

        getUserScrapBookCards(profileUserID);
    }, [profileUserID]);
  
  const handleCardClick = (cardId) => {
    setActiveCard(cardId === activeCard ? null : cardId); // Toggle the active state of the card
  };

  const updateScrapCardLike = async() => {

    console.log(userScrapBookCards[activeCard].questionId, "userScrapBookCards[activeCard].questionId");
    console.log(user.id, "user.id");
    console.log(profileUserID, "profileUserID");
    
    const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/update-scrap-card-likes`, {
      likedUserId: user.id,
      cardId: userScrapBookCards[activeCard].questionId,
      profileUserId: profileUserID,
    });

    //update the likedByUser in the userScrapBookCards of the current active card

    //userScrapBookCardsSubset[activeCard].likedByUser = !userScrapBookCardsSubset[activeCard].likedByUser;

    let tempUserScrapBookCards = userScrapBookCards;
    console.log(tempUserScrapBookCards, "tempUserScrapBookCards1");
    console.log(userScrapBookCards[activeCard],"userScrapBookCardsSubset[activeCard]")
    //console.log(userScrapBookCardsSubset[activeCard].likedByUser,"userScrapBookCardsSubset[activeCard]")
    //find the index of the active card in the tempUserScrapBookCards using questionId and update the likedByUser

    //console.log(tempUserScrapBookCards[activeCard].likedByUser, "tempUserScrapBookCards[activeCard]1");
    tempUserScrapBookCards[activeCard].likedByUser = !tempUserScrapBookCards[activeCard].likedByUser;
    //console.log(tempUserScrapBookCards[activeCard].likedByUser, "tempUserScrapBookCards[activeCard]2");
    //console.log(tempUserScrapBookCards, "tempUserScrapBookCards2");
    setState(!state);
    
    setUserScrapBookCards(tempUserScrapBookCards);
  }

  console.log(userScrapBookCards, "userScrapBookCardsdemo");

  // Function to get different shades of green based on card ID
  const getGreenShade = (id) => {
    const shades = ['bg-[#4F6100]', 'bg-[#252D00]', 'bg-[#4F6100]','bg-[#799400]'];
    return shades[(id) % shades.length]; // Cycle through shades based on ID
  };
  console.log(activeCard, "activeCard");
  return (
    <div className="flex flex-col items-center h-full w-full  relative" style={{ fontFamily: "Avenir", overflowY: "auto" }}>
        <div className="w-screen fixed top-0 left-0 z-50">
        <ProfileHeader headerText="20 Questions"/>
        </div>
        <div className='flex flex-col items-center mt-[120px] w-full' style={{ fontFamily: "Avenir" }}>
      {userScrapBookCards.map((card,index) => (
        <div
          key={card.id}
          className={`w-80 h-[130px] 'min-h-130' ${getGreenShade(index)} text-white flex felx-col justify-start cursor-pointer transition-all duration-300 transform rounded-tl-2xl rounded-tr-2xl ${
            activeCard === index? 'mt-2 scale-120 -translate-y-10 z-10' : ''
          } ${cards.indexOf(card) !== 19 ? '-mb-16 ' : 'mb-0'}`}
          onClick={() => handleCardClick(index)}
        >
            {/*<div className='p-4'>
                <img src={card.scrapIconName} alt="scrap-icon" className="h-20 w-20"/>
        </div>*/}
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
    </div>
  );
  
};