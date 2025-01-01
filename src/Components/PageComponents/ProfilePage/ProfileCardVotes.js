import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import AppButton from '../../Common/AppButton';
import mixpanel from 'mixpanel-browser';
import { useSearchParams } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { secretKey, initializationVector } from "../../../firebase-config";

const ProfileCardLikes = ({uId, cId, profileQuestionsLikes=false}) => {

   
  const [likesList, setLikesList] = useState([]);
  const [lastDocument, setLastDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLastBatchVotesList, setIsLastBatchVotesList] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
    let { cardId } = useParams();
    //let uId = searchParams.get("uId");
    //let cId = searchParams.get("cId");



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
      return decryptedUserId;
      //console.log(decryptedUserId, "originalText");
      }


    // Function to fetch friends
    const fetchLikes = async () => {
      setLoading(true);
      try {
          //API endpoint :”get-likes-list”
    //Payload: { cardId,fetchLimit,lastDocumentID }
        const userId = await decrypt(uId);
        const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-likes-list`, { voteQuestionId : cId, userId:uId, limit: 15, lastDocumentId:lastDocument, profileQuestionsLikes});
        const newLikes = response.data.statusCode.data;
         if (newLikes.length > 0) {
          setLikesList([...likesList, ...newLikes]);
          setLastDocument(newLikes[newLikes.length - 1].id); // Assuming each friend has a unique ID
        }
        setIsLastBatchVotesList(response.data.statusCode.isLastBatch);
      }
        catch (error) {
        console.error("Failed to fetch likes:", error);
        } 
    };

  useEffect(() => {
    fetchLikes();
  }, []); // Empty dependency array means this effect runs once on mount
  return (
    <div className="flex flex-col gap-6 w-full bg-primary-gradient h-full">
      <div className="flex flex-col gap-6 bg-primary-gradient w-full p-2 pt-0">
          <div className="flex">
          <div className="text-lg w-full text-center text-white">
            {profileQuestionsLikes ? 'Likes' : 'Votes'}
          </div>          
          </div>
          <div className="flex flex-col gap-4">
            {likesList.map((friend) => {
              
              return (
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                    <div className="text-base" style={{ color: '#CCF900' }}>{friend.voterFirstName}</div>  
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        { !isLastBatchVotesList && !loading && <div className="flex justify-center">
            <AppButton
                onClick={fetchLikes}
                label="Load More"
                loading={loading}
                disabled={loading}
            >
                Load More
            </AppButton>
        </div>}
        </div>
    </div>
  )
};

export default ProfileCardLikes;
