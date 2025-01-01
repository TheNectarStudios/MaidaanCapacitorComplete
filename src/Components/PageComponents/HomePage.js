import React, { useEffect } from "react";
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
import { styled } from "@mui/material/styles";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import { REGISTER_URL, SECONDARY_COLOR } from "../../Constants/Commons";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { ProductBenefits } from "./ProductBenefits";
import Ticker from "./Ticker";
import { SchoolPopupForm } from "./SchoolPopupForm";
import Testimonials from "./Testimonials";
import TickerComponent from "./Ticker";

const primaryColor = "#CBF600";
const drawerWidth = 240;
const navItems = ["Home", "About Us", "Watch Demo", "Contact Us"];
const navLinks = ["#home", "/about-Us", "#watch-demo", "#footer"];

const ColorButton = styled(Button)(({ theme }) => ({
	color: "black",
	borderRadius: "30px",
	width: "200px",
	backgroundColor: primaryColor,
	fontSize: "calc(0.5vw + 10px) !important",
	"&:hover": {
		backgroundColor: primaryColor,
	},
	fontFamily: "avenir",
	marginRight: "22px",
}));

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

const OppColorButton = styled(Button)(({ theme }) => ({
	color: primaryColor,
	borderRadius: "30px",
	width: "200px",
	borderColor: primaryColor,
	backgroundColor: "rgba(0,1,1,0)",
	fontSize: "calc(0.5vw + 10px) !important",
	"&:hover": {
		backgroundColor: primaryColor,
		color: "black",
	},
	fontFamily: "avenir",
}));

const GreyOppColorButton = styled(Button)(({ theme }) => ({
	color: primaryColor,
	borderRadius: "30px",
	width: "200px",
	borderColor: primaryColor,
	backgroundColor: "rgba(58, 58, 58, 0.6)",
	fontSize: "calc(0.5vw + 10px) !important",
	"&:hover": {
		backgroundColor: SECONDARY_COLOR,
	},
	fontFamily: "avenir",
}));

