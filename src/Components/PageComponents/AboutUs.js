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

const AboutUs = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
		<Box
			onClick={handleDrawerToggle}
			sx={{ textAlign: "center", backgroundColor: "#232323" }}>
			<Typography variant="h4" sx={{ my: 3, color: "#ccf900" }}>
				<i>maidaan</i>
			</Typography>
			<Divider />
			<List>
				{navItems.map((item, idx) => (
					<a href={navLinks[idx]} key={idx}>
						<ListItem key={item} disablePadding>
							<ListItemButton sx={{ textAlign: "center", color: "#ccf900" }}>
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
        backgroundImage:
          "linear-gradient(to right, rgb(58,58,58), rgb(24,24,24))",
        color: "white",
        paddingTop: "20px",
        paddingBottom: "20px",
        letterSpacing: 1,
        lineHeight: 1.3,
        textAlign: "left",
      }}
    >
      <Box
        sx={{
          width: "12%",
          height: "12vw",
          minHeight: "120px",
          minWidth: "120px",
          backgroundImage: "url('./Assets/Images/logos-01.svg')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          position: "absolute",
          top: "0",
          left: "3vw",
          zIndex: "1",
        }}
      />
      <Box sx={{ display: "flex" }} id="home">
        <ElevationScroll>
          <AppBar component="nav" color="transparent" sx={{ boxShadow: "0 0" }}>
            <Toolbar>
              <Typography
                variant="h6"
                component="div"
                sx={{ flexGrow: 1, display: { sm: "block" } }}
              ></Typography>
              <IconButton
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: "none" }, color: primaryColor }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                {navItems.map((item, idx) => (
                  <Button
                    variant="text"
                    size="small"
                    key={item}
                    sx={{
                      color: primaryColor,
                      fontWeight: 100,
                      margin: 4,
                      fontSize: "18px !important",
                    }}
                    href={navLinks[idx]}
                  >
                    {item}
                  </Button>
                ))}
              </Box>
            </Toolbar>
          </AppBar>
        </ElevationScroll>
        <Box component="nav">
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                backgroundColor: "#232323"
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>
      </Box>
      <Box
        sx={{
          marginTop: { xs: "16vh", md: "24vh" },
          paddingLeft: { xs: "20px", sm: "15vw" },
          paddingRight: { xs: "20px", sm: "15vw" },
        }}
      >
        <h1 style={{ textAlign: "left" }}>ABOUT US</h1>
        <p>
          <ColoredSpan>We Believe:</ColoredSpan> Inside every child, lives a dreamer. Someone who lives a 
          full 70mm life inside their head and doesn't believe in aspiring for anything less. Every 
          dreamer needs a stage. A stage, where they discover themselves, pursue obsessions, fearlessly 
          put themselves out there, get knocked down and yet always get back up. This stage helps them start 
          arming themselves for this battle called life. Without a stage, there is no dream.
          <br /> <br />
          And, <ColoredSpan>maidaan</ColoredSpan> is that{" "}
          <ColoredSpan>first</ColoredSpan> stage, being built for all.
          <br />
        </p>
        <br />
        <h2 style={{ color: PRIMARY_COLOR }}>Vision</h2>
        <p>A world where access to opportunity is equal and <span style={{ color: PRIMARY_COLOR, fontSize: 22}}>NO CHILD is LEFT BEHIND</span></p>
        <br />
        <h2 style={{ color: PRIMARY_COLOR }}> Mission</h2>
        <p>
         To empower every parent to get their children life-ready by helping build a competitive mindset from an early age
        </p>
        <br />
        <h2 style={{ color: PRIMARY_COLOR }}> Our Story</h2>
        <p>
        Classroom knowledge & a Competitive Mindset, while both critical for survival, 
        are very different skills. Millions of students learn this the hard way every year. 
        For most, the first exposure to competition beyond the four walls of one’s school 
        happens only after class 12 and that too directly at a national level. Being unprepared
        for this results in an unpleasant jolt and leads to many developing self-doubt and 
        nursing a lifelong fear of competition which is detrimental to progress as life 
        thereafter is competitive. Parents across are aware of this but have no easily 
        accessible way to remove this fear & regularise competition beyond school from an early age.{" "}
        <br />
        <br /> <b>
        Through Maidaan, we’re trying to change this. Competition, if normalised, is an extremely 
        powerful learning tool and an absolute necessity for survival & growth in life. We also strongly 
        believe that this doesn’t need to be all serious & glum and can be done in a super-fun manner!
        </b>
        </p>
        <br />
        <br />
        <Grid container spacing={2}>
          <Grid item md={3} xs={12}>
            <Box
              sx={{
                width: "100%",
                height: "300px",
                backgroundImage:
                  "url('https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FJB%20Image.png?alt=media&token=42933e69-342c-4f55-841c-507d5740512a')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                cursor: "pointer",
              }}
            ></Box>
          </Grid>
          <Grid item md={9} xs={12}>
            <h2 style={{ color: PRIMARY_COLOR }}> Judhajit Bal</h2>
            <p>
              An MBA from MDI Gurgaon and electronics engineer from Army
              Institute of Technology, has worked with global brands like
              Coca-Cola & Whirlpool. Prior to building Maidaan, was running
              another startup in the flexible workspaces sector called myHQ
              which was acquired by ANAROCK in Apr, 22. An avid reader, champion
              debater and a novice storyteller.
            </p>
          </Grid>
          <Grid item md={3} xs={12}>
            <Box
              sx={{
                width: "100%",
                height: "300px",
                backgroundImage:
                  "url('https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FSA%20Image.png?alt=media&token=d758fc81-c1cc-4fed-be76-45b697c631f2')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                cursor: "pointer",
              }}
            ></Box>
          </Grid>
          <Grid item md={9} xs={12}>
            <h2 style={{ color: PRIMARY_COLOR }}>Shashank Awasthi</h2>
            <p>
              An MBA from ISB and electronics engineer from Army Institute of
              Technology, has worked with global brands like HSBC & Publicis.
              Ace student (was part of the Dean’s list at ISB), champion
              debater, squash player and a novice chef.
            </p>
          </Grid>
        </Grid>
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
                  Copyright 2024 Maidaan. All Rights Reserved.
                </span>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AboutUs;
