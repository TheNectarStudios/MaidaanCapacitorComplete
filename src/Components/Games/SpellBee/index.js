import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import LandingScreen from "./landingPage";
import Game from "./Game";
import NewFormatGame from "./newRoundGame";
import SimpleDialog from "./GameComponents/PopUpScreen";
import SnackBar from "./GameComponents/SnackBar";
import "./Responsive.css";
import mixpanel from 'mixpanel-browser';

const GameWithPopUp = (props) => {
  const [open, setOpen] = useState(false);
  const [memoryCardsFormat, setMemoryCardsFormat] = useState(false);
  const [backUrl, setBackUrl] = useState("");
  const [snackBarData, updateSnackBarData] = useState({
    open: false,
    message: "",
    type: "",
    duration: 1500,
  });
  const [message, updateMessage] = useState({
    message: "",
    title: "",
    list: [],
    type: "",
    cta: () => {},
    closeBtn: true,
    closeAction: null,
  });
  const popupOpen = (value) => {
    setOpen(value);
  };

  const popupOpenForNewFormat = (value) => {
    setOpen(value);
    setMemoryCardsFormat(value);
  };

  const popupBackUrl = (value) => {
    setBackUrl(value);
  }

  const cb = () => {
    setOpen(false);
  };
  const updateSnackbar = (data) => {
    updateSnackBarData(data);
  };

  return (
    <div className="h-full w-full max-w-3xl relative bg-white">
      {/* <img
        src="/Assets/Images/pattern-light-desktop.svg"
        alt="vector-pattern"
        className="absolute -z-[1] h-full hidden md:block"
      />  */}
      <Routes>
        <Route
          path="/tournament/*"
          element={
            <Game
              updateMessage={updateMessage}
              popupOpen={popupOpen}
              setSnackBar={updateSnackbar}
              popupBackUrl={popupBackUrl}
            />
          }
        />
        <Route
          path="/newFormatGame/*"
          element={
            <NewFormatGame
              updateMessage={updateMessage}
              popupOpen={popupOpenForNewFormat}
              setSnackBar={updateSnackbar}
              popupBackUrl={popupBackUrl}
            />
          }
        />
        <Route exacat path="/" element={<LandingScreen />} />
      </Routes>
      {snackBarData.open && (
        <SnackBar open={snackBarData} updateOpen={updateSnackBarData} />
      )}
      <SimpleDialog message={message} open={open} cb={cb} memoryCardsFormat={memoryCardsFormat} backUrl={backUrl}/>
    </div>
  );
};

export default GameWithPopUp;
