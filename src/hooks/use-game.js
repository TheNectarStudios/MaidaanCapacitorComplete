import { BASE_URL, DEMO_BASE_URL } from "../Constants/Commons";

const useGame = () => {
    const initialiseGame = async (tournamentId, activeRound, userId, roundFormat, isDemoGame = false, group = undefined) => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        //myHeaders.append("Access-Control-Allow-Origin", "*");
        const body = JSON.stringify({
          childId: userId,
          playerName: userId,
          tournamentId,
          group: (isDemoGame && group) ? group : undefined,
        });

        let requestOptions = {
            method: "POST",
            headers,
            body,
        };

        const baseUrl = isDemoGame ? DEMO_BASE_URL : BASE_URL;

        const response = await fetch(`${baseUrl}/initialize`, requestOptions);
        if (response.status >= 400) {
            window.location.href = "/error";
            return;
        }
        const result = await response.text();
        console.log("game initialized");
        // const url = `/quiz/tournament?tId=${tournamentId}&rF=${roundFormat}&r=${activeRound}`;
        localStorage.setItem("gId", result);
        return true;
        // navigate(url);
    };



  return {
    initialiseGame
  };
};

export default useGame;
