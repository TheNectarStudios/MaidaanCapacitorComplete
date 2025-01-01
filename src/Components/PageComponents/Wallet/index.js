import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../../providers/app-provider";
import Layout from "../../Common/Layout";
import AppButton from "../../Common/AppButton";
import { claimReward, getCategories, getRewardsByCategory, isWalletHistoryCreditMoreThanZero } from "../../../services/wallet";
import useToast from "../../../hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomButtonBar from "../../Common/BottomButtonBar";
import { useAuth } from "../../../providers/auth-provider";
import AppRadio from "../../Common/AppRadio";
import { ReactComponent as DollarSvg } from "../../../assets/icons/dollar.svg";
import AppSelect from "../../Common/AppSelect";
import Lottie from "lottie-react";
import confettiAnimation from "../../../assets/animations/confetti.json";
import { Dialog } from "@mui/material";
import { ReactComponent as EditPencilSvg } from "../../../assets/icons/edit-pencil.svg";
import { Controller, useForm } from "react-hook-form";
import AppInput from "../../Common/AppInput";
import Loader from "../Loader";
import { MEASURE } from "../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { extractMonthlyEarnings, getDemoFlowData } from "../../../Constants/Commons";
import ReferralModal from "../../Common/ReferralModal";
import { getCoinsAfterDiscount } from "../../../Constants/Commons";
import { ReactComponent as AccessRevokeLockSvg } from "../../../assets/icons/access-revoke-lock.svg";

import DarkModal from "../../Common/DarkModal";
import { TOURNAMENT_SELECT_ROUTE } from "../../../Constants/routes";

