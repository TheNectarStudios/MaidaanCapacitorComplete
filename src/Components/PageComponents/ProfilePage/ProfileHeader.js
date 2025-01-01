import React from "react";
import AnimatedNumber from "react-awesome-animated-number";
import BackButton from "../../../Components/Common/BackButton";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

const ProfileHeader = ({ goBackUrl, headerText, showEmoji = false, setShowEmoji, editFormData = {}, setEditFormData, setExitPopup, mobileOpen = false, setMobileOpen, pageMode }) => {

    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const goBack = () => {
        if (pageMode === "findfriends") {
            navigate("/lobby");
        }
        else {

            if (showEmoji && setShowEmoji) {
                setShowEmoji(false);
            }
            else if (Object.keys(editFormData).length !== 0) {
                setExitPopup(true);
            } else {
                if (goBackUrl) {
  
                    navigate(goBackUrl);
                }
                else {
                    //setEditFormData(null);
                    //window.location.href= goBackUrl;
                    
                    navigate(-1);
                }
            }
        }
    }

    return (
        <div className="text-white text-center font-bold text-2xl bg-[#3a3a3a] !py-4 max-xs:py-2 relative max-xs:text-xl flex pr-5 pl-[50px] items-center justify-between z-99999 ">
            <div className="h-full flex items-center justify-center">
                <div>
                    <BackButton onClick={mobileOpen ? () => setMobileOpen(false) : goBack} svgIcon="Back.svg" />
                </div>
                <div className={`text-center text-lg`}>{headerText}</div>
            </div>
            {!setMobileOpen && <div className="flex justify-center items-center" onClick={() => navigate('/lobby')}>
                <div className="flex items-center">
                    <img
                        src='/Assets/Icons/lobby.svg'
                        alt="icon"
                        style={{ height: '20px' }}

                    />
                </div>
                 {/*<div className="text-base ml-2">Home</div>*/}
            </div>}


        </div>
    );
}


export default ProfileHeader;