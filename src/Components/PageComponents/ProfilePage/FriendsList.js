import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import AppButton from '../../Common/AppButton';
import { useAuth } from '../../../providers/auth-provider';
import mixpanel from 'mixpanel-browser';
import CryptoJS from 'crypto-js';
import { secretKey } from "../../../firebase-config";
import { initializationVector } from "../../../firebase-config";
import { useSearchParams } from 'react-router-dom';
import { userProfileListComponent } from "../../utils";
import { useNavigate } from 'react-router-dom';
import { returnEncryptedUserId } from "../../utils";
import { Emoji } from 'emoji-picker-react';
import ProfileHeader from './ProfileHeader';



const FriendsList = () => {


  const [friends, setFriends] = useState([]);
  const [lastDocument, setLastDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLastBatchFriendsList, setIsLastBatchFriendsList] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnlyFriends = searchParams.get("onlyFriends");
  const navigate = useNavigate();


  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [sentLastDocumentRequests, setSentLastDocumentRequests] = useState(null);
  const [isLastBatchSentFriendRequestsList, setIsLastBatchSentFriendRequestsList] = useState(false);
  const [lastDocumentRequests, setLastDocumentRequests] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isLastBatchFriendRequestsList, setIsLastBatchFriendRequestsList] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  let { userId } = useParams();

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
    //setProfileUserId(decryptedUserId);
    return decryptedUserId;
  }
  //userId = userId.charAt(0).toUpperCase() + userId.substring(1);
  // Function to fetch friends
  const fetchFriends = async () => {
    setLoading(true);
    try {
      //API endpoint :”get-friends-list”
      //Payload: { userId,fetchLimit,lastDocumentID }
      const decryptUserId = await decrypt(userId);
      //setProfileUserId(decryptUserId);
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-friends-list`, { userId: decryptUserId, limit: 5, lastDocumentId: lastDocument });
      const newFriends = response.data.statusCode.data;
      setIsLastBatchFriendsList(response.data.statusCode.isLastBatch);
      if (newFriends.length > 0) {
        setFriends([...friends, ...newFriends]);
        setLastDocument(newFriends[newFriends.length - 1].id); // Assuming each friend has a unique ID
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoading(false);
    }
  };

  //onsole.log(userId, "userId");

  useEffect(() => {
    const decryptUserId = async () => {
      const decryptedUserId = await decrypt(userId);
      setProfileUserId(decryptedUserId);
    }
    decryptUserId();
  }, [userId]);
  // Initial fetch
  useEffect(() => {
    fetchFriends();
  }, [userId,user]); // Empty dependency array means this effect runs once on mount


  const fetchFriendRequests = async () => {
    setLoadingRequests(true);
    try {
      //API endpoint :”get-friends-list”
      //Payload: { userId,fetchLimit,lastDocumentID }
      //API endpoint : “get-friend-requests”
      //Payload : {userId,statusType,lastDocument,limit}
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-friend-requests`, { userId: user?.id, statusType: "pending", lastDocumentRequests, limit: 5, sentByUser: false});
      const newFriendRequests = response.data.statusCode.data;
      if (newFriendRequests.length > 0) {
        setFriendRequests([...friendRequests, ...newFriendRequests]);
        setLastDocumentRequests(newFriendRequests[newFriendRequests.length - 1].id);
      }
      setIsLastBatchFriendRequestsList(response.data.statusCode.isLastBatch);

    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchSentFriendRequests = async () => {
    setLoadingRequests(true);
    try {
      //API endpoint :”get-friends-list”
      //Payload: { userId,fetchLimit,lastDocumentID }
      //API endpoint : “get-friend-requests”
      //Payload : {userId,statusType,lastDocument,limit}
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-friend-requests`, { userId: user?.id, statusType: "pending", lastDocumentRequests : sentLastDocumentRequests, limit: 5, sentByUser: true });
      const newFriendRequests = response.data.statusCode.data;
      if (newFriendRequests.length > 0) {
        console.log(newFriendRequests, "newFriendRequests");
        console.log(friendRequests, "friendRequests");
        setSentFriendRequests([...friendRequests, ...newFriendRequests]);
        setSentLastDocumentRequests(newFriendRequests[newFriendRequests.length - 1].id);
      }
      setIsLastBatchSentFriendRequestsList(response.data.statusCode.isLastBatch);

    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoadingRequests(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchFriendRequests();
    fetchSentFriendRequests();
  }, [user,userId]); // Empty dependency array means this effect runs once on mount
  console.log(friendRequests);

  const handleAcceptDeclineFriendRequest = async (request, action) => {
    

    const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/accept-friend-request`, { senderId: request.senderId, sendeeId: user.id, docId: request.id, status: action });
    console.log(response);
    if (response.status === 200) {
      setFriendRequests(friendRequests.filter((req) => req.id !== request.id));
    }
  }
  const handleGoback = () => {
    navigate(`/profile/${returnEncryptedUserId(profileUserId)}`);
  }


  console.log(friends);
  return (
    <div className="flex flex-col w-full bg-[#4e4e4e] h-full">
                <ProfileHeader goBackUrl={`/profile/${returnEncryptedUserId(profileUserId)}`} headerText="Friends"/>
      {profileUserId === user?.id && !isOnlyFriends && <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-8">
        <div className="flex gap-5 items-center">
          <div className="text-lg" style={{ color: 'white' }}>Friend Requests</div>
        </div>
        <div className="flex flex-col gap-4">
          {friendRequests?.map((friendRequest) => {
            console.log(friendRequest, "friendRequest");
            return (
              <div className="flex flex-row justify-between items-center">
                <div className="flex items-center" onClick={() => navigate(`/profile/${returnEncryptedUserId(friendRequest.senderId)}`)}>
                  <div className="flex items-center mr-3">

                    {friendRequest.profileEmoji ? (
                      <div className='flex items-center '>
                        <Emoji unified={friendRequest.profileEmoji} size="25" />
                      </div>
                    ) : (
                      <div className='flex items-center '>
                        <img
                          src='/Assets/Icons/Nimbu.svg'
                          alt="icon"
                          style={{ width: '25px', height: '25px' }}
                        />
                      </div>
                    )}  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      <div className="text-base" style={{ color: '#CCF900' }}>{friendRequest.senderFirstName}</div>
                    </div>
                    <div className="text-xs" style={{ color: 'white' }}>{`Grade ${friendRequest.senderGrade} | ${friendRequest.senderSchool}, ${friendRequest.senderCity}`}</div>
                  </div>
                </div>
                <div className="flex felx-col gap-1">
                <div className="flex items-center">
                    <AppButton className="w-[75px] h-[30px] min-h-[30px] self-center items-center"
                      onClick={() => {
                        handleAcceptDeclineFriendRequest(friendRequest, "accepted")
                      }}>
                      Accept
                    </AppButton>
                  </div>
                  <div>
                    <AppButton className="w-[75px] h-[30px] min-h-[30px] self-center items-center"
                      onClick={() => {
                        handleAcceptDeclineFriendRequest(friendRequest, "declined")
                      }}>
                      Decline
                    </AppButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {!isLastBatchFriendRequestsList && <div className="flex justify-center">
          <AppButton
            onClick={fetchFriendRequests}
            label="Load More"
            loading={loadingRequests}
            disabled={loadingRequests}
          >
            Load More
          </AppButton>
        </div>}
      </div>
      //display sent friend requests
      }

      {profileUserId === user?.id && !isOnlyFriends && <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-8">
        <div className="flex gap-5 items-center">
          <div className="text-lg" style={{ color: 'white' }}>Sent Friend Requests</div>
        </div>
        <div className="flex flex-col gap-4">
          {sentFriendRequests?.map((friendRequest) => {
            return (
              <div className="flex flex-row justify-between items-center">
                <div className="flex items-center" onClick={() => navigate(`/profile/${returnEncryptedUserId(friendRequest.sendeeId)}`)}>
                  <div className="flex items-center mr-3">

                    {friendRequest.profileEmoji ? (
                      <div className='flex items-center '>
                        <Emoji unified={friendRequest.profileEmoji} size="25" />
                      </div>
                    ) : (
                      <div className='flex items-center '>
                        <img
                          src='/Assets/Icons/Nimbu.svg'
                          alt="icon"
                          style={{ width: '25px', height: '25px' }}
                        />
                      </div>
                    )}  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      <div className="text-base" style={{ color: '#CCF900' }}>{friendRequest.sendeeFirstName}</div>
                    </div>
                    <div className="text-xs" style={{ color: 'white' }}>{`Grade ${friendRequest.sendeeGrade} | ${friendRequest.sendeeSchool}, ${friendRequest.sendeeCity}`}</div>
                  </div>
                </div>
                {/*<div className="flex felx-col gap-1">
                  <div className="flex items-center">
                    <AppButton className="w-[75px] h-[30px] min-h-[30px] self-center items-center"
                      onClick={() => {
                        handleAcceptDeclineFriendRequest(friendRequest, "accepted")
                      }}>
                      Accept
                    </AppButton>
                  </div>
                  <div>
                    <AppButton className="w-[75px] h-[30px] min-h-[30px] self-center items-center"
                      onClick={() => {
                        handleAcceptDeclineFriendRequest(friendRequest, "declined")
                      }}>
                      Decline
                    </AppButton>
                  </div>
                </div>*/}
              </div>
            )
          }
          )}
        </div>
        {!isLastBatchSentFriendRequestsList && <div className="flex justify-center">
          <AppButton
            onClick={fetchSentFriendRequests}
            label="Load More"
            loading={loadingRequests}
            disabled={loadingRequests}
          >
            Load More
          </AppButton>
        </div>}
      </div>}
      
      <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-8">
        <div className="flex gap-5 items-center">
          <div className="text-lg" style={{ color: 'white' }}>Friends</div>
        </div>
        <div className="flex flex-col gap-4">
          {friends?.map((friend) => {
            return userProfileListComponent(
              friend,
              navigate,
              "View Profile",
              () => navigate(`/profile/${returnEncryptedUserId(friend.id)}`),
            );
          })}
        </div>
        {!isLastBatchFriendsList && <div className="flex justify-center">
          <AppButton
            onClick={fetchFriends}
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

export default FriendsList;
