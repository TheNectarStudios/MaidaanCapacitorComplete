import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";
import { useEffect, useState } from "react";
import { getGameConfig, getWeeklyArenaTournamentLeaderboard, sortDataPerRankOrPoints, getDateOfMondayWithUnderscore, formatDateForDropdown, isFutureDate } from "./utils";
import Loader from "../Components/PageComponents/Loader";
import BackButton from "../Components/Common/BackButton";
import WalletCard from "../Components/PageComponents/Leaderboard/WalletCard";
import { ARENA_ROUTE } from "../Constants/routes";
import { MenuItem, Select } from "@mui/material";
import { useMemo } from "react";
import ArenaHeader from "./Common/ArenaHeader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase-config";
import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import mixpanel from 'mixpanel-browser';
import { returnEncryptedUserId } from "../Components/utils";


const ArenaLeaderboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, getUserDetails } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [arenaTournaments, setArenaTournaments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const tournamentId = searchParams.get("tId");
  const [defaultValue, setDefaultValue] = useState(tournamentId);

  useEffect(() => {
    const func = async () => {
      //get the list of tournaments in weeklyArenaTournaments collection 
      const weeklyArenaTournamentsRef = collection(db, "weeklyArenaTournaments");
      const q = query(weeklyArenaTournamentsRef, where("isTournamentEnded", "==", true));
      const querySnapshot = await getDocs(q);
      const tournaments = [];
      querySnapshot.forEach((doc) => {
        const data = { name: `Week of ${formatDateForDropdown(doc.id)}`, id: doc.id };
        tournaments.push(data);
      });

      //now get current tournament.dont include future tournaments..
      const CurrentTournamentQuery = query(weeklyArenaTournamentsRef, where("isTournamentEnded", "==", false));
      const CurrentTournamentQuerySnapshot = await getDocs(CurrentTournamentQuery);
      CurrentTournamentQuerySnapshot.forEach((doc) => {
        const futureTournament = isFutureDate(doc.id);
        if(!futureTournament){
        const data = { name: "Current Week", id: doc.id };
        tournaments.unshift(data);
        }
      });
      //sort the tournaments based on the date.first on the year and then on the month and then on the day
      tournaments.sort((a, b) => {
        const aDate = a.id.split("_");
        const bDate = b.id.split("_");
        if (aDate[2] !== bDate[2]) {
          return bDate[2] - aDate[2];
        }
        if (aDate[1] !== bDate[1]) {
          return bDate[1] - aDate[1];
        }
        return bDate[0] - aDate[0];
      });
      setArenaTournaments(tournaments);
    }
    func();
  }, []);

  useEffect(() => {
    if (arenaTournaments.length > 0) {
      const tournament = arenaTournaments.find(t => t.id === tournamentId);
      setDefaultValue(tournament ? tournament.id : arenaTournaments[0].id);
    }
  }, [tournamentId]);


  useEffect(() => {
    setLoading(true);
    if (tournamentId) {
      const func = async () => {
        getUserDetails();
        const config = await getGameConfig(tournamentId);
        const leaderboardData = await getWeeklyArenaTournamentLeaderboard(
          tournamentId
        );
        const sortedData = sortDataPerRankOrPoints(leaderboardData, config);
        setLeaderboardData(sortedData);
        setGameConfig(config);
        setLoading(false);
      };
      func();
    }
  }, [tournamentId]);

  useEffect(() => {
    const func = async () => {
      getUserDetails();
      const mondayDate = getDateOfMondayWithUnderscore();
      const config = await getGameConfig(mondayDate);
      const leaderboardData = await getWeeklyArenaTournamentLeaderboard(
        mondayDate
      );
      const sortedData = sortDataPerRankOrPoints(leaderboardData, config);
      setLeaderboardData(sortedData);
      setGameConfig(config);
      setLoading(false);
    };
    setLoading(true);
    func();
  }, []);

  const handleWeekChange = (event) => {
    const selectedTournamentId = event.target.value;
    navigate(`/arena/leaderboard?tId=${selectedTournamentId}`);
  };

  const myPlayerData = useMemo(() => {
    if (!leaderboardData || !user) return null;
    return leaderboardData.find((obj) => obj.id === user?.id);
  }, [leaderboardData, user]);

  const goBack = () => {
    navigate(ARENA_ROUTE);
  };
  const renderPlayedAndWon = (row) => {
    return (
      <>
        <td className="text-primary-yellow text-center">
          {row.gamesPlayed}
        </td>
        <td className="text-primary-yellow text-center">
          {row.gamesWon}
        </td>
      </>
    );
  }

  console.log("leaderboardData", leaderboardData);

  const renderTable = () => {
    return (
      <div className="flex flex-col h-fit w-full max-w-3xl relative bg-white">
        <table className="table-auto overflow-auto border-collapse w-full">
          <thead className="h-9 text-sm sticky top-0">
            <tr>
              <th className="bg-primary-yellow text-black px-1">Rank</th>
              <th className="bg-primary-yellow text-black px-1">Player</th>
              <th className="bg-primary-yellow text-black px-1 w-1/6" colSpan={2}>Games</th>
              <th className="bg-primary-yellow text-black px-1">Points</th>
            </tr>
          </thead>
          <tbody className="bg-[#575757] text-white text-sm">
            <tr className="text-black sticky top-9">
              <td className="bg-primary-yellow"></td>
              <td className="bg-primary-yellow"></td>
              <td
                className="bg-primary-yellow text-xs px-1 text-center"
                style={{ borderRight: "1px solid" }}
              >
                Played
              </td>
              <td className="bg-primary-yellow text-xs px-1 text-center">
                Won
              </td>

              <td className="bg-primary-yellow"></td>
            </tr>
            {leaderboardData?.map((row, i) => {
              const key = row.firstName + row.pointsWon;
              return (
                <tr key={key} /*onClick={() => navigate(`/profile/${returnEncryptedUserId(row.id)}`)}*/>
                  <td className="text-center">{row.Rank}</td>
                  <td className="pt-2">
                    {row.firstName}
                    <div className="flex flex-col text-[11px] justify-center">
                      <span>{row.city}</span>
                    </div>
                  </td>
                  {renderPlayedAndWon(row)}
                  <td className="text-primary-yellow text-center">
                    {row.pointsWon}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderWeekSelector = () => {
    return (
      <div className="w-full bg-[#575757] mt-[-1.5rem] flex items-center justify-between gap-4 p-1.5 md:px-8">
        <div className=" flex items-center text-center text-white text-sm">
          <div className="text-white text-sm p-0">
            <Box sx={{ minWidth: 120, padding: 0 }}>
              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <Select
                  value={defaultValue}
                  onChange={handleWeekChange}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Without label' }}
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
                            fontSize : "14px"
                          }}
                >
                  {arenaTournaments.map((tournament) => (
                    <MenuItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

          </div>
        </div>
        <div className="text-white text-sm mt-0.5">
          Status:{" "}
  
          {arenaTournaments.length> 0 && arenaTournaments[0].id === tournamentId? (
          <span className="text-primary-yellow">Ongoing</span>): <span className="text-primary-yellow">Completed</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl relative bg-white">
      {<ArenaHeader
        goBack={goBack}
        headerText="Leaderboard"
        pointsWon={myPlayerData?.pointsWon ?? 0}
        gamesPlayed={myPlayerData?.gamesPlayed ?? 0}
      />}

      {loading ? (
        <div className="flex justify-center items-center h-screen w-full">
          <Loader />
        </div>
      ) : (
        <div className="h-full w-full overflow-auto space-y-4">
          {/* <WalletCard
            hideWallet={false}
            tournamentData={{
              isTournamentEnded: false,
            }}
            leaderboardData={leaderboardData}
            rank={myPlayerData?.Rank ?? 0}
          /> */}
          <div className="pt-8 space-y-4">
            {renderWeekSelector()}
            {renderTable()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArenaLeaderboard;