import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import AppButton from '../../Common/AppButton';
import { useAuth } from '../../../providers/auth-provider';
import mixpanel from 'mixpanel-browser';

const FriendRequest = () => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState([]);
  const [lastDocumentRequests, setLastDocumentRequests] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isLastBatchFriendRequestsList, setIsLastBatchFriendRequestsList] = useState(false);
  //let { userId } = useParams();
  //userId = userId.charAt(0).toUpperCase() + userId.substring(1);
  // Function to fetch friends

  const fetchFriendRequests = async () => {
    setLoadingRequests(true);
    try {
      //API endpoint :”get-friends-list”
      //Payload: { userId,fetchLimit,lastDocumentID }
      //API endpoint : “get-friend-requests”
//Payload : {userId,statusType,lastDocument,limit}
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-friend-requests`, { userId: user?.id, statusType:"pending",lastDocumentRequests,limit:1});
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

  // Initial fetch
  useEffect(() => {
    fetchFriendRequests();
  }, []); // Empty dependency array means this effect runs once on mount
  console.log(friendRequests);

  const handleAcceptFriendRequest = async (request) => {
    //API endpoint :”accept-friend-request”
    //Payload: { senderId,sendeeId,docId }
    console.log(request);
    console.log(user.id);
    console.log(request.senderId);
    console.log(request.id);
    const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/accept-friend-request`, { senderId: request.senderId, sendeeId: user.id, docId: request.id });
    console.log(response);
    if (response.status === 200) {
        //remove the request from the list
        setFriendRequests(friendRequests.filter((req) => req.id !== request.id));
        //console.log(response.data.data);
    }
}

  return (
    <div className="flex flex-col gap-6 w-full bg-[#4e4e4e] h-full">
      <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-8">
        <div className="flex gap-5 items-center">
          <div className="text-lg" style={{ color: 'white' }}>Friend Requests</div>
        </div>
        <div className="flex flex-col gap-4">
          {friendRequests.map((friendRequest) => {

            return (
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center">
                    <div className="text-base" style={{ color: '#CCF900' }}>{friendRequest.senderFirstName}</div>
                  </div>
                  <div className="text-xs" style={{ color: 'white' }}>{`Grade ${friendRequest.senderGrade} | ${friendRequest.senderSchool}, ${friendRequest.senderCity}`}</div>
                </div>
                <div>
                  <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center" 
                  onClick={()=>{
                    handleAcceptFriendRequest(friendRequest)}}>
                        Accept
                      </AppButton>
                </div> 
                </div>
            )
          })}
        </div>
        { !isLastBatchFriendRequestsList && <div className="flex justify-center">
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
    </div>
  )
};

export default FriendRequest;


/*import axios from "axios";
import React, { useEffect } from "react";
import { useState } from "react";
import AppButton from "../../Common/AppButton";
import { useAuth } from "../../../providers/auth-provider";

export default function FriendRequests() {
    const {user} = useAuth();
    console.log(user);
    console.log("FriendRequests");
    const [friendRequests, setFriendRequests] = useState([]);
    useEffect(() => {
        getAllPendingFriendRequests();
    }, []);
    const getAllPendingFriendRequests = async () => {
        //API endpoint :”get-friends-list”
//Payload : {userId,statusType,lastDocument,limit}
console.log(user.id);
        const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-friend-requests`, { userId: user.id, statusType: "pending", lastDocument: "", limit: 10 });
        console.log(response);
        if (response.status === 200) {
            console.log(response.data.data);
            setFriendRequests(response.data.data);
        }
    }

    const handleAcceptFriendRequest = async (request) => {
        //API endpoint :”accept-friend-request”
        //Payload: { senderId,sendeeId,docId }
        console.log(request);
        console.log(user.id);
        console.log(request.senderId);
        console.log(request.id);
        const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/accept-friend-request`, { senderId: request.senderId, sendeeId: user.id, docId: request.id });
        console.log(response);
        if (response.status === 200) {
            //remove the request from the list
            setFriendRequests(friendRequests.filter((req) => req.id !== request.id));
            //console.log(response.data.data);
        }
    }

    //return friends requests list 
    /**const DisplayOpenMatches = () => {
      if(openMatchesList.length !== 0){
      return (
        <div className="flex flex-col gap-6 w-full bg-[#4e4e4e]">
          <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
              <div className="flex gap-5 items-center">
              <div className="text-lg">Open Challenges</div>
              </div>
              <div className="flex flex-col gap-4">
                {openMatchesList.map((match) => {
                  
                  return (
                    <div className="flex flex-row justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                        <div className="text-base" style={{ color: '#CCF900' }}>{match.userName}</div>  
                        <div className="text-base px-2">-</div>                  
                        <div className="text-base">{gameNamesMap[match.gameType]}</div>
                        </div>
                        <div className="text-xs">{`Grade ${match.userGrade} | ${match.userSchool}, ${match.userCity}`}</div>
                      </div>
                      <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center" onClick={()=>{
                        MEASURE(INSTRUMENTATION_TYPES.OPENMATCH_ACCEPTED, user?.id, {openMatch: match});
                        handleMatching(match)}}>
                        Accept
                      </AppButton>
                    </div>
                  )
                })}
              </div>
            </div>
        </div>
      )
      } */