const WalletPage = () => {
    const navigate = useNavigate();
    const { user:userTemp, getUserDetails, isPremierPlan } = useAuth();
    const { wallet, getUserWallet } = useApp();
    const [rewards, setRewards] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedRewards, setSelectedRewards] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const { ToastComponent, showToast } = useToast();
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
    const [isOrderSuccess, setIsOrderSuccess] = useState(false);
    const [showPlaceOrderDialog, setShowPlaceOrderDialog] = useState(false);
    const [isEditAddress, setIsEditAddress] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openReferralModal, setOpenReferralModal] = useState(false);
    const [openAccessRevokeModal, setOpenAccessRevokeModal] = useState(false);
    const [searchParams, _] = useSearchParams();
    const isDemo = searchParams.get("d") === "S";
    let user;
    if(isDemo){
      const userId = localStorage.getItem("userId");
      const firstName = localStorage.getItem("firstName");
      const additionData = getDemoFlowData();
      user = {
          firstName,
          id: userId,
          ...additionData,
      };
    }
    else {
      user = userTemp;
    }
    const {
      control,
      handleSubmit,
      formState: { errors },
      getValues,
      reset,
    } = useForm({});

    const { isSubscriptionActive, address } = user;
    const { rewardPoints, monthlyEarnings } = wallet ?? {};

    useEffect(() => {
        setLoading(true);
        getUserDetails();
        if(!isDemo){
        getUserWallet();
        }
        const fetchCategories = async () => {
            const data = await getCategories();
            const sortedData = data.sort((a, b) => a.order - b.order);
            setCategories(sortedData);
            setSelectedCategory(data[0].id);
            // setLoading(false);
        }
        fetchCategories();
        // const checkPaymentStatus = localStorage.getItem("paymentSuccess");
        // localStorage.removeItem("paymentSuccess");
        // if (checkPaymentStatus && checkPaymentStatus === "1") {
        //     setIsPaymentSuccess(true);
        // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const checkAccess = async () => {
        const showModal = await isWalletHistoryCreditMoreThanZero(user?.id);
        if (showModal || isPremierPlan) {
          setOpenAccessRevokeModal(false);
        } else {
          setOpenAccessRevokeModal(true);
        }
      };
      checkAccess();
    }, [user, rewardPoints, isPremierPlan]);

    useEffect(() => {
        setLoading(true);
        const fetchRewards = async () => {
            const data = await getRewardsByCategory(selectedCategory);
            setRewards(data);
            setLoading(false);
        }
        if (selectedCategory !== null) {
          fetchRewards();
          setSelectedRewards(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    useEffect(() => {
      setSelectedRewards(null);
    }, [rewards]);


    const handlePlaceOrder = async () => {
      if (!selectedRewards) return;
      const { pointsRequired, id } = selectedRewards;
      const discountedCoins = getCoinsAfterDiscount(pointsRequired);
        if (discountedCoins > rewardPoints) {
          showToast(`You don't have sufficient reward points`);
          return;
        }
        if (!showPlaceOrderDialog) {
          setShowPlaceOrderDialog(true);
          setIsEditAddress(false);
          reset();
          return;
        }
        let addressValues = null;
        if (isEditAddress || !address) {
          addressValues = getValues();
        }
        setIsSubmitting(true);
        MEASURE(
          INSTRUMENTATION_TYPES.REWARD_PROCEED,
          user.id,
          { cartItem: selectedRewards }
        );
        const data = await claimReward([id], addressValues);
        if (data) {
            setShowPlaceOrderDialog(false);
            setIsOrderSuccess(true);
        } else {
            showToast("Something went wrong");
        }
        setIsSubmitting(false);
    };

    const handleSelectReward = (e, reward) => {
      setSelectedRewards(reward);
    };

    const categoryOptions = useMemo(() => {
      return categories.map((category) => {
        return {
          label: category.name,
          value: category.id,
        };
      });
    }, [categories]);

    const handlePinCodeChange = (value, fieldOnChange) => {
      const onlyNumbers = value.replace(/[^0-9]/g, "");
      if (onlyNumbers.length <= 6) {
        // setValue("pincode", onlyNumbers);
        fieldOnChange(onlyNumbers);
        // if (onlyNumbers.length === 6) {
        //   clearErrors("pincode");
        // }
      }
    };

    const handleEditPencilClick = () => {
      reset({
        ...(address ? address : {})
      });
      setIsEditAddress(true);
    };

    const handleSubscribeNow = () => {
      MEASURE(
        INSTRUMENTATION_TYPES.SUBSCRIBE_NOW,
        user.id,
        {}
      );
      navigate("/subscribe");
    };

    const renderRewardItem = (reward) => {
      const { description, imageUrl, name, pointsRequired, id } = reward;
      const discountedCoins = getCoinsAfterDiscount(pointsRequired);
      return (
        <AppRadio
          key={id}
          className="mt-6 mr-2 cursor-pointer"
          id={id}
          name="reward"
          value=""
          onChange={(e) => handleSelectReward(e, reward)}
          // disabled={}
          label={
            <div className="bg-[#4a4a4aB3] h-[184px] w-80 rounded-lg backdrop-blur-[2px] text-white p-4 cursor-pointer">
              <div className="grid grid-cols-5">
                <div className="text-2xl col-span-5 mb-4">{name}</div>
                <div className="col-span-3 text-sm">{description}</div>
                <div className="row-start-2 row-span-3 col-span-2 col-start-4">
                  <div className="h-[110px] w-full rounded-lg bg-white overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div className="row-start-4 col-span-3">
                  <div className="w-fit px-2 h-6 border border-solid border-primary-yellow bg-[rgba(0,0,0,0.2)] text-primary-yellow flex justify-center items-center rounded-[115px] gap-2">
                    <DollarSvg />
                    <span className="mt-1">
                      {discountedCoins ? (
                        <>
                          <span>{pointsRequired}</span>&nbsp;
                          
                        </>
                      ) : (
                        <>{pointsRequired}</>
                      )}{" "}
                      Coins
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      );
    };

    const renderWalletInfoCards = () => {
      const currentMonthFirstThreeLetters = new Date().toLocaleString(
        "default",
        {
          month: "short",
        }
      );
      const earnings = extractMonthlyEarnings(monthlyEarnings);

      return (
        <div className="flex w-full justify-center gap-4 items-center">
          {/* <div className="bg-primary-gradient-reverse p-3 rounded-lg flex flex-col w-full border border-solid border-primary-yellow max-w-xs">
            <div className="space-y-2">
              <div className="uppercase text-primary-yellow text-xs text-center">
                {currentMonthFirstThreeLetters} Winnings
              </div>
              <div className="flex justify-center items-center text-xl">
                <img
                  src="/Assets/Icons/trophy.svg"
                  alt="trophy"
                  className="mr-2 h-7"
                />
                {earnings}
              </div>
              {isSubscriptionActive ? (
                <div className="text-xs text-center">Transferred to Vault</div>
              ) : (
                <div className="text-xs text-center">Expiring soon!</div>
              )}
            </div>
          </div> */}
          <div className="bg-primary-gradient-reverse p-3 md:p-9 rounded-lg flex flex-col w-full border border-solid border-primary-yellow max-w-xs">
            <div className="space-y-2 md:space-y-5">
              <div className="uppercase text-primary-yellow text-xs text-center md:text-2xl">
                Vault Balance
              </div>
              <div className="flex justify-center items-center text-xl md:text-2xl">
                <img
                  src="/Assets/Icons/vault.svg"
                  alt="trophy"
                  className="mr-2 h-7 md:h-10"
                />
                {rewardPoints}
              </div>
              <div className="text-xs text-center md:text-xl">Use for rewards</div>
            </div>
          </div>
        </div>
      );
    };

    const renderSubscriptionStatus = () => {
      return (
        <div className="my-7 flex justify-between max-w-sm w-full self-center items-center">
          {isSubscriptionActive ? (
            <div className="italic">
              <span className="text-primary-yellow">Subscripton: </span>
              <span>{isSubscriptionActive ? "Active" : "Inactive"}</span>
            </div>
          ) : (
            <></>
          )}
          {/* {!isSubscriptionActive && (
            <div className="relative">
              <span className="text-xs block text-center absolute top-[-20px]">
                Save winnings in Vault
              </span>
              <AppButton
                className="h-[37px] min-h-[37px] w-[160px] min-w-[160px] !text-sm"
                onClick={handleSubscribeNow}
              >
                Store my coins
              </AppButton>
            </div>
          )} */}
          {/* <div>
            <AppButton
              type="button"
              className="self-center z-10 bg-[#0D0D0D33] text-primary-yellow border border-solid border-primary-yellow h-[37px] min-h-[37px]"
              onClick={() => setOpenReferralModal(true)}
            >
              Invite Friends
            </AppButton>
          </div> */}
        </div>
      );
    };

    const renderCategories = () => {
      return (
        <AppSelect
          options={categoryOptions}
          wrapperClassName="max-w-sm self-center"
          placeholder="Select Category"
          showLabel
          label="Categories"
          id="category"
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value);
          }}
        />
      );
    }

    const renderOrderSuccessDialog = () => {
      return (
        <Dialog open={isOrderSuccess} className="register-success">
          <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
            <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
            <span className="text-lg md:text-xl font-medium text-center">
              Order Placed!
            </span>
            <span className="text-sm text-center">
              Congratulations on a very well deserved award. Keep learning and
              keep winning!
            </span>
            <AppButton
              type="button"
              className="self-center z-10"
              onClick={() => {
                window.location.href = "/wallet";
              }}
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

    const renderSuccessDialog = () => {
      return (
        <Dialog open={isPaymentSuccess} className="register-success">
          <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-12 py-10 gap-6">
            <img src="/Assets/Icons/tickmark.svg" alt="tickmark" />
            <span className="text-lg md:text-xl font-medium text-center">
              Thank you for subscribing!
            </span>
            <span className="text-sm text-center">
              Welcome to our premier club, you can now access all our premium
              features!
            </span>
            <AppButton
              type="button"
              className="self-center z-10"
              onClick={() => {
                window.location.href = "/wallet";
              }}
            >
              Check Rewards
            </AppButton>
            <AppButton
              type="button"
              className="self-center z-10"
              onClick={() => setOpenReferralModal(true)}
              variant="secondary"
            >
              Invite Friends
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

    const renderAddressForm = () => {
      return (
        <form
          onSubmit={handleSubmit(handlePlaceOrder)}
          // className="w-full gap-2 h-full grid place-items-center"
        >
          <div className="flex flex-col justify-around h-full w-full max-w-lg gap-3">
            <div>
              <Controller
                name="addressLine1"
                control={control}
                rules={{
                  required: "Address Line 1 is required",
                  maxLength: {
                    value: 50,
                    message: "Maximum 50 characters allowed",
                  },
                }}
                render={(renderProps) => {
                  const { field } = renderProps;
                  return (
                    <AppInput
                      {...field}
                      wrapperClassName="items-start"
                      className="text-center !text-base"
                      id={field.addressLine1}
                      showLabel
                      label="House Number, Apartment/Colony Name"
                      maxLength={50}
                      error={
                        errors &&
                        errors.addressLine1 &&
                        errors.addressLine1.message
                      }
                    />
                  );
                }}
              />
            </div>
            <div>
              <Controller
                name="addressLine2"
                control={control}
                render={(renderProps) => {
                  const { field } = renderProps;
                  return (
                    <AppInput
                      {...field}
                      wrapperClassName="items-start"
                      className="text-center !text-base"
                      id={field.addressLine2}
                      showLabel
                      label="Address line 2 (Optional)"
                      maxLength={50}
                    />
                  );
                }}
              />
            </div>
            <div>
              <Controller
                name="locality"
                control={control}
                rules={{
                  required: "Locality is required",
                  maxLength: {
                    value: 50,
                    message: "Maximum 50 characters allowed",
                  },
                }}
                render={(renderProps) => {
                  const { field } = renderProps;
                  return (
                    <AppInput
                      {...field}
                      wrapperClassName="items-start"
                      className="text-center !text-base"
                      id={field.locality}
                      showLabel
                      label="Locality"
                      maxLength={50}
                      error={
                        errors && errors.locality && errors.locality.message
                      }
                    />
                  );
                }}
              />
            </div>
            <div>
              <Controller
                name="city"
                control={control}
                rules={{
                  required: "City is required",
                  maxLength: {
                    value: 50,
                    message: "Maximum 50 characters allowed",
                  },
                }}
                render={(renderProps) => {
                  const { field } = renderProps;
                  return (
                    <AppInput
                      {...field}
                      wrapperClassName="items-start"
                      className="text-center !text-base"
                      id={field.city}
                      showLabel
                      label="City"
                      maxLength={50}
                      error={errors && errors.city && errors.city.message}
                    />
                  );
                }}
              />
            </div>
            <div>
              <Controller
                name="pincode"
                control={control}
                rules={{
                  required: "Pincode is required",
                  minLength: {
                    value: 6,
                    message: "Please enter 6 digit pincode",
                  },
                }}
                render={(renderProps) => {
                  const { field } = renderProps;
                  return (
                    <AppInput
                      {...field}
                      wrapperClassName="items-start"
                      className="text-center !text-base"
                      id={field.pincode}
                      showLabel
                      label="Pincode"
                      maxLength={50}
                      error={errors && errors.pincode && errors.pincode.message}
                      onChange={(value) => {
                        handlePinCodeChange(value, field.onChange);
                        // field.onChange(value);
                      }}
                    />
                  );
                }}
              />
            </div>
            <AppButton
              type="submit"
              className="self-center z-10 mt-2"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Place Order
            </AppButton>
          </div>
        </form>
      );
    };

    const renderDeliveryAddress = () => {
      const { addressLine1, addressLine2, city, locality, pincode } = address || {};
      const isAddressPresent = addressLine1 && city && locality && pincode;
      const addressArray = [addressLine1, addressLine2, locality, city, pincode];
      if (!addressLine2) {
        addressArray.splice(1, 1);
      }
      const addressString = addressArray.join(",\n");
      return (
        <div>
          <span className="text-primary-yellow mr-2">Delivery Address</span>
          {isAddressPresent && <EditPencilSvg onClick={handleEditPencilClick} />}
          <div className="mt-2">
            {!isAddressPresent || isEditAddress ? renderAddressForm() : <span className="whitespace-pre-wrap">{addressString}</span>}
          </div>
        </div>
      );
    };

    const renderPlaceOrderDialog = () => {
      const { name, pointsRequired } = selectedRewards || {};
      const discountedCoins = getCoinsAfterDiscount(pointsRequired);
      const { addressLine1, city, locality, pincode } = address || {};
      const isAddressPresent = addressLine1 && city && locality && pincode;
      return (
        <Dialog
          open={showPlaceOrderDialog}
          onClose={() => setShowPlaceOrderDialog(false)}
          className="address-popup"
        >
          <div className="relative flex flex-col bg-primary-gradient text-white h-full px-6 py-10 gap-6 overflow-auto">
            <div className="flex justify-center mb-2">
              <span className="text-2xl text-primary-yellow">
                Order Summary
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-primary-yellow">Item Name:</span>&nbsp;
                {name}
              </div>
              <div>
                <span className="text-primary-yellow">Coins Used:</span>&nbsp;
                {discountedCoins ?? 0}
              </div>
              <div>
                <span className="text-primary-yellow">Vault Balance:</span>
                &nbsp;
                {rewardPoints}
              </div>
              {renderDeliveryAddress()}
            </div>
            {!isAddressPresent || isEditAddress ? (
              <></>
            ) : (
              <AppButton
                type="button"
                className="self-center z-10"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Place Order
              </AppButton>
            )}
          </div>
        </Dialog>
      );
    };

    const getBottomBarText = () => {
      if (loading) {
        return "0 Coins";
      }
      if (selectedRewards) {
        const discountedCoins = getCoinsAfterDiscount(selectedRewards?.pointsRequired);
        return `1 Item | ${discountedCoins ?? 0} Coins`;
      }
      return `0 Coins`;
    };

    const goToTournaments = () => {
      let url = TOURNAMENT_SELECT_ROUTE
      if(isDemo){
        url += `?d=S`
      }
      navigate(url);
    };

    const goBack = () => {
      // if history is empty, go back to lobby
      const history = window.history;
      if (history.length === 1 || history.state === null) {
        navigate("/lobby");
        return;
      }
      navigate(-1);
    };

    const renderRewardAccessRevokeModal = () => {
      return (
        <DarkModal isOpen={openAccessRevokeModal}>
          <div className="flex justify-center items-center flex-col gap-4 px-4 text-center">
          <div style={{ width: '50%' }}> {/* Adjust width as needed */}
            <AccessRevokeLockSvg style={{ width: '100%', height: 'auto'}} /> {/* Set width to 100% */}
          </div>
            <div className="text-xl text-white">
              Unlock with a Premier Membership
            </div>
            <div className="space-y-4">
              <AppButton className="w-full" onClick={goToTournaments}>
                Check Tournaments
              </AppButton>
              <AppButton className="w-full" onClick={goBack} variant="secondary">
                Go Back
              </AppButton>
            </div>
          </div>
        </DarkModal>
      );
    };

    return (
      <Layout
        showHeader={false}
        showBack
        onBackClick={() => {
          navigate("/lobby");
        }}
        showArenaHeader={true}
        headerText="Reward Store"
      >
        <div className="h-full w-full py-8 px-3 text-white overflow-auto flex flex-col">
          {renderWalletInfoCards()}
          {renderSubscriptionStatus()}
          {renderCategories()}
          <div className="mb-36 mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            {loading ? (
              <div className="flex justify-center">
                <Loader />
              </div>
            ) : (
              rewards?.map((reward) => renderRewardItem(reward))
            )}
          </div>
          <BottomButtonBar
            text={getBottomBarText()}
            buttonProps={{
              onClick: handlePlaceOrder,
              text: "Place Order",
            }}
          />
        </div>
        <ToastComponent />
        {isPaymentSuccess ? renderSuccessDialog() : <></>}
        {showPlaceOrderDialog ? renderPlaceOrderDialog() : <></>}
        {isOrderSuccess ? renderOrderSuccessDialog() : <></>}
        <ReferralModal
          open={openReferralModal}
          handleClose={() => setOpenReferralModal(false)}
        />
        {renderRewardAccessRevokeModal()}
      </Layout>
    );
};

export default WalletPage;