import { Button } from "@mui/material";
import React, { useEffect } from "react";
import mixpanel from 'mixpanel-browser';
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../firebase-config";

const ErrorScreen = (props) => {
  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleBack = async () => {
    //logout the user

    await signOut(firebaseAuth);
    localStorage.clear();
    let redirectUrl = "/login";
    window.location.href = redirectUrl;
  };


  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h3 style={{ margin: "40px" }}>
        ⛔️ Sorry, something went wrong. Please try again or reach out to us.
      </h3>
      <div>
        <Button
          variant="contained"
          onClick={handleBack}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default ErrorScreen;
