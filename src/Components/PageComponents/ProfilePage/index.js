import * as React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import ChildProfile from "./ChildProfile";
import ProfilePage from "./ParentProfile";
import PaymentPage from "./PaymentPage";
import * as FB from "../../Firebase/FirebaseFunctions";
import { ButtonGroup, Button, Grid, Paper, styled } from "@mui/material";
import { useSearchParams } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ShareIcon from '@mui/icons-material/Share';
import ModeEditOutlinedIcon from '@mui/icons-material/ModeEditOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import Diversity1Icon from '@mui/icons-material/Diversity1';
import Tab from '@mui/material/Tab';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import SwiperCore from 'swiper';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import CryptoJS from 'crypto-js';
import { secretKey } from "../../../firebase-config";
import { getCountFromServer } from "firebase/firestore";
import ScrapBookCards from "./ScrapBookCards";
import RenderProfileVoteCards from "./RenderVoteCards";
import VerticalCarousel from "./ScrapBookCarousel";
import EmojiPicker from 'emoji-picker-react';
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import { Dialog } from '@mui/material';
import { returnEncryptedUserId, userProfileListComponent, SuccessDialog } from "../../utils";
//import "swiper/swiper.scss";
//import "swiper/components/navigation/navigation.scss";
//import "swiper/components/pagination/pagination.scss";
//import "./styles.css";

/*import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation'; 
import 'swiper/css/pagination';

import Tab from '@mui/material/Tab';
import TabList from '@mui/material/TabList';
import TabPanel from '@mui/material/TabPanel';
import ImageIcon from '@mui/icons-material/Image';*/
import { createTheme, ThemeProvider } from '@mui/material/styles';
import html2canvas from 'html2canvas';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../providers/auth-provider";
import { collection, setDoc, where } from "firebase/firestore";
import { db } from "../../../firebase-config";
import { doc, getDoc, query, getDocs } from "firebase/firestore";
import AppButton from "../../Common/AppButton";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppInput from "../../Common/AppInput";
import FriendsList from "./FriendsList";
import ProfileVoteCard from "./ProfileVoteCards";
import Slider from "react-slick"; // or the relevant import from your carousel package
import { initializationVector } from "../../../firebase-config";
import EmojiGrid from "./EmojiGrid";
import ProfileHeader from "./ProfileHeader";
import mixpanel from 'mixpanel-browser';
import ProfileCardLikes from "./ProfileCardVotes";
import Loader from "../../PageComponents/Loader";
import YourClass from "./YourClass";

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const theme = createTheme({
  components: {
    MuiTabs: {
      styleOverrides: {
        indicator: {
          display: 'none',
        },
      },
    },
  },
});


