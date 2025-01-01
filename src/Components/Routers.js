import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SpellBee from "./Games/SpellBee";
import HomePage from "./PageComponents/HomePage";
import AboutUs from "./PageComponents/AboutUs";
import { useSelector } from "react-redux/es/exports";
import DashBoard from "./PageComponents/Dashboard";
import LoginPage from "./PageComponents/LoginPage";
import { PrivateRoute } from "./PrivateRoute";
import UserProfile from "./PageComponents/ProfilePage/index";
import UserProfileSetup from "./PageComponents/ProfilePage/UserProfileSetup";
import FriendRequests from "./PageComponents/ProfilePage/FriendRequests";
import FriendsList from "./PageComponents/ProfilePage/FriendsList";
import DesktopRestriction from "./PageComponents/DesktopRestriction";
import ErrorScreen from "./PageComponents/ErrorScreen";
import Leaderboard from "./PageComponents/Leaderboard";
import Lobby from "./Games/SpellBee/Lobby";
import NewLobby from "./Games/SpellBee/NewLobby";
import LobbyDemo from "./Games/SpellBee/LobbyDemo";
import SchoolLobby from "./Games/SpellBee/SchoolLobby";
import PopQuizLobby from "./Games/SpellBee/PopQuizLobby";
import TournamentLobby from "./Games/SpellBee/TournamentLobby.js";
import AttemptedWordList from "./PageComponents/AttemptedWordList";
import RegisterPage from "./PageComponents/Register";
import PrivacyPolicy from "./PageComponents/PrivacyPolicy";
import TermsAndConditions from "./PageComponents/TermsAndConditions";
import RefundPolicy from "./PageComponents/RefundPolicy";
import EnterPhoneScreen from "./PageComponents/Register/EnterPhoneScreen";
import TournamentPage from "./PageComponents/Tournament";
import PaymentVerifyPage from "./PageComponents/Payment/PaymentVerifyPage";
import WalletPage from "./PageComponents/Wallet";
import SubscriptionPage from "./PageComponents/Wallet/SubscriptionPage";
import DiscordChat from "./DiscordChat";
import ForgotPasswordPage from "./PageComponents/ForgotPasswordPage";
import LeaderboardCohorts from "./PageComponents/Leaderboard/LeaderboardCohorts";
import QuestionOfTheDay from "./PageComponents/QuestionOftheDay/QuestionOfTheDay";
import BackgroundImageWrapper from "./Common/BackgroundImageWrapper";
import PuneSpellathonForm from "./PageComponents/PuneSpellathonForm";
import MemoryCards from "../GamesArena/MemoryCards";
import OneOnOneQuiz from "../GamesArena/OneOnOneQuiz";
import {
	ARENA_LEADERBOARD_ROUTE,
	ARENA_ROUTE,
	MEMORY_CARDS_ROUTE,
	MEMORY_CARDS_PRO_ROUTE,
	QUIZ_GAME_ROUTE,
	ARENA_GAMES_ROUTE,
	CONNECT_4_ROUTE,
	HANGMAN_ROUTE,
	ARCHERY_ROUTE,
	MINI_SCRABBLE_ROUTE,
	TOURNAMENT_OPT_IN_ROUTE,
	CHECKOUT_ROUTE,
	PAYMENT_REDIRECT_ROUTE,
	YOUR_PLAN_ROUTE,
	CERTIFICATES_ROUTE,
	ORDERS_ROUTE,
	UPDATE_SCHOOL_DETAILS_ROUTE,
	CLASS_JAM_ROUTE,
	NON_DEMO_WIDE_SCREEN_ROUTES,
} from "../Constants/routes";
import ArenaHome from "../GamesArena/ArenaHome";
import ArenaLeaderboard from "../GamesArena/ArenaLeaderboard";
import ArenaGames from "../GamesArena/ArenaGames";
import Connect4 from "../GamesArena/Connect4";
import FinDocsLinks from "./FinDocsLink";
import Hangman from "../GamesArena/Hangman";
import ArcheryGame from "../GamesArena/Archery";
import ProfileCardLikes from "./PageComponents/ProfilePage/ProfileCardVotes";
import MiniScrabble from "../GamesArena/MiniScrabble/index.js";
import TournamentScreen from "./PageComponents/Register/TournamentScreen.js";
import CheckoutPage from "./PageComponents/Payment/CheckoutPage.js";
import PaymentSuccessOrFailModal from "./PageComponents/Payment/PaymentSuccessOrFailModal.js";
import PaymentPhoneNumberPage from "./PageComponents/Payment/PaymentPhoneNumberPage.js";
import YourPlanPage from "./PageComponents/Payment/YourPlanPage/index.js";
import CertificatesPage from "./PageComponents/Certificates/index.js";
import OrdersPage from "./PageComponents/Payment/OrdersPage.js";
import CodingGameContainer from "./Games/SpellBee/GameComponents/CodingGameContainer/index.js";

import UpdateChildSchoolDetailsPage from "./PageComponents/Register/UpdateChildSchoolDetailsPage.js";
import AllProfileCardLikes from "./PageComponents/ProfilePage/AllProfileCardLikes";
import AllScrapBookQuestions from "./PageComponents/ProfilePage/AllScrapBookQuestions";
import ClassJamPage from "./PageComponents/ClassJam/index.js";
import GeoLocator from "./Games/SpellBee/GameComponents/GeoLocator/GeoLocator.js";
import PaperCheckingContainer from "./Games/SpellBee/GameComponents/PaperChecking/index.js";

import { Tangram } from "./Games/SpellBee/GameComponents/Tangram/TangramContainer";

