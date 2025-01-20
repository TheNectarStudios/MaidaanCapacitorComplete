import axios from "axios";
import { PushNotifications } from '@capacitor/push-notifications';

// Helper to show notifications
const showNotification = (title, body) => {
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  PushNotifications.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: 5,
    visibility: 1,
    sound: 'default',
  });

  PushNotifications.schedule({
    notifications: [
      {
        title: title,
        body: body,
        id: new Date().getTime(),
        schedule: { at: new Date(new Date().getTime() + 1000) },
      },
    ],
  });
};

// Add a child to a tournament and notify success/failure
export const addChildToTournament = async (childId, tournamentId, referralCode) => {
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/tournament/register-tournament`,
      { childId, tournamentId, referredBy: referralCode }
    );
    showNotification("Success!", `Child registered to tournament ${tournamentId}`);
    return data.data;
  } catch (error) {
    showNotification("Error!", `Failed to register child to tournament.`);
    throw error;
  }
};

// Register multiple tournaments and notify success/failure
export const registerMultipleTournaments = async (childId, tournamentIds) => {
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/tournament/register-multiple-tournament`,
      { childId, tournamentIds }
    );
    showNotification("Success!", `Registered for multiple tournaments.`);
    return data.data;
  } catch (error) {
    showNotification("Error!", `Failed to register for multiple tournaments.`);
    throw error;
  }
};

// Get tournaments
export const getTournaments = async (grade) => {
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/tournament/get-tournaments`,
      { grade: Number(grade) }
    );
    return data.data;
  } catch (error) {
    showNotification("Error!", `Failed to fetch tournaments.`);
    throw error;
  }
};

// Get tournaments by user
export const getTournamentsByUser = async (grade, userId, onlyUnregistered = true) => {
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/tournament/get-user-tournaments`,
      { grade: Number(grade), userId, onlyUnregistered }
    );
    return data.data;
  } catch (error) {
    showNotification("Error!", `Failed to fetch user tournaments.`);
    throw error;
  }
};

// Get tournament details
export const getTournamentDetails = async (tournamentId) => {
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/tournament/${tournamentId}`
    );
    return data.data;
  } catch (error) {
    showNotification("Error!", `Failed to fetch tournament details.`);
    throw error;
  }
};

// Clear attempts and logs
export const clearAttemptsAndLogs = async (childId, tournamentId) => {
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_NODE_BASE_URL}/tournament/clear-attempts`,
      { childId, tournamentId }
    );
    showNotification("Success!", `Attempts and logs cleared for tournament ${tournamentId}.`);
    return data.data;
  } catch (error) {
    showNotification("Error!", `Failed to clear attempts and logs.`);
    throw error;
  }
};
