import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppButton from '../../Common/AppButton';
import CryptoJS from 'crypto-js';
import { secretKey, initializationVector } from "../../../firebase-config";
import { userProfileListComponent, returnEncryptedUserId } from "../../utils";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import ProfileHeader from './ProfileHeader';
import Loader from '../GameLoader';
import { useAuth } from '../../../providers/auth-provider';
import { set } from 'lodash';
import { backButtonHandler } from '../../../Constants/Commons';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab } from '@mui/material';

const AllProfileCardLikes = () => {
  const { user } = useAuth();
  const [value, setValue] = React.useState('1');
  const [cIdsLikes, setCIdsLikes] = useState({});
  const [chronologicalView, setChronologicalView] = useState(false);
  const [lastDocuments, setLastDocuments] = useState({});
  const [lastallDocument, setLastallDocument] = useState(null);
  const [allLikesList, setAllLikesList] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [isLastBatchStates, setIsLastBatchStates] = useState({});
  const [cIds, setCIds] = useState([]);
  const [voteCardsQuestions, setVoteCardsQuestions] = useState({});
  const [isLastBatchStateAllLikes, setIsLastBatchStateAllLikes] = useState(false);
  const [allLikesNumberList, setAllLikesNumberList] = useState([]);
  const [fetchCIdsLoading, setFetchCIdsLoading] = useState(true); // Initialize to true since we're loading cIds on component mount
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  let uId = searchParams.get("uId");

  const decrypt = (encryptedId) => {
    const key = CryptoJS.enc.Hex.parse(secretKey);
    const iv = CryptoJS.enc.Hex.parse(initializationVector);
    let originalFormatEncryptedUserId = encryptedId.replace(/-/g, '+').replace(/_/g, '/') + "==";
    const decryptedBytes = CryptoJS.AES.decrypt(originalFormatEncryptedUserId, key, { iv: iv });
    const decryptedUserId = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedUserId;
  };

  const fetchLikes = async (cId) => {
    try {
      const userId = decrypt(uId);
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-likes-list`, {
        voteQuestionId: cId,
        userId,
        limit: 10,
        lastDocumentId: lastDocuments[cId]
      });
      const newLikes = response.data.statusCode.data;

      setVoteCardsQuestions(prev => ({ ...prev, [cId]: response.data.statusCode.voteCardQuestion }));
      setCIdsLikes(prev => ({ ...prev, [cId]: [...(prev[cId] || []), ...newLikes] }));
      setLastDocuments(prev => ({ ...prev, [cId]: newLikes[newLikes.length - 1]?.id }));
      setIsLastBatchStates(prev => ({ ...prev, [cId]: response.data.statusCode.isLastBatch }));
    } catch (error) {
      console.error("Failed to fetch likes for cId:", cId, error);
    }
  };

  const fetchAllLikesinChronologicalOrder = async (uId) => {
    try {
      setFetchCIdsLoading(false);

      const userId = decrypt(uId);
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-all-likes`, {
        userId,
        limit: 10,
        lastDocumentId: lastallDocument
      });

      const newLikes = response.data.data.data;
      const tempLikes = [...allLikesList, ...newLikes];
      //sort tempLikes based on createdAt 
      tempLikes.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setAllLikesList(tempLikes);
      setLastallDocument(newLikes[newLikes.length - 1]?.id);
      setIsLastBatchStateAllLikes(response.data.data.isLastBatch);


    } catch (error) {
      console.error("Failed to fetch all likes:", error);
    }
  }

  const fetchNumberOfLikesInDecreasingOrder = async (uId) => {
    try {
      const userId = decrypt(uId);
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-number-of-likes`, {
        userId
      });
      setAllLikesNumberList(response.data.data);
    } catch (error) {
      console.error("Failed to fetch number of likes in decreasing order:", error);
    }
  }

  // Function to fetch cIds
  const fetchCIds = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-votecardIds`);
      setCIds(response.data.data);
    } catch (error) {
      console.error("Failed to fetch cIds:", error);
    } finally {
      setFetchCIdsLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setChronologicalView(!chronologicalView);
  };


  // Fetch cIds
  useEffect(() => {
    //if(user?.id === uId){
    fetchCIds();
    fetchAllLikesinChronologicalOrder(uId);
    fetchNumberOfLikesInDecreasingOrder(uId);
    //}


  }, []);

  // Fetch likes and card data when cIds are updated
  useEffect(() => {
    if (cIds.length > 0) {
      cIds.forEach(cId => {
        fetchLikes(cId);
      });
    }
  }, [cIds]);
  //const profileUserId  await decrypt(uId);
  if (fetchCIdsLoading) {
    return <Loader />;
  }
  if (user?.id === decrypt(uId)) {

    return (
      <div className="flex flex-col w-full bg-[#4e4e4e] h-full">
        <ProfileHeader headerText="Votes" />

        <div className="pt-2  bg-[#4e4e4e] flex flex-col justify-between" >
          <TabContext value={value}>
            <div className="flex justify-center items-center">
              <div className="h-0.5 bg-[#799400] w-full"></div>
            </div>
            <Box sx={{ width: '100%', typography: 'body1' }}>
              <Box
                sx={{
                  borderColor: 'divider',
                  width: 'calc(100% - 48px)',
                  marginLeft: '24px',
                  marginRight: '24px',
                  fontWeight: '800',
                }}
              >
                <TabList
                  onChange={handleChange}
                  className="tablist"
                  sx={{
                    width: '100%',
                    minHeight: '36px',
                    height: '36px',
                    '& .MuiTabs-indicator': {
                      display: 'none', // This hides the blue indicator line
                    },
                  }}
                >
                  <Tab
                    label={
                      <div className="flex items-center">
                        {/* <img
                          src="/Assets/Icons/Vote.svg"
                          alt="Vote"
                          className="inline-block mr-2 h-[28px] w-[28px] font-bold"
                        /> */}
                        <span
                          className="text-white text-[12px]"
                          style={{ fontFamily: 'Avenir' }}
                        >
                          Overview
                        </span>
                      </div>
                    }
                    value="1"
                    style={{
                      borderBottomLeftRadius: '15px',
                      borderBottomRightRadius: '15px',
                      overflow: 'hidden',
                    }}
                    sx={{
                      width: '50%',
                      backgroundColor: value === '2' ? '#252D00' : '#799400',
                      minHeight: '36px',
                      height: '36px',
                    }}
                  />

                  <Tab
                    label={
                      <div className="flex items-center h-5">
                        {/* <img
                          src="/Assets/Icons/Group.svg"
                          alt="Group"
                          className="mr-2"
                        /> */}
                        <span
                          className="text-white text-[12px]"
                          style={{ fontFamily: 'Avenir' }}
                        >
                          History
                        </span>
                      </div>
                    }
                    value="2"
                    style={{
                      borderBottomLeftRadius: '15px',
                      borderBottomRightRadius: '15px',
                      maxHeight: '15px',
                    }}
                    sx={{
                      width: '50%',
                      backgroundColor: value === '2' ? '#799400' : '#252D00',
                      minHeight: '36px',
                      height: '36px',
                    }}
                  />
                </TabList>
              </Box>
            </Box>
          </TabContext>

        </div>

        {chronologicalView ? (<div className="flex flex-col gap-2 bg-[#4e4e4e] w-full p-8 pt-4 pb-4">
          <div className="flex flex-col gap-4">
            {allLikesList.map((like, index) => userProfileListComponent(like, navigate, "View Profile", () => navigate(`/profile/${returnEncryptedUserId(like.id)}`), index, true, true))}
          </div>
          {!isLastBatchStateAllLikes && (
            <div className="flex justify-center">
              <AppButton onClick={() => fetchAllLikesinChronologicalOrder(uId)} className="your-button-classes">
                Load More
              </AppButton>
            </div>
          )}
        </div>) : (
          cIds.map((cId) => (
            cIdsLikes[cId]?.length > 0 && (
              <div key={cId} className="flex flex-col gap-2 bg-[#4e4e4e] w-full p-8 pt-4 pb-4">
                <h2 className="text-base text-white">{voteCardsQuestions[cId]}</h2>
                <div className="flex flex-col gap-4">
                  {cIdsLikes[cId]?.map((like, index) => userProfileListComponent(like, navigate, "View Profile", () => navigate(`/profile/${returnEncryptedUserId(like.id)}`), index, true))}
                </div>
                {!isLastBatchStates[cId] && (
                  <div className="flex justify-center">
                    <AppButton onClick={() => fetchLikes(cId)} className="your-button-classes">
                      Load More
                    </AppButton>
                  </div>
                )}
              </div>
            )
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#4e4e4e] h-full">
      <ProfileHeader headerText="Votes" />
      <div className="flex flex-col gap-2 bg-[#4e4e4e] w-full p-8 pt-4 pb-4 text-white">
        {allLikesNumberList.map((like, index) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="text-base"> {like.card.card}</div>
              <div className="text-base"> : </div>
              <div className="text-base"> {like.likes}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllProfileCardLikes;