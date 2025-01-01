import { Dialog } from '@mui/material';
import React, { useState } from 'react';
import AppButton from './AppButton';
import { useAuth } from '../../providers/auth-provider';
import { getWhatsappMessageForInvite, shareOnWhatsapp } from '../../Constants/Commons';
import mixpanel from 'mixpanel-browser';

const ReferralModal = ({ open, handleClose }) => {
  const { user } = useAuth();
  const [whatsappShareLoading, setWhatsappShareLoading] = useState(false);

  const handleInviteFriends = async () => {
    setWhatsappShareLoading(true);
    try {
      mixpanel.identify(user.id);
      mixpanel.track('Invite_Popup', {
      });
      const location = window.location;
      const registerUrl = `${location.protocol}//${location.host}/register?referralCode=${user?.referralCode}`;
      const whatsappMsg = getWhatsappMessageForInvite(registerUrl);
      await shareOnWhatsapp(whatsappMsg);
      
    } catch (err) {
      console.log(err);
    }
    setWhatsappShareLoading(false);
    if (handleClose) {
      handleClose();
    }
  };

    return (
      <Dialog open={open} className="register-success" onClose={handleClose}>
        <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-3 py-10 gap-6">
          <span className="text-2xl font-bold text-center text-primary-yellow">
            Invite Your Friends
          </span>
          <span className="text-sm text-center">
            Send an invite link to get your friends on maidaan.
          </span>
          {/* <div className="self-start space-y-4">
            <span className="text-primary-yellow">
              For each friend who registers:
            </span>
            <div>
              <div className="grid grid-cols-4 items-center">
                <span className="">You Earn:</span>
                <div className="col-span-3 flex items-center justify-end ">
                  <img
                    src="/Assets/Icons/vault.svg"
                    alt="trophy"
                    className="mr-2 h-7"
                  />
                  <span>10 coins in Vault*</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center">
                <span className="whitespace-nowrap">Friend Earns:</span>
                <div className="col-span-3 flex items-center justify-end">
                  <img
                    src="/Assets/Icons/vault.svg"
                    alt="trophy"
                    className="mr-2 h-7"
                  />
                  <span>05 coins in Vault*</span>
                </div>
              </div>
            </div>
          </div>
          <span className="text-xs text-primary-yellow">
            *Vault Coins can be directly used in the Reward Store
          </span> */}
          <AppButton
            type="button"
            className="self-center z-10"
            onClick={handleInviteFriends}
            isLoading={whatsappShareLoading}
          >
            Send Invite
          </AppButton>
        </div>
      </Dialog>
    );
};

export default ReferralModal;