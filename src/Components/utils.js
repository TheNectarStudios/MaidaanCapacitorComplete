import { db, firebaseAuth } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import CryptoJS, { enc } from "crypto-js";
import { secretKey } from "../firebase-config";
import { initializationVector } from "../firebase-config";
import AppButton from "./Common/AppButton";
import { Emoji } from "emoji-picker-react";
import { Dialog } from "@mui/material";
import Lottie from "lottie-react";
import confettiAnimation from "../assets/animations/confetti.json";
import { collection, getDocs } from "firebase/firestore";

export const TournamentStatus = (startTime, endTime) => {
  const currentTime = Math.ceil(new Date().getTime() / 1000);

  if (currentTime < endTime && currentTime > startTime) return "ONGOING";
  if (currentTime > endTime) return "COMPLETED";
  if (currentTime < startTime) return "UPCOMING";
};

export const findSchoolChild = async (childId) => {
  const docRef = doc(db, "children", childId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const tenantIds = data?.tenantIds;
    if (tenantIds) {
      return tenantIds.some(item => item !== "maidaan");
    }
  }
  return false;

};


export const returnEncryptedUserId = (userId) => {
  const key = CryptoJS.enc.Hex.parse(secretKey);
  const iv = CryptoJS.enc.Hex.parse(initializationVector);

  const encryptedUserId = CryptoJS.AES.encrypt(userId, key, { iv: iv }).toString();
  let urlSafeEncryptedUserId = encryptedUserId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return urlSafeEncryptedUserId;
}

export const decrypt = (encryptedId) => {
  const key = CryptoJS.enc.Hex.parse(secretKey);
  const iv = CryptoJS.enc.Hex.parse(initializationVector);
  let originalFormatEncryptedUserId = encryptedId.replace(/-/g, '+').replace(/_/g, '/') + "==";
  const decryptedBytes = CryptoJS.AES.decrypt(originalFormatEncryptedUserId, key, { iv: iv });
  const decryptedUserId = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedUserId;
};

const extractDateFromTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  //get in the format of 16 Sep 
  const formattedDate = date.getDate() + " " + date.toLocaleString('default', { month: 'short' });
  return formattedDate;
};


