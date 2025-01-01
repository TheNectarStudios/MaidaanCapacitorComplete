import React, { useState, useEffect, useCallback } from "react";
import "./Style.css";
import { Button, Typography, Modal } from "@mui/material";
import { Link } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import {
  PRIMARY_COLOR,
  TEST_INITIALS,
  TOURNAMENT_ID,
  VALID_USERS_LIST,
} from "../../../Constants/Commons";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import MuiAlert from "@mui/material/Alert";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as FB from "../../Firebase/FirebaseFunctions";
import CircularProgress from "@mui/material/CircularProgress";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import { MEASURE } from "../../../instrumentation";

const ColorButton = styled(Button)(({ theme }) => ({
  color: "black",
  borderRadius: "30px",
  width: "200px",
  backgroundColor: PRIMARY_COLOR,
  fontSize: "calc(0.5vw + 14px) !important",
  "&:hover": {
    backgroundColor: PRIMARY_COLOR,
  },
  fontFamily: "avenir",
}));

const ColorButtonSmall = styled(Button)(({ theme }) => ({
  color: "black",
  borderRadius: "30px",
  width: "100px",
  height: "30px",
  backgroundColor: PRIMARY_COLOR,
  fontSize: "calc(0.5vw + 12px) !important",
  "&:hover": {
    backgroundColor: PRIMARY_COLOR,
  },
  fontFamily: "avenir",
}));

const LandingScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDemoGame = searchParams.get("d") === "Y";

  const [userId, setUserId] = useState("");
  const [open, setOpen] = React.useState(false);
  const [showLoader, setShowLoader] = React.useState(false);

  const navigate = useNavigate();

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    navigate("/lobby", { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserIdChange = (e) => {
    const id = e.target.value.toLocaleLowerCase().trim();
    setUserId(id);
    localStorage.setItem("userId", id);
  };

  const checkValidLogin = async () => {
    if (!userId.length) return;
    MEASURE(
      isDemoGame
        ? INSTRUMENTATION_TYPES.DEMO_LOGIN
        : INSTRUMENTATION_TYPES.LOGIN,
      userId,
      {}
    );
    setShowLoader(true);
    if (isDemoGame && userId.length) {
      window.location.href = "/lobby?d=Y";
    } else {
      const userData = await FB.getData("children", userId.toLowerCase());
      if (userData && userData.firstName) {
        navigate("/lobby", { replace: true });
      } else {
        handleClick();
      }
    }

    setShowLoader(false);
  };

  const handleRedirection = () => {
    window.location.href =
      "https://docs.google.com/forms/d/e/1FAIpQLScQ6-Aiul6wiVL8uGFfgEtQnCGUxSO4W1xuc1a8PNrZYN2j4Q/viewform";
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          flexGrow: 1,
          backgroundImage: "url('/Assets/Images/loginscreenbg.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          zIndex: "0",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            fontSize: "20px",
            top: "20px",
            width: "100vw",
            textAlign: "center",
            color: "white",
            fontStyle: "italic",
          }}
        >
          DISCOVER - MEET - COMPETE
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: "10%",
            width: "100vw",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              margin: "30px",
              width: "80%",
            }}
          >
            <Box sx={{ color: PRIMARY_COLOR, fontSize: "20px" }}>
              Enter your {isDemoGame ? "name" : "user ID"}
            </Box>
            <input
              type="text"
              placeholder={
                isDemoGame ? "Your name" : "User ID shared on WhatsApp"
              }
              style={{
                outline: "none",
                border: 0,
                borderRadius: "20px",
                padding: "10px",
              }}
              onChange={handleUserIdChange}
              value={userId}
            />
          </Box>
          <ColorButton variant="contained" onClick={checkValidLogin}>
            {showLoader ? (
              <CircularProgress size={30} />
            ) : (
              `${isDemoGame ? "Let's Go" : "Login"}`
            )}
          </ColorButton>
        </Box>
      </Box>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "70%",
            bgcolor: "#3a3a3a",
            color: "white",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography
            id="modal-modal-title"
            variant="p"
            component="h4"
            sx={{ textAlign: "center" }}
          >
            This user ID is not registered
          </Typography>
          <Typography
            id="modal-modal-description"
            sx={{ mt: 2, fontSize: "14px", textAlign: "center" }}
          >
            First time here? Please register to receive your user ID, else try
            again
          </Typography>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "24px",
            }}
          >
            <ColorButtonSmall
              variant="contained"
              onClick={() => {
                handleClose();
              }}
            >
              Try Again
            </ColorButtonSmall>
            <ColorButtonSmall variant="contained" onClick={handleRedirection}>
              Register
            </ColorButtonSmall>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default LandingScreen;
