import React, { useState, useEffect } from "react";
import axios from "axios";
import { returnEncryptedUserId, userProfileListComponent, SuccessDialog } from "../../utils";
import { useAuth } from "../../../providers/auth-provider";
import { useNavigate } from "react-router-dom";
import AppButton from "../../Common/AppButton";
import ReferralModal from "../../Common/ReferralModal";
import mixpanel from 'mixpanel-browser';

const YourClass = ({ profilePage = false, setPeopleYouMayKnowList }) => {
  const { user, getUserDetails } = useAuth();
  const [openReferralModal, setOpenReferralModal] = useState(false);
  const navigate = useNavigate();
  const firstUser = { ...user, lastName: `${user?.lastName} (You)` };
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState(profilePage ? [] : [firstUser]);
  const [lastDocument, setLastDocument] = useState(null);
  const [isLastBatchPYMKList, setIsLastBatchPYMKList] = useState(false);
  const [loading, setLoading] = useState(false);


  const getYourClassmatesList = async () => {
    setLoading(true);
    let allPeople = [];
    const payload = {
      limit: 20,
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
    if (setPeopleYouMayKnowList) {
      setPeopleYouMayKnowList(allPeople);
    }
    setLastDocument(newPeople[newPeople.length - 1]?.id);
    setIsLastBatchPYMKList(response.data.data.isLastBatch);
    setLoading(false);
  };

  const handleInvite = () => {
    setOpenReferralModal(true);
    mixpanel.identify(user.id);
    mixpanel.track('Invite_ClassCorner', {
    })
  }


  useEffect(() => {
    getYourClassmatesList();
  }
    , []);

  return (
    <div className="text-white pt-4 flex flex-col items-center gap-6 h-full w-full bg-[#4e4e4e]">
      <div className="flex flex-col gap-6  w-full bg-[#4e4e4e] p-4">
        <div className="flex gap-5 items-center text-[18px]">Classmates </div>
        <div className="flex flex-col gap-4 flex-grow w-full">
          {peopleYouMayKnow.map((friend) => {
            return userProfileListComponent(
              friend,
              navigate,
              "Follow",
            );
          })}
        </div>
        {!isLastBatchPYMKList ? (
          peopleYouMayKnow?.length > 1 && (
            <div className="flex justify-center items-center gap-4">
              <AppButton
                label="Load More"
                isLoading={loading}
                disabled={loading}
                progressSize={20}
                onClick={getYourClassmatesList}
                className="w-[130px] text-base"
              >
                Load More
              </AppButton>
              <AppButton
                label="Invite"
                className="w-[130px] text-base"
                onClick={handleInvite}
              >
                Invite
              </AppButton>
            </div>
          )
        ) : (
          <div className="flex justify-between items-center gap-3">
            <span className="text-white text-[18px]">Can't find your friend?</span>
            <AppButton
              label="No More Classmates"
              className="w-[130px] text-base"
              onClick={handleInvite}
            >
              Invite
            </AppButton>
          </div>
        )}

      </div>
      <ReferralModal
        open={openReferralModal}
        handleClose={() => setOpenReferralModal(false)}
      />
    </div>
  );

}

export default YourClass;