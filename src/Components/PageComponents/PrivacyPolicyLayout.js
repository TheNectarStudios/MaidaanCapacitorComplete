import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import PropTypes from "prop-types";
import { PRIMARY_COLOR, SECONDARY_COLOR } from "../../Constants/Commons";

const primaryColor = "#CBF600";
const drawerWidth = 240;
const navItems = ["Home", "Contact Us"];
const navLinks = ["/", "#footer"];

function ElevationScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: window ? window() : undefined,
  });

  return React.cloneElement(children, {
    style: {
      backgroundColor: trigger ? "rgba(24,24,24, 0.8)" : "transparent",
      transition: trigger ? "0.3s" : "0.5s",
    },
  });
}

ElevationScroll.propTypes = {
  children: PropTypes.element.isRequired,
  window: PropTypes.func,
};

const ColoredSpan = (props) => {
  return <span style={{ color: PRIMARY_COLOR }}>{props.children}</span>;
};

const PrivacyPolicyLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Maidaan
      </Typography>
      <Divider />
      <List>
        {navItems.map((item, idx) => (
          <a href={navLinks[idx]}>
            <ListItem key={item} disablePadding>
              <ListItemButton sx={{ textAlign: "center" }}>
                <ListItemText primary={item} />
              </ListItemButton>
            </ListItem>
          </a>
        ))}
      </List>
    </Box>
  );

  const container = window.document.body;

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        color: "black",
        paddingTop: "20px",
        paddingBottom: "20px",
        letterSpacing: 1,
        lineHeight: 1.3,
        textAlign: "left",
      }}
    >
      <Box
        sx={{
          // marginTop: { xs: "16vh", md: "24vh" },
          paddingLeft: { xs: "0px", sm: "13vw" },
          paddingRight: { xs: "20px", sm: "15vw" },
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <img
          src="./Assets/Images/logo-horizontal-black.svg"
          alt="logo"
          className="privacy-policy-logo"
        />
        <a
          href="/"
          style={{
            color: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="privacy-policy-back-btn">Back to Home</div>
        </a>
      </Box>
      <Box
        sx={{
          // marginTop: { xs: "16vh", md: "24vh" },
          paddingLeft: { xs: "20px", sm: "15vw" },
          paddingRight: { xs: "20px", sm: "15vw" },
          textAlign: "left",
        }}
      >
        {children}
      </Box>
      <Box
        sx={{
          width: "100%",
          minHeight: "30vh",
          flexGrow: 1,
          backgroundColor: SECONDARY_COLOR,
          marginTop: "40px",
        }}
        id="footer"
      >
        <Grid container spacing={2} sx={{ borderBottom: "2px solid #ccf900" }}>
          <Grid item md={4} xs={12} sx={{ marginTop: "20px" }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  fontSize: "16px",
                  color: "white",
                  fontWeight: 100,
                  letterSpacing: "1px",
                  lineHeight: "22px",
                  textAlign: "center",
                }}
              >
                <span style={{ color: PRIMARY_COLOR }}>Address:</span>
                <br />
                <br />
                Level-Field Tech Pvt Ltd
                <br /> WeWork Galaxy,
                <br /> 43, Residency Road,
                <br /> Opp Gateway Hotel,
                <br /> Bangalore 560025
              </Box>
            </Box>
          </Grid>
          <Grid
            item
            md={4}
            xs={12}
            sx={{ marginBottom: "40px", marginTop: "20px" }}
          >
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  fontSize: "16px",
                  color: "white",
                  fontWeight: 100,
                  letterSpacing: "1px",
                  lineHeight: "36px",
                  textDecoration: "underline",
                  textAlign: "center",
                }}
              >
                <span style={{ color: PRIMARY_COLOR }}>
                  <a
                    href="http://maps.google.com/?q=Level-Field Tech Pvt Ltd WeWork Galaxy"
                    style={{ color: PRIMARY_COLOR }}
                    target="_blank"
                  >
                    Locate Us On Google
                  </a>
                  <br />
                  <a
                    href="mailto:contact@maidaan.app"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    contact@maidaan.app
                  </a>
                  <br />
                  <a href="tel:+918618006284" style={{ color: PRIMARY_COLOR }}>
                    +91 86 1800 6284
                  </a>
                </span>
              </Box>
            </Box>
          </Grid>
          <Grid item md={4} xs={12}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  fontSize: "16px",
                  color: "white",
                  fontWeight: 100,
                  marginTop: "20px",
                  letterSpacing: "1px",
                  lineHeight: "36px",
                  textAlign: "center",
                }}
              >
                <span>
                  <a href="/about-us" style={{ color: PRIMARY_COLOR }}>
                    About Us
                  </a>
                  <br />
                  <a
                    href="mailto:contact@maidaan.app"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Contact Us
                  </a>
                  <br />
                  <a href="/privacy-policy" style={{ color: primaryColor }}>
                    Privacy Policy
                  </a>
                  <br />
                  <a
                    href="/terms-and-conditions"
                    style={{ color: primaryColor }}
                  >
                    Terms & Conditions
                  </a>
                  <br />
                  <a href="/refund-policy" style={{ color: primaryColor }}>
                    Refund Policy
                  </a>
                </span>
              </Box>
            </Box>
          </Grid>
          <Grid
            item
            md={12}
            xs={0}
            sx={{ marginBottom: "30px", marginTop: "20px" }}
          ></Grid>
          <Grid item xs={12} sx={{ marginBottom: "10px", marginTop: "10px" }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  textAlign: "center",
                }}
              >
                <span style={{ color: PRIMARY_COLOR, fontSize: "12px" }}>
                  Copyright 2024 Maidan. All Rights Reserved.
                </span>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PrivacyPolicyLayout;
