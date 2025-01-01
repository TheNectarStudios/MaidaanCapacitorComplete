import axios from "axios";

export const addChildToTournament = async (childId, tournamentId, referralCode) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/tournament/register-tournament`,
    { childId, tournamentId, referredBy: referralCode }
  );
  return data.data;
};

export const registerMultipleTournaments = async (childId, tournamentIds) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/tournament/register-multiple-tournament`,
    { childId, tournamentIds }
  );
  return data.data;
};

export const getTournaments = async (grade) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/tournament/get-tournaments`,
    { grade: Number(grade) }
  );
  return data.data;
};

export const getTournamentsByUser = async (grade, userId, onlyUnregistered=true ) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/tournament/get-user-tournaments`,
    { grade: Number(grade), userId, onlyUnregistered }
  );
  return data.data;
};

export const getTournamentDetails = async (tournamentId) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/tournament/${tournamentId}`,
  );
  return data.data;
};

export const clearAttemptsAndLogs = async (childId, tournamentId) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_NODE_BASE_URL}/tournament/clear-attempts`,
    { childId, tournamentId }
  );
  return data.data;
}
