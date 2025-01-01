import React from "react";
import Button from "@mui/material/Button";
import { getAuth, signOut } from "firebase/auth";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import { Link } from "react-router-dom";
import Header from "./Header";
import * as FB from "../Firebase/FirebaseFunctions";
import { useNavigate } from "react-router-dom";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.h5,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  position: "relative",
}));

const DashBoard = () => {
  const uid = localStorage.getItem("authToken");
  const navigate = useNavigate();
  React.useEffect(() => {
    // Pass the ID token to the server.
    const id = JSON.parse(uid).uid;
    FB.getData("parents", id).then((data) => {
      if (!data && data === "") {
        navigate("/profile");
      }
      // ...
    });
  });

  const signOutUser = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        console.log("logged out successfully");
      })
      .catch((error) => {
        // An error happened.
        console.log("log out failed");
      });
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <Header />
        <div onClick={signOutUser}>signout</div>
        <Grid
          container
          spacing={2}
          sx={{ display: "flex", justifyContent: "center", my: "20px" }}
        >
          <Grid item xs={11} md={4}>
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "space-between",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  height: "30vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Spell Bee
              </div>
              <div
                style={{
                  textAlign: "left",
                  margin: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h5 style={{ margin: 0 }}>Spell Bee</h5>
                <div>
                  <Link to="/quiz/">
                    <Button variant="contained">Play</Button>
                  </Link>
                </div>
              </div>
            </Item>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default DashBoard;
