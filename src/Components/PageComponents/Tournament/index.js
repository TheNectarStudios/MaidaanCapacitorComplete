import { Route, Routes } from "react-router-dom";
import SelectTournamentPage from "./SelectTournament";

const TournamentPage = () => {
  return (
    <Routes>
      <Route
        path="/select"
        element={
          <SelectTournamentPage />
        }
      />
    </Routes>
  );
};

export default TournamentPage;