export const userProfileListComponent = (friend, navigate, buttonText, buttonAction, index, likesList = false, chronologicalView = false) => {

  if (likesList) {
    return (
      <div className="grid grid-cols-6 items-center gap-2">
        <div className="col-span-3 flex items-center" onClick={() => navigate(`/profile/${returnEncryptedUserId(friend.voterId)}`)}>
          <div className="flex items-center mr-3">
            {friend.profileEmoji ? (
              <div className='flex items-center'>
                <Emoji unified={friend.profileEmoji} size="25" />
              </div>
            ) : (
              <div className='flex items-center'>
                <img
                  src='/Assets/Icons/Nimbu.svg'
                  alt="icon"
                  style={{ width: '25px', height: '25px' }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 w-full ">
            <div className="flex items-center space-x-2">
              <div className="text-base" style={{ color: '#CCF900', textAlign: 'left' }}>{friend.voterFirstName}</div>
            </div>
          </div>
        </div>

        {chronologicalView && (
          <div className="col-span-2 text-[12px] text-white" style={{ textAlign: 'left' }}>
            {friend.card}
          </div>
        )}

        {chronologicalView && (
          <div className="col-span-1 text-[12px] text-white" style={{ textAlign: 'left' }}>
            {extractDateFromTimestamp(friend.createdAt)}
          </div>
        )}
      </div>
    )

  }





  return (
    <div className="flex flex-row justify-between items-center flex-grow">
      <div className="flex items-center" onClick={() => navigate(`/profile/${returnEncryptedUserId(friend.id)}`)}>
        <div className="flex items-center mr-3">

          {friend.profileEmoji ? (
            <div className='flex items-center '>
              <Emoji unified={friend.profileEmoji} size="25" />
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
            <div className="text-base" style={{ color: '#CCF900' }}>{`${friend.firstName} ${friend.lastName}`}</div>
          </div>
          {/*<div className="text-xs" style={{ color: 'white' }}>{`Grade ${friend.grade} | ${friend.school}, ${friend.city}`}</div>*/}
        </div>
      </div>
      {/*<div className="flex flex-col gap-1">
        <AppButton className="w-full min-w-[100px] h-[30px] min-h-[30px] self-center items-center flex-grow text-[13px]"
          onClick={() => {
            buttonAction(friend)
          }}>
          {buttonText}
        </AppButton>
      </div>*/}
    </div>
  );
};

export const SuccessDialog = ({ message, user, profileUserId, navigate, encryptedId }) => {
  return (
    <Dialog open={true} className="register-success">
      <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
        <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
        <span className="text-lg md:text-xl font-medium text-center">
          Game On!
        </span>
        <span className="text-sm text-center">
          {message}
        </span>
        <AppButton
          type="button"
          className="self-center z-10"
          onClick={() => handleCommunityClick(user, profileUserId, navigate, encryptedId)}
        >
          Proceed
        </AppButton>
        <Lottie
          animationData={confettiAnimation}
          loop={false}
          className="absolute h-full w-full top-0 z-0"
        />
      </div>
    </Dialog>
  );
};


const handleCommunityClick = async (user, profileUserId, navigate, encryptedId) => {
  //get the list of documents in peopleYouMayKnow collection in an array and set it in local storage
  let list = [];
  //update this part with api call later..
  const peopleYouMayKnow = collection(db, 'children', user?.id, 'peopleYouMayKnow');
  const querySnapshot = await getDocs(peopleYouMayKnow);
  querySnapshot.forEach((doc) => {
    if (doc.data().firstName) {
      list.push({ id: doc.id });
    }
  });
  //set the list in local storage
  if (list && list.length > 0) {
    //filter out the user from the list
    list = list.filter((person) => person.id !== profileUserId);
    localStorage.setItem('peopleYouMayKnow', JSON.stringify(list));
    //encrypt the user id and navigate to the profile page
    const key = CryptoJS.enc.Hex.parse(secretKey);
    const iv = CryptoJS.enc.Hex.parse(initializationVector);
    const encryptedUserId = CryptoJS.AES.encrypt(list[0].id, key, { iv: iv }).toString();
    let urlSafeEncryptedUserId = encryptedUserId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    navigate(`/profile/${urlSafeEncryptedUserId}?mode=findfriends`);
  }
  else {
    navigate(`/profile/${encryptedId}`);
  }
}


export const generatePasswordString = (name, phoneNumber) => {
  const [firstName] = name?.split(' ') ?? [''];
  if (!firstName) return '';
  const firstNameLowercase = firstName.toLowerCase();
  const lastTwoDigits = phoneNumber.slice(-2);
  const sum = Number(lastTwoDigits) + 15;
  const lastTwoDigitsOfSum = sum > 100 ? String(sum).slice(0, 2) : sum;
  return `${firstNameLowercase}${lastTwoDigitsOfSum}`;
}


export const getTournamentStatus = (closestTournament, demoTournament, ongoingTournament) => {
  let tournamentStatus = "No new notifications";
  //return the tournament status based on the current time and played status of the tournaments,
  const currentDate = new Date();

  //if time is from 11 am to 2 pm on saturaday
  if (currentDate.getDay() === 6 && currentDate.getHours() >= 11 && currentDate.getHours() < 14) {
    //check if ongoing tournament is started half an hour before
    if (demoTournament && demoTournament.tournamentData
      || ongoingTournament && ongoingTournament.ongoing && ongoingTournament.ongoing.tournamentData || ongoingTournament?.upcoming?.tournamentData) {
      tournamentStatus = "Round 1 will be LIVE between 2 PM - 5 PM.<br> Remember to login on time"
    }
  }

  //if time is from 2 pm to 5 pm on saturday
  else if (currentDate.getDay() === 6 && currentDate.getHours() >= 14 && currentDate.getHours() < 17) {
    if (ongoingTournament && ongoingTournament.ongoing && ongoingTournament.ongoing.tournamentData) {
      if (ongoingTournament.ongoing.playedStatus) {
        tournamentStatus = "Round 1 played.<br> Ranks may change before 5 PM as more contestants attempt.<br> Round 2 timings are 10 AM - 1 PM tomorrow."
      }
      else {
        tournamentStatus = "Play your round before 5 PM for your score to be counted"
      }
    }
  }

  //if time is from 5 pm saturday to 9 am sunday
  else if (currentDate.getDay() === 6 && currentDate.getHours() >= 17 || currentDate.getDay() === 0 && currentDate.getHours() < 9) {
    if (ongoingTournament && ongoingTournament.ongoing && ongoingTournament.ongoing.tournamentData) {
      if (ongoingTournament.ongoing.playedStatus) {
        tournamentStatus = "Round 2 will be LIVE between 10 AM - 1 PM.<br> Remember to login on time"
      }
      else {
        tournamentStatus = "Round 1 has been extended for you.<br> Play it now for your score to be counted"
      }
    }
  }

  //if time is from 9 am sunday to 10 am sunday
  else if (currentDate.getDay() === 0 && currentDate.getHours() >= 9 && currentDate.getHours() < 10) {
    if (ongoingTournament && ongoingTournament.ongoing && ongoingTournament.ongoing.tournamentData) {
      tournamentStatus = "Round 2 will be LIVE between 10 AM - 1 PM.<br> Remember to login on time"
    }
  }

  //if time is from 10 am to 1 pm on sunday
  else if (currentDate.getDay() === 0 && currentDate.getHours() >= 10 && currentDate.getHours() < 13) {
    if (ongoingTournament && ongoingTournament.ongoing && ongoingTournament.ongoing.tournamentData) {
      if (ongoingTournament.ongoing.playedStatus) {
        tournamentStatus = "Round 2 played.<br> Ranks may change before 1 PM as more contestants attempt.<br> Finalists will be declared at 1:30 PM"
      }
      else {
        tournamentStatus = "Play your round before 1 PM for your score to be counted"
      }
    }
  }

  //if time is from 1 pm to 2 pm on sunday ***
  else if (currentDate.getDay() === 0 && currentDate.getHours() >= 13 && currentDate.getHours() < 14) {

    if (ongoingTournament?.ongoing?.tournamentData && !ongoingTournament?.lastCompleted?.tournamentData) {
      if (!ongoingTournament?.ongoing?.tournamentData?.qualiEnded) {
        tournamentStatus = "Round concluded.<br> Finalists will be declared after 1:30 PM";
      }
      else if (ongoingTournament?.ongoing?.tournamentData?.qualiEnded && ongoingTournament?.upcoming?.tournamentData) {
        tournamentStatus = "You have qualified for the finals.<br> Final will be LIVE between 2 PM - 5 PM.<br> Remember to login on time";
      }
      else if (ongoingTournament?.ongoing?.tournamentData?.qualiEnded && !ongoingTournament?.upcoming?.tournamentData) {
        tournamentStatus = "You missed qualifying for the final round.<br> All the best for the next tournament.";
      }
    }
    else if (!ongoingTournament?.ongoing?.tournamentData && ongoingTournament?.lastCompleted?.tournamentData) {
      if (!ongoingTournament?.lastCompleted?.tournamentData?.qualiEnded) {
        tournamentStatus = "Round concluded. Finalists will be declared after 1:30 PM";
      }
      else if (ongoingTournament?.lastCompleted?.tournamentData?.qualiEnded && ongoingTournament?.upcoming?.tournamentData) {
        tournamentStatus = "You have qualified for the finals.<br> Final will be LIVE between 2 PM - 5 PM.<br> Remember to login on time";
      }
      else {
        tournamentStatus = "You missed qualifying for the final round.<br> All the best for the next tournament.";
      }
    }
    else if (ongoingTournament?.ongoing?.tournamentData && ongoingTournament?.lastCompleted?.tournamentData) {
      tournamentStatus = "You have qualified for the finals.<br> Final will be LIVE between 2 PM - 5 PM.<br> Remember to login on time";
    }
  }

  //if time is from 2 pm to 5 pm on sunday
  else if (currentDate.getDay() === 0 && currentDate.getHours() >= 14 && currentDate.getHours() < 17) {
    if ((ongoingTournament && ongoingTournament.ongoing && ongoingTournament.ongoing.tournamentData)) {
      if (ongoingTournament?.ongoing?.playedStatus) {
        tournamentStatus = "Final played.<br> Ranks may change before 5 PM as more contestants attempt.<br> Merit list will be declared at 6 PM"
      }
      else {
        tournamentStatus = "Play the final before 5 PM for your score to be counted"
      }
    }
    else if (ongoingTournament?.lastCompleted?.tournamentData) {
      tournamentStatus = "You missed qualifying for the final round.<br> All the best for the next tournament."
    }
  }

  //if time is from 5 pm to 6.30 pm on sunday
  else if (currentDate.getDay() === 0 && currentDate.getHours() >= 17 && (currentDate.getHours() < 18 || currentDate.getHours() === 18 && currentDate.getMinutes() < 30)) {
    let rankStatus = "";
    if (ongoingTournament?.ongoing?.tournamentData) {
      rankStatus = ongoingTournament?.ongoing?.rankStatus;
    }
    //last completed tournament and its end Date is within 90 minutes minutes from now. means final has ended.
    else if (ongoingTournament?.lastCompleted?.tournamentData && currentDate.getTime() - ongoingTournament?.lastCompleted?.tournamentData.endTime.seconds * 1000 <= 5400000) {
      rankStatus = ongoingTournament?.lastCompleted?.rankStatus;
    }
    //user has played the pool round and not registered for the final round.
    else if (ongoingTournament?.lastCompleted?.tournamentData) {
      rankStatus = "final_DNQ";
    }

    if (rankStatus == "NotDeclared") {
      tournamentStatus = "Tounament concluded. Merit list will be declared shortly"
    }
    else if (rankStatus === "Merit") {
      tournamentStatus = "Tounament concluded. You have secured a merit rank."
    }
    else if (rankStatus === "Rest") {
      tournamentStatus = "Tounament concluded. You missed securing a merit rank.<br> All the best for the next tournament."
    }
    else if (rankStatus === "final_DNQ") {
      tournamentStatus = "You missed qualifying for the final round.<br> All the best for the next tournament."
    }
  }

  return tournamentStatus;

}