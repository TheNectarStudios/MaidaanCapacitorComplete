import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DEFAULT_TENANT_ID,
  MAIN_GAME_TIMER,
  PRIMARY_COLOR,
  REGISTER_URL,
  SECONDARY_COLOR,
  TOURNAMENT_ID,
} from "../../../Constants/Commons";
import * as FB from "../../Firebase/FirebaseFunctions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import { TournamentStatus, returnEncryptedUserId } from "../../utils";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import _ from "lodash";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../Loader";
import FormControl from "@mui/material/FormControl";
import InputBase from "@mui/material/InputBase";
import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import InsightsIcon from "@mui/icons-material/Insights";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Box from "@mui/material/Box";
import { UserStats } from "./UserStats";
import "./index.css";
import { useAuth } from "../../../providers/auth-provider";
import { useApp } from "../../../providers/app-provider";
import { MEASURE } from "../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../instrumentation/types";
import AppButton from "../../Common/AppButton";
import mixpanel from 'mixpanel-browser';

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(3),
  },
  "& .MuiInputBase-input": {
    borderRadius: 4,
    position: "relative",
    background: "rgba(0,0,0,0)",
    color: PRIMARY_COLOR,
    border: "1px solid #ced4da",
    fontSize: 12,
    padding: "6px 26px 6px 12px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {
      borderRadius: 4,
      borderColor: "#80bdff",
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: PRIMARY_COLOR,
    color: SECONDARY_COLOR,
    fontWeight: "bolder",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    color: "white",
    border: "none",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    background: "#575757",
  },
  "&:nth-of-type(even)": {
    background: "#575757",
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const ColorButton = styled(Button)(({ theme }) => ({  
  color: "black",
  borderRadius: "30px",
  width: "200px",
  backgroundColor: PRIMARY_COLOR,
  fontSize: "calc(0.5vw + 10px) !important",
  "&:hover": {
    backgroundColor: PRIMARY_COLOR,
  },
  fontFamily: "avenir",
}));

const pageHeaders = ["LEADERBOARD", "YOUR STATS"];

const LeaderboardCohorts = (props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tId");
  const weeklyQuizParam = searchParams.get("wq");
  const roundParam = searchParams.get("r");
  const tournamentTitleParam = searchParams.get("t");
  const isDemoGame = searchParams.get("d") === "Y";
  const isDemo = searchParams.get("d") === "S";
  const demoGameId = searchParams.get("gId");
  const redirectToChat = searchParams.get("ch") === "1";
  const backNavigator = searchParams.get("back");
  const userId = localStorage.getItem("userId");

  const { user, isUserInMaidaanTenant } = useAuth();
  const { wallet, isOpenTenantSelected } = useApp();

  const [data, setData] = useState([]);
  const [roundStatus, setRoundStatus] = useState("COMPLETED");
  const [aggregateOption, setAggregateOption] = useState('');
  const [parentTournamentData, setParentTournamentData] = useState({});
  const [tournamentData, setTournamentData] = useState({});
  const [tournamentStatus, setTournamentStatus] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [roundData, setRoundData] = useState({ startDate: {}, endDate: {} });
  const [loading, setLoading] = useState(false);
  const [parentLoading, setParentLoading] = useState(false);
  const [navValue, setNavValue] = useState(0);

  const getTournamentDetails = async (tId = tournamentId) => {
    FB.getData("tournaments", tId).then((t) => {
      setTournamentData(t);
      // t.setWeeklyQuiz && onNavChange(1);
    });
  };

  const getRoundDeatils = async (activeRound) => {
    FB.getData(`tournaments/${tournamentId}/rounds`, String(activeRound)).then(
      (t) => {
        setRoundData(t);
      }
    );
  };

  const setDataByAggregateOption = (idx, data) => {
    const result = [];
    if (idx === 0) {
      data.forEach((d) => {
        const aggScore = d.score.reduce((pv, cv) => pv + cv, 0);
        const aggAttempt = d.attempts.reduce((pv, cv) => pv + cv, 0);
        const aggCorrectAttempts = d.correctAttempts.reduce((pv, cv) => pv + cv, 0);
        const aggDaysPlayed = d.daysPlayed?.length ?? 0;
        result.push({
          name: isDemoGame ? d.playerName : `${d.firstName} ${d.lastName}`,
          grade: d.grade,
          city: d.city,
          score: aggScore,
          attempts: aggAttempt,
          correctAttempts : aggCorrectAttempts,
          daysPlayed: aggDaysPlayed,
          pace: Math.floor(
            (MAIN_GAME_TIMER * aggDaysPlayed) / Number(aggAttempt)
          ),
          accuracy: Math.floor((Number(aggCorrectAttempts) * 100) / Number(aggAttempt)),
          id: d.id,
        });
      });
    } else {
      data.forEach((d) => {
        if (d.round.includes(String(idx))) {
          const qId = d.round.indexOf(String(idx));
          result.push({
            name: isDemoGame ? d.playerName : `${d.firstName} ${d.lastName}`,
            grade: d.grade,
            city: d.city,
            score: d.score[qId],
            correctAttempts : d.correctAttempts[qId],
            attempts: d.attempts[qId],
            daysPlayed: 0,
            pace: Math.floor(MAIN_GAME_TIMER / d.attempts[qId]),
            accuracy: Math.floor(
              (Number(d.correctAttempts[qId]) * 100) / Number(d.attempts[qId])
            ),
            id: d.id,
          });
        }
      });
    }
    const orderedValue = _.orderBy(
      result,
      ["score", "accuracy"],
      ["desc", "desc"]
    );

    let rank = 1;
    let diff = 0;
    orderedValue.forEach((d, idx) => {
      if (idx > 0) {
        if (
          orderedValue[idx - 1].score === d.score &&
          orderedValue[idx - 1].accuracy === d.accuracy
        ) {
          d.rank = rank;
          diff++;
        } else {
          rank = rank + 1 + diff;
          d.rank = rank;
          diff = 0;
        }
      } else {
        d.rank = 1;
      }
      d.points = tournamentData?.rewardPointsMap?.[d.rank] ?? 0;
    });
    setData(orderedValue);
  };

  const fetchTournamentDetails = (tId) => {
    setLoading(true);
    getTournamentDetails(tId);

    FB.getAllDocs(`tournaments/${tId}/leaderboard`, isDemo, userId)
      .then((d) => {
        setLeaderboardData(d);
        setDataByAggregateOption(0, d);
        setLoading(false);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  useEffect(() => {
    setParentLoading(true);
    FB.getData("tournaments", tournamentId).then((t) => {
      setParentTournamentData(t);
      setAggregateOption(t.cohorts[0].id);
      setParentLoading(false);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tournamentData && tournamentData.rewardPointsMap) {
      setDataByAggregateOption(0, leaderboardData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentData, leaderboardData]);

  useEffect(() => {
    if (roundData.startDate.seconds) {
      const roundS = TournamentStatus(
        roundData.startDate.seconds,
        roundData.endDate.seconds
      );
      setRoundStatus(roundS);
    }
  }, [roundData]);

  useEffect(() => {
    if (tournamentData && tournamentData.name) {
      const tStatus = TournamentStatus(
        tournamentData.startDate.seconds,
        tournamentData.endDate.seconds
      );
      setTournamentStatus(tStatus);
    }
  }, [tournamentData]);

  useEffect(() => {
    if (aggregateOption) {
      fetchTournamentDetails(aggregateOption);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregateOption]);

  const handleChange = (event) => {
    setAggregateOption(event.target.value);
    setDataByAggregateOption(event.target.value, leaderboardData);
    if (tournamentData.activeRound === event.target.value) {
      getRoundDeatils(event.target.value);
    } else {
      setRoundStatus("COMPLETED");
    }
  };

  const handleCohortChange = (event) => {
    setAggregateOption(event.target.value);
  };

  const getPageTitle = () => {
    if (navValue === 0 && tournamentData.setWeeklyQuiz) {
      return "YOUR STATS";
    }
    return "LEADERBOARD";
  };

  const handleBack = () => {
    let url;
    if (redirectToChat) {
      url = `/leaderboard?tId=${tournamentId}&ch=1&back=${backNavigator}`;
    } else {
      url = `/leaderboard?tId=${tournamentId}`;
    }
    if(isDemo){
      url += `&d=S`;
    }
    navigate(url);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl items-center justify-center relative bg-white">
      {/* <img
        src="/Assets/Images/pattern-light-desktop.svg"
        alt="vector-pattern"
        className="absolute -z-[1] h-full hidden md:block"
      /> */}
      <div
        id="header"
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "50px",
          backgroundColor: SECONDARY_COLOR,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            height: "28px",
            width: "28px",
            backgroundImage: "url('/Assets/Icons/Back.svg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            marginLeft: "4px",
          }}
          onClick={handleBack}
        />
        <h3 style={{ color: PRIMARY_COLOR }}>{getPageTitle()}</h3>
        <div style={{ width: "28px", marginLeft: "4px" }}></div>
      </div>
      {parentLoading ? (
        <div
          style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Loader />
        </div>
      ) : (
        <div
          style={{
            // position: "absolute",
            // top: "50px",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            // display: "flex",
            // justifyContent: "center",
            // flexDirection: "column",
          }}
        >
          {navValue === 0 && !tournamentData.setWeeklyQuiz ? (
            <>
              <div
                style={{
                  width: "100%",
                  background: "#575757",
                }}
              >
                {/* <div style={{ margin: "10px", color: "white", fontSize: 14 }}>
                  <b>Current Status: </b>{" "}
                  <span style={{ color: PRIMARY_COLOR }}>
                    {tournamentStatus}
                  </span>
                </div> */}
                {/* {tournamentStatus === "ONGOING" && !isDemoGame ? (
                  <div style={{ margin: "10px", color: "white", fontSize: 14 }}>
                    <b>Ongoing Round: </b>{" "}
                    <span style={{ color: PRIMARY_COLOR }}>
                      {tournamentData.activeRound}/{tournamentData.totalRounds}
                    </span>
                  </div>
                ) : null} */}
              </div>
              {!isDemoGame ? (
                <>
                  <div className="pt-5 px-2.5 pb-2.5 text-center">
                    <span className="uppercase">
                      {tournamentData?.name}: All Pools
                    </span>
                  </div>
                  <div className="w-full bg-[#575757] mt-2.5 flex gap-4 p-2.5 text-white text-sm justify-between md:px-8">
                    <Select
                      id="t-select"
                      sx={{
                        color: "white",
                        ".MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(228, 219, 233, 0.25)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(228, 219, 233, 0.25)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(228, 219, 233, 0.25)",
                        },
                        ".MuiSvgIcon-root ": {
                          fill: "white !important",
                        },
                      }}
                      value={aggregateOption}
                      label="Select Cohort"
                      onChange={handleCohortChange}
                      input={<BootstrapInput />}
                    >
                      {parentTournamentData?.cohorts?.map(({ id, name }, i) => (
                        <MenuItem key={id} value={id}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                    <AppButton
                      className="min-w-[160px] w-[160px]"
                      onClick={handleBack}
                    >
                      Back to my Pool
                    </AppButton>
                  </div>
                </>
              ) : null}
              <div className="w-full mt-2.5 mb-[15%] h-full">
                {loading ? (
                  <div className="flex justify-center items-center h-full py-24">
                    <Loader />
                  </div>
                ) : (
                  <>
                    {tournamentData?.leaderboardLimit ? (
                      <div className="p-2.5 uppercase md:px-8">
                        Current Top {tournamentData?.leaderboardLimit}
                      </div>
                    ) : (
                      <></>
                    )}
                    <TableContainer
                      component={Paper}
                      sx={{
                        maxHeight: "100%",
                      }}
                    >
                      <Table
                        stickyHeader
                        sx={{ maxWidth: "100%" }}
                        aria-label="simple table"
                        size="small"
                      >
                        <TableHead>
                          <StyledTableRow style={{ padding: 8 }}>
                            <StyledTableCell align="center">
                              Rank
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              Name
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              Score
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              {!isDemoGame &&
                              aggregateOption === 0 &&
                              tournamentData?.rewardPointsMap
                                ? "Coins"
                                : "Accuracy"}
                            </StyledTableCell>
                          </StyledTableRow>
                        </TableHead>
                        <TableBody>
                          {data
                            .slice(0, tournamentData?.leaderboardLimit)
                            .map((row, i) => (
                              <StyledTableRow
                                key={`${row.firstName}-${i}`}
                                sx={{
                                  "&:last-child td, &:last-child th": {
                                    border: 0,
                                  },
                                }}
                              >
                                <StyledTableCell
                                  align="center"
                                  component="th"
                                  scope="row"
                                >
                                  {row.rank}
                                </StyledTableCell>
                                <StyledTableCell component="th" scope="row"  /*onClick={() => navigate(`/profile/${returnEncryptedUserId(row.id)}`)}*/>
                                  {row.name}
                                  {row.grade ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        fontSize: 11,
                                        justifyContent: "center",
                                      }}
                                    >
                                      <span>Class {row.grade}</span>
                                      <span>{row.city}</span>
                                    </div>
                                  ) : null}
                                </StyledTableCell>
                                <StyledTableCell align="center">
                                  {row.score}
                                </StyledTableCell>
                                <StyledTableCell align="center">
                                  {Number.isFinite(row.accuracy) ? (
                                    <>
                                      {isDemoGame ||
                                      aggregateOption !== 0 ||
                                      !tournamentData?.rewardPointsMap ? (
                                        <>
                                          {row.accuracy}{" "}
                                          <span style={{ fontSize: 10 }}>
                                            %
                                          </span>
                                        </>
                                      ) : (
                                        row.points
                                      )}
                                    </>
                                  ) : (
                                    "0"
                                  )}
                                </StyledTableCell>
                              </StyledTableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardCohorts;