const HomePage = () => {
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const navigate = useNavigate();
	const theme = useTheme();

	const schoolIconsArray = [
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FCP_Goenka_International_School.jpg?alt=media&token=c7296ad1-1c85-48f2-9717-27d2261d9b02",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FCityPride.jpg?alt=media&token=34bacd0d-520d-46ff-a1ac-a02d87e96796",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FDPS.jpg?alt=media&token=b634596c-87e0-4dcd-bcd4-19ce83969c0c",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FEuro.png?alt=media&token=5e76e832-28e3-4749-8ae6-03c07b6c407b",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FHDFC.png?alt=media&token=9435f069-eaf2-4fc8-ad25-0991e30dff81",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FKalyaniLogo.jpg?alt=media&token=d16dff9b-30ac-4b54-93c3-879b17034ad3",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FLexicon.png?alt=media&token=845ece34-d4a7-487b-90f4-824a50426cce",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FschoolIconsWebsite%2FMIS.jpg?alt=media&token=dd63c517-f326-4cbb-aafe-fc58aca646f1",
	];

	const maidaanInNewsIconsArray = [
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FinTheNewsIconsWebsite%2FBusinessWorld.jpg?alt=media&token=f7e67868-2e78-41a5-bee2-6c99d51fa2d2",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FinTheNewsIconsWebsite%2FFinancial-Express-Logo.jpg?alt=media&token=2ea27e89-642d-4814-a7a0-071803361670",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FinTheNewsIconsWebsite%2FISN.png?alt=media&token=83b773f8-fd97-4450-9d8e-067278424c6e",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FinTheNewsIconsWebsite%2FInc42.webp?alt=media&token=01eb72f9-08ee-4b79-b2ba-d52b166fa0a5",

		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FinTheNewsIconsWebsite%2FOutlook.jpg?alt=media&token=6ec9823a-bb15-438e-8c34-cf993dca9877",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FinTheNewsIconsWebsite%2FVCCircle_Logo.jpg?alt=media&token=0aa4e2f6-f446-440f-911f-ee079013b468",
		"https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FinTheNewsIconsWebsite%2FYourStory.jpg?alt=media&token=056c697d-770e-492f-b738-59640217cc06",
	];

	const [showSchoolPopup, setShowSchoolPopup] = React.useState(false);
	const [formData, setFormData] = React.useState({});
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
		<>
			<Box
				sx={{
					width: "100%",
					height: "100vh",
					backgroundImage:
						"linear-gradient(to right, rgb(58,58,58), rgb(24,24,24))",
				}}>
				<Box sx={{ display: "flex" }} id="home">
					<ElevationScroll>
						<AppBar
							component="nav"
							color="transparent"
							sx={{
								boxShadow: "0 0",
								display: "flex",
								justifyContent: "space-between",
								flexDirection: "row",
								paddingLeft: "24px",
							}}>
							<Box
								sx={{
									width: { md: "12%", lg: "8%" },
									height: { xs: "12vw", md: "100px" },
									minHeight: "80px",
									minWidth: "80px",
									backgroundImage: "url('./Assets/Images/logos-01.svg')",
									backgroundSize: "cover",
									backgroundRepeat: "no-repeat",
								}}
							/>
							<Toolbar
								variant="dense"
								sx={{ paddingTop: "20px", paddingBottom: "20px" }}>
								<Typography
									variant="h6"
									component="div"
									sx={{ flexGrow: 1, display: { sm: "block" } }}></Typography>
								<IconButton
									aria-label="open drawer"
									edge="start"
									onClick={handleDrawerToggle}
									sx={{ mr: 2, display: { sm: "none" }, color: primaryColor }}>
									<MenuIcon />
								</IconButton>
								<Box
									sx={{
										display: { xs: "none", sm: "flex" },
										gap: "5vw",
										marginRight: { lg: "5vw" },
									}}>
									{navItems.map((item, idx) => (
										<Button
											variant="text"
											size="small"
											key={item}
											sx={{
												color: primaryColor,
												fontWeight: 100,
												// margin: {
												//   sm: "32px 10px",
												//   md: "32px",
												// },
												fontSize: "18px !important",
											}}
											href={navLinks[idx]}>
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
									backgroundColor: "#232323",
								},
							}}>
							{drawer}
						</Drawer>
					</Box>
				</Box>
				<Box
					sx={{
						width: "50%",
						height: "44vw",
						backgroundImage: "url('./Assets/Images/home-boy.png')",
						backgroundSize: "cover",
						backgroundRepeat: "no-repeat",
						position: "absolute",
						bottom: "0",
						right: "20px",
						zIndex: "1",
					}}
				/>
				<Box
					sx={{
						width: "100vw",
						height: "100vh",
						backgroundImage: "url('./Assets/Images/pattern_green.png')",
						backgroundSize: "contain",
						backgroundRepeat: "no-repeat",
						position: "absolute",
						top: "0px",
						left: "-20px",
						zIndex: "0",
						opacity: 0.2,
					}}
				/>
				<Box
					sx={{
						width: "80%",
						position: "absolute",
						top: "0px",
						fontSize: "15px",
					}}>
					<Box
						sx={{
							width: "80vw",
							position: "relative",
							top: { xs: "160px", md: "200px", lg: "240px" },
							left: { xs: "4vw", md: "7vw", lg: "9vw" },
							zIndex: "1",
							textAlign: "left",
						}}>
						<Box
							sx={{
								textAlign: "left",
								fontWeight: "bolder",
								fontSize: "min(7vw, 48px) !important",
								color: "white",
							}}>
							Building India's most
							<br />
							<span style={{ color: primaryColor }}>fearless competitors</span>
						</Box>
						<Box
							sx={{
								fontSize: "20px",
								color: "white",
								fontWeight: 100,
								marginTop: "20px",
							}}>
							Battle students across India in
							<span style={{ color: primaryColor }}>
								{" "}
								Mini Online Olympiads{" "}
							</span>
						</Box>
						<Box
							sx={{ display: "flex", marginTop: { xs: "30px", md: "54px" } }}>
							<ColorButton
								variant="contained"
								onClick={() => (window.location.href = "/register")}>
								REGISTER
							</ColorButton>
							<OppColorButton
								variant="outlined"
								onClick={() => (window.location.href = "/login?d=Y")}>
								PLAY TRIAL
							</OppColorButton>
						</Box>

						<Box sx={{ marginTop: "30px" }}>
							<div className="block sm:hidden">
								<div className="flex items-center gap-4 text-base md:text-[20px]">
									<img
										width="24px"
										height="24px"
										src="/Assets/Icons/login-home-page.svg"
									/>
									<span className="text-white text-center">
										Already Registered?
									</span>
									<span
										className="text-[#ccf900] underline text-center"
										onClick={() => (window.location.href = "/login")}>
										Login
									</span>
								</div>
							</div>
						</Box>

						<Box sx={{ marginTop: { xs: "20px", md: "54px" } }}>
							<div className="flex items-center gap-4 text-base md:text-[20px]">
								<img width="24px" src="/Assets/Icons/school-home-page.svg" />
								<span className="text-white">For schools?</span>
								<span
									className="text-[#ccf900] underline"
									onClick={() => setShowSchoolPopup(true)}>
									Know more
								</span>
							</div>
						</Box>
					</Box>
				</Box>
			</Box>
			<Box
				sx={{
					width: "100%",
					minHeight: "60vh",
					flexGrow: 1,
					marginTop: "6vw",
				}}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Box
							sx={{
								textAlign: "center",
								// fontWeight: "bolder",
								fontSize: { xs: "24px", md: "36px" },
								color: "black",
								margin: "4vw",
								marginTop: 0,
								// marginLeft: { xs: "4vw", md: "9vw" },
							}}>
							How It Works
						</Box>
					</Grid>
					<Grid
						item
						md={4}
						xs={12}
						sx={{ marginBottom: "40px", marginTop: "20px" }}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<img width="240px" src="/Assets/Images/ht1.png" />
						</Box>
					</Grid>
					<Grid
						item
						md={4}
						xs={12}
						sx={{
							marginBottom: "40px",
							marginTop: { sm: "20px", lg: "80px" },
						}}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<img width="240px" src="/Assets/Images/ht2.png" />
						</Box>
					</Grid>
					<Grid
						item
						md={4}
						xs={12}
						sx={{ marginBottom: "40px", marginTop: "20px" }}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<img width="240px" src="/Assets/Images/ht3.png" />
						</Box>
					</Grid>
				</Grid>
			</Box>
			<Box
				sx={{
					width: "100%",
					minHeight: "10vh",
					flexGrow: 1,
					backgroundImage: "url('./Assets/Images/pattern.png')",
					backgroundSize: "cover",
					backgroundRepeat: "no-repeat",
					zIndex: "0",
					paddingBottom: { md: "10vw", xs: "6vw" },
					marginTop: "6vw",
				}}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Box
							sx={{
								textAlign: "center",
								// fontWeight: "bolder",
								fontSize: { xs: "24px", md: "36px" },
								color: "black",
								margin: "4vw",
								marginTop: 0,
								// marginLeft: { xs: "4vw", md: "9vw" },
							}}>
							Upcoming Tournaments
						</Box>
					</Grid>
					<Grid item xs={12} sx={{ marginTop: { sm: "20px", lg: "0px" } }}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Box
								onClick={() => (window.location.href = REGISTER_URL)}
								sx={{
									width: { md: "78%", xs: "100%" },
									minHeight: { md: "50vh", xs: "45vh" },
									backgroundImage: {
										//large image
										md: "url('https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FHomepage%20Web%20Jun%2024.png?alt=media&token=82cd42a4-ae4c-424c-8dc6-3d171cf134de')",
										//mobile image
										xs: "url('https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Static%20Assets%2FHomepage%20Mobile%20Jun%2024.png?alt=media&token=2e172db2-30fb-4221-b6e2-33498163e994')",
									},
									backgroundSize: "contain",
									backgroundRepeat: "no-repeat",
									cursor: "pointer",
								}}
							/>
						</Box>
					</Grid>
				</Grid>
			</Box>
			<Box></Box>
			<Box
				sx={{
					width: "100%",
					minHeight: "50vh",
					flexGrow: 1,
					backgroundImage: "url('./Assets/Images/pattern.png')",
					backgroundSize: "cover",
					backgroundRepeat: "no-repeat",
					zIndex: "0",
					marginTop: "6vw",
				}}
				id="watch-demo">
				<Box
					sx={{
						textAlign: "center",
						// fontWeight: "bold",
						fontSize: { xs: "24px", md: "36px" },
						color: "black",
						marginTop: "0",
						marginBottom: "4vw",
					}}>
					Watch Demo
				</Box>

				<Grid container spacing={2}>
					<Grid item xs={12} md={6}>
						<Box
							sx={{
								textAlign: "left",
								fontSize: { xs: "16px", md: "20px" },
								color: "black",
								margin: "4vw",
								marginTop: { xs: "4vw", md: "0" },
								fontWeight: "lighter",
							}}>
							Here’s a quick video to show you how the platform works and how
							the mini Olympiads are conducted. Time commitment needed per round
							is a maximum of 5 minutes! Compete from anywhere, learn and track
							performance in the post-match analysis through uber-cool stats!
						</Box>

						<Box
							sx={{
								marginLeft: "4vw",
								marginTop: "40px",
							}}>
							<ColorButton
								sx={{
									marginBottom: { xs: "20px", md: 0 },
									marginRight: "20px",
								}}
								variant="contained"
								onClick={() => (window.location.href = REGISTER_URL)}>
								REGISTER
							</ColorButton>
							<GreyOppColorButton
								variant="outlined"
								onClick={() => (window.location.href = "/login?d=Y")}>
								PLAY TRIAL
							</GreyOppColorButton>
						</Box>
					</Grid>

					<Grid
						item
						xs={12}
						md={6}
						sx={{
							margin: { xs: "4px", md: "0" },
							marginTop: { xs: "20px", md: "0" },
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}>
						<iframe
							width="100%"
							height="315"
							src="https://www.youtube.com/embed/T-vp3oIEzrU"
							title="YouTube video player"
							allowFullScreen
							style={{ border: 0, maxWidth: "560px" }}></iframe>
					</Grid>
				</Grid>
			</Box>

			<div className="flex flex-col items-center justify-center gap-[40px] mt-[60px]">
				<span className="text-[24px] md:text-[36px]"> Our Presence</span>

				<div className="flex items-center justify-center gap-[10vw]">
					<div className="flex flex-col">
						<span className="text-[36px] md:text-[60px]">45+</span>
						<span className="text-center">Schools</span>
					</div>

					<div className="flex flex-col">
						<span className="text-[36px] md:text-[60px]">50+</span>
						<span className="text-center">Cities</span>
					</div>

					<div className="flex flex-col">
						<span className="text-[36px] md:text-[60px]">10000+</span>
						<span className="text-center">Students</span>
					</div>
				</div>
			</div>

			<TickerComponent icons={schoolIconsArray} />

			<Testimonials />
			<div className="mt-[60px]">
				<ProductBenefits />
			</div>
			<div className="flex flex-col items-center justify-center gap-[40px] mt-[60px]">
				<span className="text-[24px] md:text-[36px]">Maidaan In The News</span>
			</div>
			<TickerComponent icons={maidaanInNewsIconsArray} />

			<Box
				sx={{
					width: "100%",
					minHeight: "30vh",
					flexGrow: 1,
					backgroundColor: SECONDARY_COLOR,
				}}
				id="footer">
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
								}}>
								<span style={{ color: primaryColor }}>Address:</span>
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
						sx={{ marginBottom: "40px", marginTop: "20px" }}>
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
								}}>
								<span style={{ color: primaryColor }}>
									<a
										href="http://maps.google.com/?q=Level-Field Tech Pvt Ltd WeWork Galaxy"
										style={{ color: primaryColor }}
										target="_blank">
										Locate Us On Google
									</a>
									<br />
									<a
										href="mailto:contact@maidaan.app"
										style={{ color: primaryColor }}>
										contact@maidaan.app
									</a>
									<br />
									<a href="tel:+918618006284" style={{ color: primaryColor }}>
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
								}}>
								<span>
									<a href="/about-us" style={{ color: primaryColor }}>
										About Us
									</a>
									<br />
									<a
										href="mailto:contact@maidaan.app"
										style={{ color: primaryColor }}>
										Contact Us
									</a>
									<br />
									<a href="/privacy-policy" style={{ color: primaryColor }}>
										Privacy Policy
									</a>
									<br />
									<a
										href="/terms-and-conditions"
										style={{ color: primaryColor }}>
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
						sx={{ marginBottom: "30px", marginTop: "20px" }}></Grid>
					<Grid item xs={12} sx={{ marginBottom: "10px", marginTop: "10px" }}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Box
								sx={{
									textAlign: "center",
								}}>
								<span style={{ color: primaryColor, fontSize: "12px" }}>
									Copyright 2024 Maidaan. All Rights Reserved.
								</span>
							</Box>
						</Box>
					</Grid>
				</Grid>
			</Box>
			<SchoolPopupForm
				formData={formData}
				setFormData={setFormData}
				showSchoolPopup={showSchoolPopup}
				setShowSchoolPopup={setShowSchoolPopup}
			/>
		</>
	);
};

export default HomePage;
