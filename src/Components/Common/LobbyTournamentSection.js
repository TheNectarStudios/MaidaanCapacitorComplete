import { CarouselComponent } from "../Utils/Carousel";
import AppButton from "./AppButton";

const TournamentCard = ({ children, listView=false }) => {
  return (
    <div
      className={`md:mx-[10px] ${!listView ? 'pb-5' : 'pb-[10px]'} text-xl shadow-[rgba(0,0,0,0.35)] 0px 5px 15px bg-[rgba(58,58,58,0.9)]`}    >
      {children}
    </div>
  );
};

const LobbyTournamentSection = ({
  type,
  title,
  tournaments,
  itemsPerPage = 0,
  playGame = () => {},
  redirectToLeaderboard = () => {},
  enterTournament = () => {},
  listView = false,
}) => {
  const renderCards = (type) => {
    const currentTime = Math.ceil(new Date().getTime() / 1000);
    if (type === "COMPLETED") {
      return tournaments.map((ct, idx) => (
        <TournamentCard key={`com-${idx}`}>
          <div
            className="tournament-card bg-cover bg-center"
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
            }}
          />
          <div
            style={{
              margin: "10px",
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {ct.name}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: "16px 10px 16px 10px",
            }}
          >
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => redirectToLeaderboard(ct.id)}
            >
              Leaderboard
            </AppButton>
          </div>
        </TournamentCard>
      ));
    }
    if (type === "UPCOMING") {
      return tournaments.map((ct, idx) => (
        <TournamentCard key={`up-${idx}`}>
          <div
            className="tournament-card bg-cover bg-center"
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
            }}
          />
          <div
            style={{
              margin: "20px 50px 16px 50px",
              color: "white",
              textAlign: "center",
            }}
          >
            {Math.ceil((ct.startDate.seconds - currentTime) / 86400)}{" "}
            {Math.ceil((ct.startDate.seconds - currentTime) / 86400) === 1
              ? "DAY"
              : "DAYS"}{" "}
            TO GO
          </div>
        </TournamentCard>
      ));
    }
    if (type === "WEEKLYQUIZ") {
      return tournaments.map((ct, idx) => (
        <TournamentCard key={`weekly-${idx}`}>
          <div
            className="tournament-card bg-cover bg-center"
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
            }}
          />
          <div
            style={{
              margin: "10px",
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {ct.name}
          </div>
          <div
            style={{
              margin: "10px",
              marginTop: 0,
              color: "white",
              fontSize: "16px",
            }}
          >
            ROUND: {ct.activeRound}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: "16px 10px 16px 10px",
            }}
          >
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => redirectToLeaderboard(ct.id)}
            >
              Your Stats
            </AppButton>
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => playGame(ct.id, ct.activeRound, ct.setWeeklyQuiz)}
            >
              Play Round
            </AppButton>
          </div>
        </TournamentCard>
      ));
    }
    if (type === "ONGOING") {
      return tournaments.map((ct, idx) => (
        <TournamentCard key={`ong-${idx}`}>
          <div
            className="tournament-card bg-cover bg-center"
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
            }}
          />
          <div className="md:flex md:justify-between md:px-12 md:py-4">
            <div>
              <div
                style={{
                  margin: "10px",
                  color: "white",
                  textTransform: "uppercase",
                }}
              >
                {ct.name}
              </div>
              <div
                style={{
                  margin: "10px",
                  marginTop: 0,
                  color: "white",
                  fontSize: "16px",
                }}
              >
                ROUND: {ct.activeRound}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                margin: "16px 10px 16px 10px",
              }}
            >
              <AppButton
                className="rounded-lg uppercase"
                onClick={() => enterTournament(ct)}
              >
                Enter Tournament
              </AppButton>
            </div>
          </div>
        </TournamentCard>
      ));
    }
    if (type === "PRACTICE") {
      return tournaments.map((ct, idx) => (
        <TournamentCard key={`${ct.id}-${idx}`}>
          <div
            className="tournament-card bg-cover bg-center"
            style={{
              backgroundImage: `url(${ct.tournamentBanner})`,
            }}
          />
          <div
            style={{
              margin: "10px",
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {ct.name}
          </div>
          <div
            style={{
              margin: "10px",
              marginTop: 0,
              color: "white",
              fontSize: "16px",
            }}
          >
            ROUND: {ct.activeRound}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: "16px 10px 16px 10px",
            }}
          >
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => redirectToLeaderboard(ct.id)}
            >
              Leaderboard
            </AppButton>
            <AppButton
              className="rounded-lg uppercase"
              onClick={() => playGame(ct.id, ct.activeRound)}
            >
              Play Round
            </AppButton>
          </div>
        </TournamentCard>
      ));
    }
    if (type === "QUIZES") {
      return tournaments.map((ct, idx) => (
        <div className="md:flex md:flex-col md:justify-center">
          {listView && (
            <div
              style={{
                // margin: "10px",
                color: "black",
                textTransform: "uppercase",
                margin: "32px 10px 0px 10px",
              }}
            >
              {ct.name}
            </div>
          )}
          <div>
            <TournamentCard key={`quiz-${idx}`} listView={listView}>
              <div
                className="tournament-card bg-cover bg-center"
                style={{
                  backgroundImage: `url(${ct.tournamentBanner})`,
                  marginTop: listView ? "8px" : "",
                }}
              />
              {!listView && (
                <div
                  style={{
                    // margin: "10px",
                    color: "white",
                    textTransform: "uppercase",
                    margin: "16px 10px 16px 10px",
                  }}
                >
                  {ct.name}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  margin: "16px 10px 16px 10px",
                }}
              >
                <AppButton
                  className="rounded-lg uppercase"
                  onClick={() => redirectToLeaderboard(ct.id)}
                >
                  Your Stats
                </AppButton>
                <AppButton
                  className="rounded-lg uppercase"
                  onClick={() =>
                    playGame(ct.id, ct.activeRound, false, false, ct.isQuiz)
                  }
                >
                  Play Quiz
                </AppButton>
              </div>
            </TournamentCard>
          </div>
        </div>
      ));
    }
  };

  
  return (
    <div className="md:flex md:flex-col md:justify-center mt-8 mx-[10px]">
      {!listView && (
        <h3 className="md:text-center mt-0">
          <b>{title}</b>
        </h3>
      )}
      {!listView ? (
        <div>
          <CarouselComponent
            dataLength={tournaments.length}
            itemsPerPage={itemsPerPage}
          >
            {renderCards(type)}
          </CarouselComponent>
        </div>
      ) : (
        <div>{renderCards(type)}</div>
      )}
    </div>
  );
};

export default LobbyTournamentSection;