const Routers = () => {

  const searchParams = new URLSearchParams(window.location.search);
  const pathName = window.location.pathname;
  const openKeyboard = useSelector((state) => state);
	const width = window.screen.width;
	const height = window.screen.height;


  const WideScreenRoutes = searchParams.get("d") === "Y" || NON_DEMO_WIDE_SCREEN_ROUTES.includes(pathName)

	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route exacat path="/" element={<HomePage />} />
					<Route exacat path="/about-us" element={<AboutUs />} />
					<Route exacat path="/privacy-policy" element={<PrivacyPolicy />} />
					<Route
						exacat
						path="/pune-spellathon"
						element={
							<BackgroundImageWrapper>
								<PuneSpellathonForm />
							</BackgroundImageWrapper>
						}
					/>
					<Route
						exacat
						path="/terms-and-conditions"
						element={<TermsAndConditions />}
					/>
					<Route exacat path="/financial_reports" element={<FinDocsLinks />} />
					<Route exacat path="/refund-policy" element={<RefundPolicy />} />
					<Route
						exacat
						path="/register"
						element={
							<BackgroundImageWrapper>
								<RegisterPage />
							</BackgroundImageWrapper>
						}
					/>
					<Route
						exacat
						path="/enter-phone"
						element={
							<BackgroundImageWrapper>
								<EnterPhoneScreen />
							</BackgroundImageWrapper>
						}
					/>
					{width < height || WideScreenRoutes ? (
						<>
							<Route exacat path="/error" element={<ErrorScreen />} />
							{/* <Route element={<PrivateRoute />}> */}
							<Route
								exacat
								path={ARENA_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<ArenaHome />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={MEMORY_CARDS_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<MemoryCards />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={MEMORY_CARDS_PRO_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<MemoryCards />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={QUIZ_GAME_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<OneOnOneQuiz />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={ARENA_GAMES_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<ArenaGames />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={ARENA_LEADERBOARD_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<ArenaLeaderboard />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={CONNECT_4_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<Connect4 />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>

							<Route
								exacat
								path={HANGMAN_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<Hangman />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>

							<Route
								exacat
								path={ARCHERY_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<ArcheryGame />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>

							<Route
								exacat
								path="/geo"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<GeoLocator />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={MINI_SCRABBLE_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<MiniScrabble />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>

							<Route
								exacat
								path="/login"
								element={
									<BackgroundImageWrapper>
										<LoginPage />
									</BackgroundImageWrapper>
								}
							/>
							<Route
								exacat
								path="/forgot-password"
								element={
									<BackgroundImageWrapper>
										<ForgotPasswordPage />
									</BackgroundImageWrapper>
								}
							/>

							<Route
								exact
								path="/dashboard/*"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<DashBoard />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exact
								path="/lobby/*"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<NewLobby />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exact
								path="/lobby-demo"
								element={
									<BackgroundImageWrapper
										isLight={false}
										oppositeOnLarge={true}>
										<LobbyDemo />
									</BackgroundImageWrapper>
								}
							/>
							<Route
								exact
								path={TOURNAMENT_OPT_IN_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<TournamentScreen />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>

							{/**create a new route for school lobby */}

							<Route
								exact
								path="/school-lobby"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<SchoolLobby />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exact
								path="/tournament-lobby"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<TournamentLobby />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exact
								path="/pop-quiz-lobby"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<PopQuizLobby />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exact
								path="/new-lobby/*"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<NewLobby />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exact
								path="/quiz/*"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper isLight={true}>
											<SpellBee />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exact
								path="/tournament/*"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper
											isLight={false}
											oppositeOnLarge={true}>
											<TournamentPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/profile/:encryptedId/"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<UserProfile />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/profile-setup"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<UserProfileSetup />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/FriendsList/:userId/"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<FriendsList />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/20questions/:userId/"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<AllScrapBookQuestions />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/profile/votes"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<ProfileCardLikes />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>

							<Route
								exacat
								path="/profile/allvotes"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<AllProfileCardLikes />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/friendrequests"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper isLight={false}>
											<FriendRequests />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/leaderboard"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper isLight={true}>
											<Leaderboard />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/leaderboard/cohorts"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper isLight={true}>
											<LeaderboardCohorts />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/questionoftheday"
								element={
									<BackgroundImageWrapper isLight={false}>
										<QuestionOfTheDay />
									</BackgroundImageWrapper>
								}
							/>
							<Route
								exacat
								path="/chat"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper
											isLight={false}
											oppositeOnLarge={true}>
											<DiscordChat />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/att-wrd"
								element={
									<PrivateRoute>
										<AttemptedWordList />
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/payment/verify"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper isLight={true}>
											<PaymentVerifyPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={PAYMENT_REDIRECT_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<PaymentSuccessOrFailModal />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/payment-phonenumber"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<PaymentPhoneNumberPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={YOUR_PLAN_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<YourPlanPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={CERTIFICATES_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<CertificatesPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={ORDERS_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<OrdersPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/wallet"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper
											isLight={false}
											oppositeOnLarge={true}>
											<WalletPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path="/subscribe"
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<SubscriptionPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={CHECKOUT_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper
											isLight={false}
											oppositeOnLarge={true}>
											<CheckoutPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={UPDATE_SCHOOL_DETAILS_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<UpdateChildSchoolDetailsPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							<Route
								exacat
								path={CLASS_JAM_ROUTE}
								element={
									<PrivateRoute>
										<BackgroundImageWrapper>
											<ClassJamPage />
										</BackgroundImageWrapper>
									</PrivateRoute>
								}
							/>
							{/* </Route> */}
						</>
					) : (
						<Route exacat path="/*" element={<DesktopRestriction />} />
					)}
				</Routes>
			</BrowserRouter>
			{openKeyboard && <div>loading</div>}
		</>
	);
};
export default Routers;