/**const DisplayOpenMatches = () => {
if(openMatchesList.length !== 0){
return (
  <div className="flex flex-col gap-6 w-full bg-[#4e4e4e]">
    <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
        <div className="flex gap-5 items-center">
        <div className="text-lg">Open Challenges</div>
        </div>
        <div className="flex flex-col gap-4">
          {openMatchesList.map((match) => {
            
            return (
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center">
                  <div className="text-base" style={{ color: '#CCF900' }}>{match.userName}</div>  
                  <div className="text-base px-2">-</div>                  
                  <div className="text-base">{gameNamesMap[match.gameType]}</div>
                  </div>
                  <div className="text-xs">{`Grade ${match.userGrade} | ${match.userSchool}, ${match.userCity}`}</div>
                </div>
                <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center" onClick={()=>{
                  MEASURE(INSTRUMENTATION_TYPES.OPENMATCH_ACCEPTED, user?.id, {openMatch: match});
                  handleMatching(match)}}>
                  Accept
                </AppButton>
              </div>
            )
          })}
        </div>
      </div>
  </div>
)
} */
{/*} return (
        <div>
            <div className="flex flex-col gap-6 w-full bg-[#4e4e4e]">
          <div className="flex flex-col gap-6 bg-[#4e4e4e] w-full p-4">
              <div className="flex gap-5 items-center">
              <div className="text-lg">Open Challenges</div>
              </div>
              <div className="flex flex-col gap-4">
                {friendRequests.map((friendRequest) => {
                    return (
                        <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center">
                            <div className="text-base" style={{ color: '#CCF900' }}>{friendRequest.senderId}</div>  
                            </div>
                            <div className="flex flex-col gap-1">
                            <div className="text-xs">{`Grade ${friendRequest.senderGrade} | ${friendRequest.senderSchool}, ${friendRequest.senderCity}`}</div>
                        </div>
                            <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center">
                            Accept
                        </AppButton>
                        </div>
                        </div>
                    )
                    })}
                </div>
            </div>
        </div>
        </div>
    )
}
            {/*</div>{friendRequests.map((friendRequest) => (
                <div className="flex flex-row justify-between items-center" key={friendRequest.id}>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                            <div className="text-base" style={{ color: '#CCF900' }}>{friendRequest.senderId}</div>
                            <div className="text-base px-2">-</div>
                        </div>
                        {/* <div className="text-xs">{`${friendRequest.userSchool}, ${friendRequest.userCity}`}</div>*/}
/* </div>
 <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center">
     Accept
 </AppButton>
</div>
))}
</div>
);   


 

return (
<div className="flex flex-col gap-6 w-full h-full bg-[#4e4e4e]">
<div className="flex flex-col gap-6 bg-[#4e4e4e] w-full  p-8">
   <div className="flex gap-5 items-center">
   <div className="text-lg" style={{ color: 'white' }}>Open Challenges</div>
   </div>
   <div className="flex flex-col gap-4">
     {friendRequests.map((request) => {
       
       return (
         <div className="flex flex-row justify-between items-center">
           <div className="flex flex-col gap-1">
             <div className="flex items-center">
             <div className="text-base" style={{ color: '#CCF900' }}>{request.senderId}</div>  
             </div>
             <div className="text-xs" style={{ color: 'white' }}>{`Grade ${request.senderGrade} | ${request.senderSchool}, ${request.senderCity}`}</div>
           </div>
           <AppButton className="w-[85px] h-[30px] min-h-[30px] self-center items-center"
           onClick={()=>{
             handleAcceptFriendRequest(request)}}
             >
             Accept
           </AppButton>
         </div>
       )
     })}
   </div>
 </div>
</div>
)
 }*/