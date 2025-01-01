import { Dialog } from '@mui/material';
import React, { useState } from 'react';
import AppButton from './AppButton';
import { useAuth } from '../../providers/auth-provider';
import { getNumberWithOrdinal } from '../../Constants/Commons';

const AttemptDisqualifiedPopup = ({
  open,
  handleClose,
  handleYes,
  handleNo,
  handleExit,
  allowedAttempts,
  totalAttempts,
}) => {
  return (
    <Dialog open={open} className="register-success">
      <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-3 py-10 gap-6">
        <span className="text-2xl font-bold text-center text-primary-yellow">
          {totalAttempts < allowedAttempts ? (
            <>INVALID ATTEMPT</>
          ) : (
            <>INVALID ATTEMPT</>
          )}
        </span>
        <span className="text-sm text-center">
          {totalAttempts < allowedAttempts ? (
            <>
              This attempt has not been counted, due to skipping too many
              questions or answering without solving. You have 1 re-attempt
              left. Please attempt the round properly and give it your best
              shot!
            </>
          ) : (
            <>
              This attempt has not been counted, due to skipping too many
              questions or answering without solving. Unfortunately you have no
              more re-attempts left and we will be unable to count your score
              for this round. All the best for the next one.
            </>
          )}
        </span>
        {totalAttempts < allowedAttempts && (
          <span className="text-xs text-primary-yellow">
            Do you want to proceed for the re-attempt now?
          </span>
        )}
        <div className="flex gap-4 w-full justify-center">
          {totalAttempts < allowedAttempts ? (
            <>
              <AppButton
                type="button"
                className="self-center z-10 w-[130px] min-w-[130px] !text-base"
                onClick={handleYes}
              >
                Yes
              </AppButton>
              <AppButton
                type="button"
                className="self-center z-10 w-[130px] min-w-[130px] !text-base"
                onClick={handleNo}
              >
                No
              </AppButton>
            </>
          ) : (
            <AppButton
              type="button"
              className="self-center z-10 w-[130px] min-w-[130px] !text-base"
              onClick={handleExit}
            >
              Exit
            </AppButton>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default AttemptDisqualifiedPopup;