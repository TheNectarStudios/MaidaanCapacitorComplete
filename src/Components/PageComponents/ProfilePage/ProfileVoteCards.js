import React, { useEffect } from 'react';
import AppButton from "../../Common/AppButton";
import { setDoc, doc, addDoc, collection } from "firebase/firestore";
import { db } from "../../../firebase-config";
import axios from 'axios';
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import CryptoJS from 'crypto-js';
import { secretKey, initializationVector } from "../../../firebase-config";

const ProfileVoteCard = ({ user, userProfileDetails, cardData, profileVoteCards, setProfileVoteCards, setViewVotesPopup, friendStatus, setAddFriendPopup }) => {
    const navigate = useNavigate();
    const [profileUserId, setProfileUserId] = React.useState(null);
    let { encryptedId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    //console.log(cardData, "cardData")
    const backgroundImageName = "/Assets/Icons/vote-card-background.svg";
    const likeName = "/Assets/Icons/thumbs-up.svg";
    const nonLikeName = "/Assets/Icons/thumbsup-outline.svg";
    const voteIconName = "/Assets/Icons/outline-muscle.svg";

    useEffect(() => {
        if (encryptedId) {
          // Decrypt
    
          const decrypt = async (encryptedId) => {
            //var bytes = CryptoJS.AES.decrypt(encryptedId, secretKey);
            const key = CryptoJS.enc.Hex.parse(secretKey);
            const iv = CryptoJS.enc.Hex.parse(initializationVector);
            //bytes.toString(CryptoJS.enc.Utf8);
            //const decryptedBytes = CryptoJS.AES.decrypt(encryptedId, key, { iv: iv });
    
            // Convert the decrypted data to a UTF-8 string to get the original userId
            //const decryptedUserId = decryptedBytes.toString(CryptoJS.enc.Utf8);
            let originalFormatEncryptedUserId = encryptedId.replace(/-/g, '+').replace(/_/g, '/') + "==";
    
            // Decrypt the originalFormatEncryptedUserId
            const decryptedBytes = CryptoJS.AES.decrypt(originalFormatEncryptedUserId, key, { iv: iv });
    
            const decryptedUserId = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
            //console.log(decryptedUserId, "originalText");
            setProfileUserId(decryptedUserId);
          }
          decrypt(encryptedId);
        }
      }, [encryptedId]);

    const handleVoteCardLike = async () => {

        let tempProfileVoteCards = profileVoteCards;
        tempProfileVoteCards = tempProfileVoteCards.map((card) => {
            if (card.cardId === cardData.cardId) {

                if (card.likedByUser) {
                    return {
                        ...card,
                        numberOfLikes: card.numberOfLikes - 1,
                        likedByUser: false,
                    }
                }
                else {
                    return {
                        ...card,
                        numberOfLikes: card.numberOfLikes + 1,
                        likedByUser: true,
                    }
                }
            }
            return card;
        }
        );
        setProfileVoteCards(tempProfileVoteCards);
        //console.log(userProfileDetails?.id, "userProfileDetails?.id");
        const result = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/update-like-list`, {
            cardId: cardData.cardId,
            userVoteCardId: cardData.id,
            profileId: userProfileDetails.id,
            userId: user.id,
        });

        //console.log(result, "result");

    }

    const handleViewVotes = async () => {
        // console.log("came to view votes");
        // if(!friendStatus.isFriend){
        //     setAddFriendPopup(true);
        // }
        // else{
        // //navigate(`/profile/allvotes?uId=${encryptedId}`);
        setViewVotesPopup(
            {
                show: true,
                cardId: cardData.cardId,
                userId: profileUserId,
            }
        )
        //}
        //}
    }

    //const handleView

    return (
        <div className={`bg-cover bg-center relative rounded-xl`} style={{ backgroundImage: `url(${backgroundImageName})`, height: '100px', width: '250px', fontFamily: "avenir" }}>
            <div className="flex justify-between items-center h-[100px]">
                <div className="flex items-center justify-center h-full pl-2">
                    <img src={voteIconName} alt="vote-icon" className="h-10 w-10" />
                </div>

                <div className="flex flex-col items-center justify-center h-full ">
                    <h3 className="text-sm text-white text-center m-0 mb-4">{cardData.card}</h3>
                    <AppButton onClick={handleVoteCardLike} className={`h-7 w-20 ${cardData?.likedByUser ? '' : 'bg-white'}`}>
                        <img src={cardData?.likedByUser ? likeName : nonLikeName} alt="like-icon" className="h-4 w-4" />
                    </AppButton>
                </div>

                <div className="flex flex-col text-white items-center justify-center  pr-[6px]">
                    <h3 className="text-md text-center mt-16 mb-[-16px] text-[20px]"> {cardData.numberOfLikes}</h3>
                    <p onClick={handleViewVotes} className='text-sm underline cursor-pointer text-center'>votes</p>
                </div>
                <div className="absolute bottom-0 right-0 mb-[-8px] mr-[-8px] bg-white bg-opacity-30 rounded-full h-[60px] w-[60px] flex justify-center items-center" onClick={handleViewVotes}>
                </div>
            </div>
        </div>
    );
}

export default ProfileVoteCard;