export default function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [editFormData, setEditFormData] = useState({});
  const [totalGames, setTotalGames] = useState(0);
  const [totalFriends, setTotalFriends] = useState(0);
  const [profileFormValues, setProfileFormValues] = useState({});
  const [showEmojis, setShowEmojis] = useState(false);
  const pageMode = searchParams.get("mode");
  const inviteMode = searchParams.get("invite") === "yes";
  //const nextFriendLoading = searchParams.get("loading");
  const [nextFriendLoading, setNextFriendLoading] = useState(false);
  const voteCardId = searchParams.get("voteCardId");
  const [allProfileVoteCards, setAllProfileVoteCards] = useState({});
  const [voteCardsFilter, setVoteCardsFilter] = useState("Academics");
  const [voteCardsIndex, setVoteCardsIndex] = useState({});
  const [cardAvailabe, setCardAvailabe] = useState(false);
  const [friendStatus, setFriendStatus] = useState({});
  const [exitPopup, setExitPopup] = useState(false);
  const [viewVotesPopup, setViewVotesPopup] = useState(false);
  const [viewLikesPopup, setViewLikesPopup] = useState(false);
  const [addFriendPopup, setAddFriendPopup] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [profilePageLoading, setProfilePageLoading] = useState(false);
  const [profilePlayedData, setProfilePlayedData] = useState({});
  const [pageForYourClassmates, setPageForYourClassmates] = useState(1);

  const profileRef = useRef(null);
  //log(pageMode, "pageMode");



  let { encryptedId } = useParams();

  //console.log(userId);
  //console.log(encryptedId, "encryptedId");
  const { user, getUserDetails } = useAuth();
  //console.log(user);
  const [userProfileDetails, setUserProfileDetails] = useState({});
  const [profileVoteCards, setProfileVoteCards] = useState([{}]);

  //current url is /profile/userID and we need to get the userID from the url
  const [value, setValue] = React.useState('1');
  const [profileUserId, setProfileUserId] = React.useState("");
  const [lastDocument, setLastDocument] = useState(null);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState([]);
  const [isLastBatchPYMKList, setIsLastBatchPYMKList] = useState(false);
  const [userQuestions, setUserQuestions] = useState([]);
  const [userScrapBookCards, setUserScrapBookCards] = useState([]);
  //const [whatsappShareLoading, setWhatsappShareLoading] = React.useState(false);
  let peopleYouMayKnowList = [];
  if (pageMode === "findfriends") {
    //get peoplYouMayKnow list from local storage
    peopleYouMayKnowList = JSON.parse(localStorage.getItem("peopleYouMayKnow"));
  }

  let peopleYouMayKnowLimitReached = localStorage.getItem("peopleYouMayKnowLimitReached");

  useEffect(() => {
    if (!!profileRef.current) {
      profileRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [encryptedId]);


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

  useEffect(() => {
    async function fetchData() {
      if (inviteMode) {
        const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/set-people-you-may-know`, { userId: user?.id });
      }
    }
    //fetchData();
  }, [inviteMode]);

  /*useEffect(() => {
    if(profileUserId && user?.id){
      */

  //create a useeffect to get the user details from the firebase
  useEffect(() => {
    const asyncFunction = async () => {
      //console.log(profileUserId, "userId")
      if (profileUserId) {
        setProfilePageLoading(true);
        //userId = userId.charAt(0).toUpperCase() + userId.substring(1);
        //console.log(profileUserId, "userId")
        let promises = [];
        //get the child doc from the children collection..
        async function getUserDetails(profileUserId) {

          //console.log(profileUserId);
          //console.log(profileUserId.charAt(0).toUpperCase());
          const childrenCollectionRef = collection(db, 'children');
          const childDoc = doc(childrenCollectionRef, profileUserId);
          const childDocSnap = await getDoc(childDoc);
          const childData = childDocSnap.data();
          //add childId as id to the childData
          childData.id = profileUserId;
          //const profileDetails= await  getUserDetails(userId);
          //console.log(childData, "childData");
          if (!childData?.profileEmoji) {
            //childData.profileEmoji = "/Assets/Images/profilePic.svg";
          }
          setUserProfileDetails(childData);
          setProfileFormValues(childData);
        }

        async function getProfileVoteCards(profileUserId) {
          //console.log(profileUserId, "userId");
          //const categories = ["Physical Fitness", "Academics"];
          const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-profile-vote-cards`, { userId: user?.id, profileUserId: profileUserId });
          const voteCards = response.data.data;
          //vote cards are in the form of an object with keys as the category and values as the vote cards.destructure this data and add all cards into single array
          let allVoteCards = [];
          //create a map of key value pairs where key is the category and value is the length of  all vote cards
          let voteCardsLength = {};
          for (const category in voteCards) {
            const VoteCards = voteCards[category].map((card) => {
              return { ...card };
            });
            voteCardsLength[category] = allVoteCards.length;
            allVoteCards = [...allVoteCards, ...VoteCards];
          }
          setVoteCardsIndex(voteCardsLength);
          setProfileVoteCards(allVoteCards);
        }

        async function calculateTotalGames(profileUserId) {
          try {
            let numOfDocs = 0;
            const coll = collection(db, 'children', profileUserId, 'arenaGames');
            const snapshot = await getCountFromServer(coll);
            //console.log('count: ', snapshot.data().count);
            numOfDocs = snapshot.data().count;

            const coll2 = collection(db, 'children', profileUserId, 'games');
            const snapshot2 = await getCountFromServer(coll2);
            //console.log('count: ', snapshot2.data().count);
            numOfDocs += snapshot2.data().count;
            //console.log(numOfDocs, "numOfDocs");
            //setUserProfileDetails({ ...userProfileDetails, totalGames: numOfDocs });
            setTotalGames(numOfDocs);
          } catch (error) {
            console.error('Error calculating total games:', error);
          }
        };

        async function calculateTotalFriends(profileUserId) {
          try {
            let numOfDocs = 0;
            const coll = collection(db, 'children', profileUserId, 'friends');
            const snapshot = await getCountFromServer(coll);
            //console.log('count: ', snapshot.data().count);
            numOfDocs = snapshot.data().count;

            setTotalFriends(numOfDocs);
          } catch (error) {
            console.error('Error calculating total friends:', error);
          }
        };

        async function checkIfFriend() {
          try {
            //API endpoint :”check-if-friend”
            //Payload: { userId,friendId }
            //console.log(user?.id, "user?.id");
            //console.log(profileUserId, "profileUserId");
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/check-if-friend`, { userId: user?.id, friendId: profileUserId });
            //console.log(response.data.data, "response.data.data");
            //console.log(userProfileDetails, "userProfileDetails")
            //setisFriend(response.data.data)
            if (user?.id === profileUserId) {
              setFriendStatus({ isFriend: true, requestSent: false });
            } else {
              setFriendStatus(response.data.data);
            }
            //console.log(response.data.data, "response.data.dataTest");
          } catch (error) {
            console.error('Error checking if friend:', error);
          }
        };

        //check if the player is online or not by checking onlinUsers collection
        async function checkIfUserOnline(profileUserId) {
          try {
            //API endpoint :”check-if-user-online”
            //Payload: { userId }
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/check-if-user-online`, { userId: profileUserId });
            //console.log(response.data.data, "response.data.data");
            //console.log(userProfileDetails, "userProfileDetails")
            //setUserProfileDetails({ ...userProfileDetails, isOnline: response.data.data });
          } catch (error) {
            console.error('Error checking if user online:', error);
          }
        };

        async function getUserQuestions(profileUserId) {
          try {
            //API endpoint :”get-user-questions”
            //Payload: { userId }
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-user-questions`);
            //console.log(response.data.data, "response.data.data");
            setUserQuestions(response.data.data);
          } catch (error) {
            console.error('Error getting user questions:', error);
          }
        };

        async function getUserScrapBookCards(profileUserId) {
          try {
            //API endpoint :”get-user-scrap-book-cards”
            //Payload: { userId }
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-user-scrap-book-cards`, { userId: profileUserId, viewUserId: user?.id });
            //iterate through each card and fill out answer dtaa for editformdata
            //const scrapBookCards = response.data.data;

            //scrapBookCards.map((card,index) => {



            setUserScrapBookCards(response.data.data);
          } catch (error) {
            console.error('Error getting user scrap book cards:', error);
          }
        };

        async function updateProfileViewsCount(profileUserId, userId) {
          try {
            if (user?.id !== profileUserId) {

              //API endpoint :”update-profile-views-count”
              //Payload: { profileUserId }
              const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/update-profile-views-count`, { userId: profileUserId, viewUserId: user?.id });

            }
          } catch (error) {
            console.error('Error updating profile views count:', error);
          }
        };

        async function getNumberOfTournamentandMeriFinishes(profileUserId) {
          try {
            //API endpoint :”get-merit-finishes”  
            //Payload: { userId }
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-merit-finishes`, { userId: profileUserId });
            setProfilePlayedData(response.data.data);
          } catch (error) {
            console.error('Error getting merit finishes:', error);
          }
        };

        /*async function getProfileVoteCards(profileUserId) {
          try {
            //API endpoint :”get-profile-vote-cards”
            //Payload: { userId }
            const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-profile-vote-cards`, { userId: profileUserId });
            console.log(response.data.data, "response.data.data");
            setProfileVoteCards(response.data.data);
          } catch (error) {
            console.error('Error getting profile vote cards:', error);
          }
        }*/

        promises.push(getUserDetails(profileUserId));
        promises.push(getProfileVoteCards(profileUserId));
        promises.push(calculateTotalGames(profileUserId));
        promises.push(calculateTotalFriends(profileUserId));
        promises.push(fetchPeopleYouMayKnow());
        promises.push(checkIfFriend());
        promises.push(checkIfUserOnline(profileUserId));
        promises.push(getUserQuestions(profileUserId));
        promises.push(getUserScrapBookCards(profileUserId));
        promises.push(updateProfileViewsCount(profileUserId, user?.id));
        promises.push(getNumberOfTournamentandMeriFinishes(profileUserId));

        //promises.push(getProfileVoteCards(profileUserId));

        Promise.all(promises).then((values) => {
          setProfilePageLoading(false);
          //console.log(values, "values");
        }
        );
        //var ciphertext = CryptoJS.AES.encrypt(userId, secretKey).toString();
        //console.log(ciphertext, "ciphertext");
        //console.log(userId, "userId");

      }
    };

    // Encrypt

    asyncFunction();
    setPeopleYouMayKnow([]);
    setIsLastBatchPYMKList(false);

    //encryptDecrypt();

  }, [profileUserId]);

  useEffect(() => {
    // Query the ProfileVotes collection and get the document with the cardId field equal to voteCardId and userId as profileUserId
    const getVotes = async () => {
      if (pageMode === "viewvotes" && voteCardId && profileUserId) {
        const q = query(
          collection(db, "ProfileVotes"),
          where("cardId", "==", voteCardId),
          where("userId", "==", profileUserId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            const voteData = doc.data();
            //get the list of likes and set it in the state variable
            setCardAvailabe(true);
          });
        } else {
          setCardAvailabe(false);
          console.log("No such document!");
        }
      }
    };
    getVotes();
  }, [voteCardId, pageMode, profileUserId]);


  /*
    useEffect(() => {
      if( allProfileVoteCards && voteCardsFilter && allProfileVoteCards[voteCardsFilter]){
        console.log(voteCardsFilter, "voteCardsFilter")
        console.log(allProfileVoteCards, "allProfileVoteCards")
        console.log(allProfileVoteCards[voteCardsFilter], "allProfileVoteCards[voteCardsFilter]");
        setProfileVoteCards(allProfileVoteCards[voteCardsFilter]);
      }
    }, [voteCardsFilter,allProfileVoteCards]);*/


  useEffect(() => {
    if (userScrapBookCards && userScrapBookCards.length > 0 && pageMode === "edit") {
      editFormData.answersData = [];
      userScrapBookCards.map((card, index) => {
        editFormData.answersData.push(card.answer);
      });
      setEditFormData(editFormData);
    }
  }, [userScrapBookCards, pageMode]);

  const getYourClassmatesList = async () => {
    let allPeople = [];
    const payload = {
      limit: 10,
    };
    if (lastDocument) {
      payload.lastUserId = lastDocument;
    }
    //make another api call to get more people you may know for get-recommended-people and add it to the allPeople list
    const response = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/profile/get-recommended-people`,
      payload
    );
    const newPeople = response.data.data.data;
    allPeople = [...peopleYouMayKnow, ...newPeople];
    setPeopleYouMayKnow(allPeople);
    setLastDocument(newPeople[newPeople.length - 1]?.id);
    setIsLastBatchPYMKList(response.data.data.hasMore);
  };

  const fetchPeopleYouMayKnow = async () => {
    setLoading(true);
    try {
      //API endpoint :”get-friends-list”
      //Payload: { userId,fetchLimit,lastDocumentID }
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-people-You-may-know`, { userId: user?.id, limit: 10, lastDocumentId: lastDocument });
      const newPeople = response.data.statusCode.data;
      let allPeople = [...peopleYouMayKnow];
      if (newPeople.length > 0) {
        allPeople = [...peopleYouMayKnow, ...newPeople];
        // Assuming each friend has a unique ID
      }
      getYourClassmatesList();
      // if(allPeople.length < 10){
      //   const payload = {
      //     limit: 10,
      //   }
      //   if (lastDocument) {
      //     payload.lastUserId = lastDocument;
      //   }
      //   //make another api call to get more people you may know for get-recommended-people and add it to the allPeople list
      //   const response = await axios.post(
      //     `${process.env.REACT_APP_NODE_BASE_URL}/profile/get-recommended-people`,
      //     payload
      //   );
      //   const newPeople = response.data.data.data;
      //   allPeople = [...allPeople, ...newPeople];
      // }
      setPeopleYouMayKnow(allPeople);
      setLastDocument(newPeople[newPeople.length - 1]?.id);

      setIsLastBatchPYMKList(response.data.statusCode.isLastBatch);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      const profileSection = document.getElementById('profileSection');
      const canvas = await html2canvas(profileSection);

      const imageDataURL = canvas.toDataURL('image/png');
      const message = 'Check out my profile on MyApp!';

      await shareOnWhatsapp(imageDataURL, message);
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const shareOnWhatsapp = async (imageDataURL, message) => {
    try {
      // Check if the browser supports sharing
      if (!navigator.share) {
        window.alert("Sharing is not supported.");
        return;
      }

      // Fetch the image blob
      const blob = await fetch(imageDataURL).then(res => res.blob());
      const files = [new File([blob], 'profile.png', { type: 'image/png' })];

      const shareData = {
        files,
        text: message
      }
      // Share both the image and the text message
      await navigator.share(shareData);

    } catch (err) {
      console.error(err);
      window.alert("Can't share over WhatsApp.");
    }
  };
  //console.log(userProfileDetails, "userProfileDetails");
  //console.log(user, "user");

  const handleFollowRequest = async (sendeeId = userProfileDetails?.id) => {
    try {
      //make an api call to the backend to send a follow request to the user
      //        const postResponse = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/matching/create-open-challenge`, { userId: user?.id,userName:user?.firstName,challengeeId: challengedUser.id,challengeeName:challengedUser.firstName, gameType:gameType });
      //API endpoint :”create-friend-request”
      //Payload: { senderId,sendeeId }
      //console.log(sendeeId, "sendeeId");
      //console.log(user?.id, "user?.id");
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/create-friend-request`, { senderId: user?.id, sendeeId: sendeeId });
      //console.log(response);
    } catch (error) {
      console.error('Error sending follow request:', error);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleViewAllVotes = (userId) => {
    navigate(`/profile/allvotes?uId=${encryptUserID(profileUserId)}`)
  };

  const renderAddFriendPopup = () => {
    return (
      <Dialog
        open={addFriendPopup}
        onClose={() => setAddFriendPopup(false)}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-base">

          <ul className="my-3 mx-0">
            <p className="my-2 mx-0 ml-[-30px] text-center">Youb are not a friend  </p>
            <p className="my-3 mx-0 ml-[-30px] text-center"> make a follow request to view profile details</p>
          </ul>
        </div>
      </Dialog>
    );
  };



  const renderViewVotesPopup = () => {

    return (
      <Dialog
        open={viewVotesPopup.show}
        onClose={() => setViewVotesPopup({ show: false })}
        className="register-success"
        //tyle={{ maxHeight: '30vh' }}
      >
        <div
          className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-3 py-3 leading-3 text-sm"
          style={{ maxHeight: '280px' }}
        >
          <div
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(100% - 6px)' }}
          >
            <ProfileCardLikes uId={viewVotesPopup.userId} cId={viewVotesPopup.cardId} />
            {/* Place your inner component here. It will be scrollable if the content exceeds the height of the outer div. */}
          </div>
        </div>
        <div className="flex justify-center bg-primary-gradient pb-3 space-x-3">
          <AppButton
            className="w-[82px]"
            onClick={() => setViewVotesPopup({ show: false })}
            label="Close"
          >
            Close
          </AppButton>
          <AppButton
            className="w-[82px]"
            onClick={() => handleViewAllVotes(viewVotesPopup.userId)}
            label="View All Votes"
          >
            View All
          </AppButton>
        </div>

      </Dialog>
    );
  };


  const renderViewLikesPopup = () => {

    return (
      <Dialog
        open={viewLikesPopup.show}
        onClose={() => setViewLikesPopup({ show: false })}
        className="register-success"
      //style={{ maxHeight: '60vh' }}
      >
        <div
          className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-3 py-3 leading-3 text-sm"
          style={{ height: '100%' }}
        >
          <div
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(100% - 6px)' }}
          >
            <ProfileCardLikes uId={viewLikesPopup.userId} cId={viewLikesPopup.cardId} profileQuestionsLikes={true} />
            {/* Place your inner component here. It will be scrollable if the content exceeds the height of the outer div. */}
          </div>
        </div>
        <div className="flex justify-center bg-primary-gradient pb-3 space-x-3">
          <AppButton
            onClick={() => setViewLikesPopup({ show: false })}
            label="Close"
          >
            Close
          </AppButton>
        </div>

      </Dialog>
    );
  };


  const handleFriendsIconClick = () => {

    navigate(`/friendslist/${encryptedId}`);
  };

  const handleSendFriendRequest = async (friend) => {
    try {
      //og(friend, "friendRequest");
      await handleFollowRequest(friend.id);

      //update the friendStatus in the state variable
      setFriendStatus({ isFriend: false, requestSent: true })

      //remove the friend from the peopleYouMayKnow list
      const newPeopleYouMayKnow = peopleYouMayKnow.filter((person) => person.id !== friend.id);
      setPeopleYouMayKnow(newPeopleYouMayKnow);
    }
    catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  //console.log(userId, "userId");
  const renderPeopleYouMayKnow = () => {
    //filter out profilkeUserId from the peopleYouMayKnow list

    // const updatedPeopleYouMayKnow = peopleYouMayKnow.filter((person) => person.id !== profileUserId);
    //let shuffledPeopleYouMayKnow = updatedPeopleYouMayKnow.slice(0, 10);
    //console.log(updatedPeopleYouMayKnow, "updatedPeopleYouMayKnow");
    //shuffle the peopleYouMayKnow list and get the first 10 elements

    // let shuffledPeopleYouMayKnow = updatedPeopleYouMayKnow.sort(() => 0.5 - Math.random());
    // shuffledPeopleYouMayKnow = shuffledPeopleYouMayKnow.slice(0, 10);

    return (
      <div className="flex flex-col gap-6 pt-0 w-full bg-primary-gray-20 h-full flex-grow z-1">
        <div className="flex flex-col gap-6 bg-primary-gray-20 w-full p-6 pt-0 flex-grow z-1">
          <div className="flex gap-5 items-center sticky top-[60px] bg-primary-gray-20">
            <div className="text-2xl text-white mt-4">Your Classmates</div>
          </div>
          <div className="flex flex-col gap-4 flex-grow">
            {peopleYouMayKnow.map((friend) => {
              return userProfileListComponent(
                friend,
                navigate,
                "Follow",
                handleSendFriendRequest
              );
            })}
          </div>
          {!isLastBatchPYMKList && (
            <div className="flex justify-center">
              <AppButton
                label="Load More"
                loading={loading}
                disabled={loading}
                onClick={fetchPeopleYouMayKnow}
              >
                Load More
              </AppButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderEditProfile = () => {
    return (
      <div className="w-full flex flex-col gap-12">
        <AppInput
          //onChange={setLocalUserId}
          //value={localUserId}
          placeholder="Enter your name to play a demo"
          className="text-center"
        />
        <AppButton
          type="button"
          className="self-center"
        //disabled={!localUserId}
        //onClick={handleLogin}
        >
          Let's Go
        </AppButton>
      </div>
    );
  }


  /*const renderProfileVoteCards = () => {
    return (
      <Swiper
        spaceBetween={50}
        slidesPerView={1}
        onSlideChange={() => console.log('slide change')}
        onSwiper={(swiper) => console.log(swiper)}
      //navigation={true}
      // add more Swiper parameters as needed
      >
        {profileVoteCards.map((cardData, index) => (
          <SwiperSlide key={index}>
            <ProfileVoteCard
              user={user}
              userProfileDetails={userProfileDetails}
              cardData={cardData}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }*/

  const handleEditProfileClick = () => {
    //add mode == edit to the url
    window.location.href = `/profile/${encryptedId}?mode=edit`;
  };

  const handleViewOtherFriends = (navigate) => {
    if (profileUserId !== user?.id) {
      navigate(`/friendslist/${encryptedId}`);
    }
    else {
      navigate(`/friendslist/${encryptedId}?onlyFriends=true`);
    }
  };


  //console.log(userProfileDetails, "userProfileDetails");

  const handleGoback = () => {
    navigate(-1);
  };
  const handleSaveChanges = async () => {
    //setData to the childDoc in children collection
    //console.log(editFormData, "editFormData");
    const updatedFields = ['profileName', 'city', 'grade', 'profileEmoji'].reduce((acc, field) => {
      if (editFormData[field] !== null && editFormData[field] !== undefined) {
        acc[field] = editFormData[field];
      }
      return acc;
    }, {});
    //console.log(updatedFields, "updatedFields");
    //update only values that are not null
    setProfileFormValues({ ...profileFormValues, ...updatedFields });
    await setDoc(doc(db, "children", userProfileDetails.id), updatedFields, { merge: true });
    await updateUserAnswers();
    if (inviteMode) {

      //handleCommunityClick();
      setOpenSuccessModal(true);
    }
    else {
      //navigate(`/profile/${encryptedId}`);
      window.location.href = `/profile/${encryptedId}`;
    }
  };

  const updateUserAnswers = async () => {
    //console.log(editFormData, "editFormData");
    //console.log(editFormData.answersData, "editFormData.answersData");
    if (editFormData.answersData) {
      //get all the answers and get thier reponding questions based on the index
      const answersData = editFormData.answersData;
      //map the answersData  and get the questionId  and question. then update in the database...
      /*answersData.map(async (answer, index) => {
        console.log(answer, "answer", index, "index");
        const questionData = questionsData[index];
        const question = questionsData[index].question;
        const questionId = questionsData[index].id;
        console.log(question, "question");
        console.log(questionData, "questionData");
        //make question and answer as a key value pair and update in the database
        const questionAnswer = {};
        questionAnswer[question] = answer;
      }
      );*/
      let questionAnswerPairs = answersData
        .map((answer, index) => {
          if (answer === null || answer === '') {
            //return null;
          }
          else {
            return { question: userQuestions[index].question, answer: answer, id: userQuestions[index].id };
          }
        })

      questionAnswerPairs = questionAnswerPairs.filter(item => item != null);

      //remove all the null values from the array


      //update the answers in the database by making an api call
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/update-user-answers`, { userId: userProfileDetails.id, questionAnswerPairs });
    }
  };


  const handleChallengePlayerIfOnline = async () => {

    //handleChallengOnlineUser(userProfileDetails, user);

    //need to implementtt challenge player if online
  };


  const encryptUserID = (userId) => {
    const key = CryptoJS.enc.Hex.parse(secretKey);
    const iv = CryptoJS.enc.Hex.parse(initializationVector);
    const encryptedUserId = CryptoJS.AES.encrypt(userId, key, { iv: iv }).toString();
    let urlSafeEncryptedUserId = encryptedUserId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return urlSafeEncryptedUserId;
  };

  const getNextProfileAndNavigate = async () => {
    //get the next profile from the list of profiles and navigate to the next profile

    const currentProfileIndex = peopleYouMayKnowList.findIndex((person) => person.id === userProfileDetails.id);
    const nextProfileIndex = currentProfileIndex + 1;


    if (nextProfileIndex < peopleYouMayKnowList.length) {
      const nextProfile = peopleYouMayKnowList[nextProfileIndex];
      //encrypt the userId and navigate to the next profile
      const urlSafeEncryptedUserId = encryptUserID(nextProfile.id);
      navigate(`/profile/${urlSafeEncryptedUserId}?mode=findfriends`);
    }
    else if (nextProfileIndex === peopleYouMayKnowList.length) {
      //setSearchParams({loading:"Y", mode: 'findfriends' });
      setNextFriendLoading(true);
      localStorage.setItem("peopleYouMayKnowLimitReached", "true");
      const response = await axios.post(`${process.env.REACT_APP_NODE_BASE_URL}/profile/get-recommended-people`, { userId: user?.id, showLimit: 5, lastDocument: peopleYouMayKnowLimitReached !== "true" ? null : peopleYouMayKnowList[peopleYouMayKnowList.length - 1].id });
      const newPeople = response.data.data.data;
      if (newPeople.length > 0) {
        const allPeopleYouMayKnow = [...peopleYouMayKnowList, ...newPeople];
        //update the list of peopleYouMayKnow in local storage
        localStorage.setItem("peopleYouMayKnow", JSON.stringify([...peopleYouMayKnowList, ...newPeople]));
        const nextProfile = allPeopleYouMayKnow[nextProfileIndex];
        //encrypt the userId and navigate to the next profile
        const urlSafeEncryptedUserId = encryptUserID(nextProfile.id);
        navigate(`/profile/${urlSafeEncryptedUserId}?mode=findfriends`);
        //setLastDocument(newPeople[newPeople.length - 1].id); // Assuming each friend has a unique ID
      }
      setNextFriendLoading(false);
      //const nextProfile = peopleYouMayKnow[0];
      //encrypt the userId and navigate to the next profile
      //const urlSafeEncryptedUserId = encryptUserID(nextProfile.id);
      //navigate(`/profile/${urlSafeEncryptedUserId}?mode=findfriends`);
    }
  };

  const renderExitEditPagePopup = () => {
    return (
      <Dialog
        open={exitPopup}
        onClose={() => setExitPopup(false)}
        className="register-success"
      >
        <div className="relative flex flex-col bg-primary-gradient text-white h-full overflow-hidden px-6 py-6 leading-6 text-sm">

          <ul className="my-3 mx-0">
            <p className="my-2 mx-0 ml-[-30px] text-center">Are you sure you go back? </p>
            <p className="my-3 mx-0 ml-[-30px] text-center"> you have unsaved changes</p>
          </ul>

          <div className='flex items-center justify-center w-full h-full'>

            <AppButton
              onClick={() => { setSearchParams({ mode: '' }); setExitPopup(false); setEditFormData({}) }}
              className="rounded-[115px] min-w-[100px] w-[100ppx] h-[35px] min-h-[35px] self-center items-center mr-2"
            >
              Yes
            </AppButton>
            <AppButton
              onClick={() => setExitPopup(false)}
              className="rounded-[115px] min-w-[100px] w-[100ppx] h-[35px] min-h-[35px] self-center items-center"
            >
              No
            </AppButton>
          </div>
        </div>
      </Dialog>
    );
  }

  const getPrevProfileAndNavigate = async () => {
    const currentProfileIndex = peopleYouMayKnowList.findIndex((person) => person.id === userProfileDetails.id);
    const previousProfileIndex = currentProfileIndex - 1;
    if (previousProfileIndex >= 0) {
      const previousProfile = peopleYouMayKnowList[previousProfileIndex];
      //encrypt the userId and navigate to the next profile
      const urlSafeEncryptedUserId = encryptUserID(previousProfile.id);
      navigate(`/profile/${urlSafeEncryptedUserId}?mode=findfriends`);
    }
    else {/*
      const previousProfile = peopleYouMayKnowList[peopleYouMayKnow.length - 1];
      //encrypt the userId and navigate to the next profile
      const urlSafeEncryptedUserId = encryptUserID(previousProfile.id);
      navigate(`/profile/${urlSafeEncryptedUserId}?mode=findfriends`);*/
    }
  };

  const handleSubmitEmoji = async (emoji) => {
    //update the emoji in the database
    //console.log(emoji, "emoji");

    await setDoc(doc(db, "children", userProfileDetails.id), { profileEmoji: emoji }, { merge: true });
    window.location.reload();
    //setEditFormData({ ...editFormData, profileEmoji: emoji });
    //setProfileFormValues({ ...profileFormValues, profileEmoji:
  };


  const userProfileComponent = (userProfileDetails) => {
    return (
      <div className="flex flex-col ml-2 pt-1 pb-4">
        <div className="flex items-end mt-0 mb-0">
          <h2 className="mr-1 mt-0 mb-0 text-white">
            {profileFormValues.profileName
              ? profileFormValues.profileName
              : `${userProfileDetails?.firstName} ${userProfileDetails?.lastName}`}
          </h2>
          <p className="text-white inline-block text-sm font-montserrat mb-0 mt-0">({profileFormValues?.city})</p>        </div>
        <p className="text-white inline-block text-sm font-montserrat mb-0 mt-0">{profileFormValues?.school}, Grade {profileFormValues?.grade}</p>
      </div>
    );
  }


  const handleViewAll = () => {
    navigate(`/20questions/${encryptedId}`)
  }


  const previewConfig = {
    defaultEmoji: "1f600", // Example default emoji
    defaultCaption: "What's your mood?", // Example default caption
    showPreview: true, // Whether to show the preview or not
  };

  if (pageMode === 'edit' && !showEmojis) {

    return (
      <div className="w-full h-full flex flex-col bg-[#3A3A3A] relative" >
        {renderExitEditPagePopup()}
        {/** SuccessDialog = (message, user, profileUserId, navigate, encryptedId) => { */}
        {openSuccessModal && <SuccessDialog message="Your profile is complete! Checkout other profiles and vote for people you know!" user={user} profileUserId={userProfileDetails.id} navigate={navigate} encryptedId={encryptedId} />}
        <div className="w-screen fixed top-0 left-0">
          <ProfileHeader goback={handleGoback} headerText="Your Profile" editFormData={editFormData} setEditFormData={setEditFormData} setExitPopup={setExitPopup} pageMode={pageMode} />
        </div>
        <div className="flex flex-col pl-5 pt-[72px]">
          {(!editFormData?.profileEmoji && !userProfileDetails?.profileEmoji) ? (
            <div className='flex items-center '>
              <img
                src='/Assets/Icons/Nimbu.svg'
                alt="icon"
                style={{ width: '65px', height: '65px' }}
              />
            </div>
          ) :
            (<div>
              <Emoji unified={editFormData?.profileEmoji ? editFormData.profileEmoji : userProfileDetails?.profileEmoji} size="65" />
            </div>)}

          <div onClick={() => setShowEmojis(true)} className="underline text-white pb-4">
            change your emoji
          </div>
        </div>
        <div className="flex flex-col gap-4 text-white bg-[#3A3A3A]">
          <div className="text-center p-5">
            Answer 20 Questions about yourself
          </div>
          <div className="flex flex-col text-white">
            {/*{questionsData.map((questionData, index) => {
              return (
                <div key={index} className="flex flex-col" >
                  <div className="flex flex-col text-white">
                    {questionData.question}
                  </div>
                  <AppInput
                    onChange={(event) => {
                      let newFormData = {...editFormData};
                      if (!newFormData["answersData"]) {
                        newFormData["answersData"] = [];
                      }
                      newFormData["answersData"][index] = event;
                      setEditFormData(newFormData);
                    }}
                    value={editFormData["answersData"]?.[index]}
                    placeholder="Enter your answer"
                    className="text-center"
                  />
                </div>
              );
            })}*/}

            {userScrapBookCards.map((questionData, index) => {
              //setEditFormData({ ...editFormData, answersData: userScrapBookCards.map((card) => card.answer) });




              return (
                <div key={questionData.id} className="flex flex-col justify-around px-9 mb-4 h-full w-full max-w-lg md:gap-[8%] ">
                  <div className="flex flex-col text-white ">
                    {questionData.question}
                  </div>
                  <AppInput
                    onChange={(event) => {
                      //let newFormData = { ...editFormData };
                      let newFormData = { ...editFormData };
                      if (!newFormData["answersData"]) {
                        newFormData["answersData"] = [];
                      }
                      if (index >= newFormData["answersData"].length) {
                        newFormData["answersData"].length = index + 1;
                      }
                      if (event.length <= 60) {
                        newFormData["answersData"][index] = event;
                        setEditFormData(newFormData);
                      }
                      else {

                      }
                    }}
                    value={editFormData?.["answersData"]?.[index]}
                    placeholder="Enter your answer"
                    className="text-center"
                  />
                  {editFormData?.["answersData"]?.[index] && editFormData?.["answersData"]?.[index]?.length >= 60 && <div className="text-red-500 text-center text-xs">Max 60 characters</div>}
                </div>
              );
            })}

          </div>
        </div>

        <div>

          {/**display list of scrapbook questins...*/}
        </div>
        <div className="flex justify-center space-x-4 pb-4 bg-[#3A3A3A]">
          <AppButton
            label="cancel"
            loading={loading}
            disabled={loading}
            //remove the mode from the url

            onClick={() => { setEditFormData({}); setSearchParams({ mode: null }) }}
          >
            Cancel
          </AppButton>

          <AppButton
            label="Save"
            loading={loading}
            disabled={loading}
            onClick={handleSaveChanges}
          >
            Save
          </AppButton>
        </div>
      </div>
    );
  }
  else if (showEmojis) {
    return (
      <div className="w-full h-full flex flex-col relative">
        <div className="w-screen fixed top-0 left-0">
          <ProfileHeader goback={handleGoback} headerText="Your Profile" showEmoji={true} setShowEmoji={setShowEmojis} />
        </div>
        <div className="w-full h-full flex flex-col p-4  w-screen bg-[#3A3A3A] pt-[72px]">

          <div className="flex gap-4 text-white items-center justify-center pb-2">
            <div className="text-white">
              current selected Emoji :
            </div>
            <div className="text-white">

              {(!editFormData?.profileEmoji && !userProfileDetails?.profileEmoji) ? (
                <div className='flex items-center '>
                  <img
                    src='/Assets/Icons/Nimbu.svg'
                    alt="icon"
                    style={{ width: '45px', height: '45px' }}
                  />
                </div>
              ) :
                (<div>
                  <Emoji unified={editFormData?.profileEmoji ? editFormData.profileEmoji : userProfileDetails?.profileEmoji} size="45" />
                </div>)}
            </div>

          </div>

          <EmojiPicker
            onEmojiClick={clickedEmoji => {
              setEditFormData({ ...editFormData, profileEmoji: clickedEmoji.unified });
              //setCurrentEmoji(clickedEmoji);
            }}
            autoFocusSearch={false}
            previewConfig={previewConfig}
            height={550}
            width="100%"
          ///epr-bg-color="#3A3A3A"
          />

          <div className="flex justify-center pt-4 pb-4 bg-[#3A3A3A]">
            <AppButton
              label="Save"
              onClick={() => handleSubmitEmoji(editFormData.profileEmoji)}
            >
              Save
            </AppButton>
          </div>
        </div>
        {/* <div className="w-screen fixed top-0 left-0">
          <ProfileHeader goback={handleGoback} headerText="Your Profile" showEmoji={true} setShowEmoji={setShowEmojis} />
        </div>
        <div className="w-full h-full flex flex-col p-4  w-screen bg-[#3A3A3A] pt-[72px]">

          <div className="flex flex-col pb-4">
            {<div>
              <EmojiGrid totalEmojis={4000} profileUserId={profileUserId} setShowEmojis={setShowEmojis} setUserProfileDetails={setUserProfileDetails} />
               </div> }
            <div className="flex gap-4 text-white items-center justify-center pb-2">
              <div className="text-white">
              current selected Emoji :
              </div>
              <div className="text-white">

                {(!editFormData?.profileEmoji && !userProfileDetails?.profileEmoji) ? (
                  <div className='flex items-center '>
                    <img
                      src='/Assets/Icons/Nimbu.svg'
                      alt="icon"
                      style={{ width: '45px', height: '45px' }}
                    />
                  </div>
                ) :
                  (<div>
                    <Emoji unified={editFormData?.profileEmoji ? editFormData.profileEmoji : userProfileDetails?.profileEmoji} size="45" />
                  </div>)}
                  </div>
  
            </div> 
            <div className="">
              <EmojiPicker
                onEmojiClick={clickedEmoji => {
                  setEditFormData({ ...editFormData, profileEmoji: clickedEmoji.unified });
                  //setCurrentEmoji(clickedEmoji);
                }}
                autoFocusSearch={false}
                previewConfig={previewConfig}
                height={575}
                width="100%"
                ///epr-bg-color="#3A3A3A"
              />
            </div>
            <div className="flex justify-center pt-4 pb-4 bg-[#3A3A3A]">
            <AppButton
              label="Save"
              onClick={() => handleSubmitEmoji(editFormData.profileEmoji)}
            >
              Save
            </AppButton>
            </div>
          </div>
        </div> */}
      </div>
    );
  }
  else {
    return (
      <ThemeProvider theme={theme}>
        {nextFriendLoading || profilePageLoading ? (<Loader />) :
          (<div className="w-full fixed top-0 left-0 h-full overflow-y-auto scroll-smooth flex-grow relative">

            <div className="w-screen fixed top-0 left-0 z-50">
              <ProfileHeader headerText={pageMode === "findfriends" ? "Find Friends" : "Profile"} pageMode={pageMode} />
            </div>
            {renderViewVotesPopup()}
            {renderViewLikesPopup()}
            {renderAddFriendPopup()}
            <div id='profileSection' ref={profileRef} className="p-5 pb-4 pt-[64px] bg-[#3A3A3A] flex flex-col justify-between">
              {pageMode === "findfriends" && <div className="w-full h-full flex text-white items-center justify-between">
                <img src="/Assets/Icons/swiper-prev.svg" alt="Group" className="h-7" onClick={getPrevProfileAndNavigate} />
                <h2 className="text-white text-xl">Click to find new players</h2>
                <img src="/Assets/Icons/swiper-next.svg" alt="Group" className="h-7" onClick={getNextProfileAndNavigate} />
              </div>}

              <div className="flex flex-col md:flex-row lg:flex-row justify-between">
                <div className="flex justify-between">
                  <div className="p-2 pb-0">
                    {(!userProfileDetails?.profileEmoji) ? (
                      <div style={{ width: '52px', height: '52px', borderRadius: '60%', border: '2px solid #ccf900' }}>
                        <img
                          src='/Assets/Icons/Nimbu.svg'
                          alt="icon"
                          className="w-full h-full"
                        // style={{ width: '35px', height: '35px' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '52px', height: '52px', borderRadius: '60%', border: '2px solid #ccf900', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Emoji unified={userProfileDetails?.profileEmoji} size="35" />
                      </div>
                    )}
                  </div>

                  <div className="relative p-0 m-0 z-1">
                    {user.id === userProfileDetails.id && (
                      <IconButton className="absolute top-0 right-0 p-0 m-0" style={{ color: "#CCF900" }} onClick={() => setShowEmojis(true)}>
                        <ModeEditOutlinedIcon />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>
              {userProfileComponent(userProfileDetails)}
              <div className="flex justify-start space-x-2 items-center h-4 font-montserrat text-xs">
                {/* <div className="flex items-center" onClick={() => handleViewOtherFriends(navigate)}>
                  <IconButton className="w-6 h-6">
                    <PersonOutlineIcon style={{ color: 'white', display: 'inline-block', fontSize: '18px' }} />
                  </IconButton>
                  <p style={{ color: 'white', display: 'inline-block', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>{totalFriends} Friends</p>
                </div> 

                <div className="flex items-center text-white">|</div>*/}

                <div className="flex items-center">
                  <IconButton className="w-6 h-6">
                    <SportsEsportsOutlinedIcon style={{ color: 'white', display: 'inline-block', fontSize: '18px' }} />
                  </IconButton>
                  <p style={{ color: 'white', display: 'inline-block', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>Tournaments : {profilePlayedData.tournamentsPlayed}</p>
                </div>

                <div className="flex items-center text-white">|</div>

                <div className="flex items-center">
                  {/* <IconButton className="w-6 h-6">
                    <SportsEsportsOutlinedIcon style={{ color: 'white', display: 'inline-block', fontSize: '18px' }} />
                  </IconButton> */}
                  <img src="/Assets/Icons/medal.svg" alt="Vote" className="inline-block h-[18px] w-[18px]" />

                  <p style={{ color: 'white', display: 'inline-block', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>Merit Finish: {profilePlayedData?.MeritFinishes > 1 ? profilePlayedData?.MeritFinishes : 0}</p>
                </div>

                {/*<div className="flex items-center text-white">|</div>

                 <div className="flex items-center">
                  <IconButton className="w-6 h-6">
                    <SportsEsportsOutlinedIcon style={{ color: 'white', display: 'inline-block', fontSize: '18px' }} />
                  </IconButton>
                  <p style={{ color: 'white', display: 'inline-block', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>Views : {userProfileDetails?.profileViewsCount ? userProfileDetails?.profileViewsCount : 0}</p>
                </div> */}
              </div>
            </div>

            {/* {user?.id === userProfileDetails?.id ? ( */}
              <div className=" bg-[#3A3A3A]">
                <div className="flex flex-col gap-4 pr-5 pl-5 pb-4 ml-2">
                  <AppButton className="min-h-[30px]" onClick={() => navigate('/class-jam')} variant="rectangularPrimary">
                    View Class
                  </AppButton>
                </div>
              </div>
            {/* // ) :
              // (
              //   <></>
              // )} */}

            <div className="pt-2  bg-[#4e4e4e] flex flex-col justify-between" >
              <TabContext value={value}>
                <div className="flex justify-center items-center">
                  <div className="h-0.5 bg-[#799400] w-full"></div>
                </div>
                <Box sx={{ width: '100%', typography: 'body1' }}>
                  <Box sx={{ borderColor: 'divider', width: 'calc(100% - 48px)', marginLeft: '24px', marginRight: '24px', fontWeight: "800" }}>
                    <TabList onChange={handleChange} className="tablist" sx={{ width: '100%', minHeight: '36px', height: '36px' }}>
                      <Tab
                        label={
                          <div className="flex items-center">
                            <img src="/Assets/Icons/Vote.svg" alt="Vote" className="inline-block mr-2 h-[28px] w-[28px] font-bold" />
                            <span className="text-white text-[14px] font-bold" style={{ fontFamily: "Avenir", fontWeight: "800" }}>Poll Booth</span>
                          </div>
                        }
                        value="1"
                        style={{
                          borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', overflow: 'hidden'
                        }}
                        sx={{
                          width: value === '1' ? '100%' : '50%',
                          backgroundColor: value === '2' ? '#252D00' : '#799400',
                          minHeight: '36px', height: '36px'

                        }}
                      />

                      {/* <Tab
                      label={
                        <div className="flex items-center h-5">
                          <img src="/Assets/Icons/Group.svg" alt="=Group" className="mr-2 " />
                          <span className="text-white text-[12px]" style={{ fontFamily: "Avenir" }}>20 Questions</span>
                        </div>
                      }
                      value="2"
                      style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', maxHeight: '15px' }}
                      sx={{
                        width: value === '2' ? '50%' : '50%',
                        backgroundColor: value === '2' ? '#799400' : '#252D00',
                        minHeight: '36px', height: '36px'
                      }}
                    /> */}
                    </TabList>
                  </Box>
                  {/*<TabPanel value="1"></TabPanel>*/}
                  <TabPanel value="1" >{value === '1' && <RenderProfileVoteCards profileVoteCards={profileVoteCards} setProfileVoteCards={setProfileVoteCards} userProfileDetails={userProfileDetails} user={user} setVoteCardsFilter={setVoteCardsFilter} voteCardsFilter={voteCardsFilter} voteCardsIndex={voteCardsIndex} setViewVotesPopup={setViewVotesPopup} friendStatus={friendStatus} setAddFriendPopup={setAddFriendPopup} />}</TabPanel>
                  <div className="flex flex-col justify-center items-center pt-8">
                    {value == "2" && <div className="w-full text-white underline text-end pr-6 text-sm pt-2 cursor-pointer mb-[-36px]" onClick={handleViewAll}> View All</div>}                  <div>
                      <TabPanel value="2" className="pb-0">{value === '2' && <VerticalCarousel userScrapBookCards={userScrapBookCards} friendStatus={friendStatus} setAddFriendPopup={setAddFriendPopup} user={user} userProfileDetails={userProfileDetails} setUserScrapBookCards={setUserScrapBookCards} setViewLikesPopup={setViewLikesPopup} />/*<ScrapBookCards userScrapBookCards={userScrapBookCards} />*/}</TabPanel>
                    </div>
                  </div>
                </Box>
              </TabContext>
            </div>
            <div className={`flex flex-col bg-[#3A3A3A] ${value == 2 ? 'mt-[-24px]' : ''}`}>
              <div className="flex justify-center items-center">
                <div style={{ width: '100%', height: '2px', backgroundColor: '#799400' }}></div>
              </div>
              <div>
                <YourClass profilePage={true} />
              </div>
            </div>
          </div>)}
      </ThemeProvider>
    );
  }
}


