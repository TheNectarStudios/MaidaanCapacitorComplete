import * as React from "react";
import Dialog from "@mui/material/Dialog";
import CancelIcon from "@mui/icons-material/Cancel";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import "./styles.css";
import { toBlob } from "html-to-image";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { REGISTER_URL } from "../../../../Constants/Commons";
import { MEASURE } from "../../../../instrumentation";
import { INSTRUMENTATION_TYPES } from "../../../../instrumentation/types";

const primaryColor = "#CBF600";

const ColorButton = styled(Button)(({ theme }) => ({
  color: "black",
  borderRadius: "30px",
  maxWidth: "250px",
  backgroundColor: primaryColor,
  fontSize: "14px",
  "&:hover": {
    backgroundColor: primaryColor,
  },
  fontFamily: "avenir",
}));

function Popup(props) {
  const { message, clickCta, handleClose } = props;
  return (
    <>
      {message.closeBtn && (
        <CancelIcon
          onClick={handleClose}
          style={{
            fontSize: "33px",
            color: "#CCF900",
            position: "absolute",
            right: "3%",
            top: "3%",
            zIndex: "100",
          }}
        />
      )}
      <div
        style={{
          color: "white",
          margin: "30px 0px",
          fontSize: "17px",
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        {message.message}
        {(message.type === 'prompt') &&
          (message.scoreType && message.scoreType.includes("AccuracyBoost")) &&
          <div class="mx-auto max-w-lg">
            <p class="text-center text-base mb-0">
              Check out the scoring system for the round on the next screen
            </p>
          </div>
        }
      </div>
      <div style={{ color: "white", fontSize: "15px", fontWeight: "400", textAlign: "center" }}>
        {message.title}
      </div>
      {message.list && message.list.length > 0 && (
        <ul
          style={{
            color: "white",
            fontSize: "15px",
            padding: "0 15px",
            fontWeight: "400",
          }}
        >
          {message.list.map((item, i) => {
            return (
              <li style={{ color: "white" }} key={i}>
                {item}
              </li>
            );
          })}
        </ul>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "10px",
          textTransform: "none",
        }}
      >
        {message.buttonMessage &&
          message.buttonMessage.map((butn, i) => {
            return (
              <Button
                key={i}
                className={`mainButton startTrail ${message.type}`}
                onClick={() => clickCta(message.cta[i])}
              >
                {butn}
              </Button>
            );
          })}
      </div>
    </>
  );
}
function ScoreCard(props) {
  const [wrapScreen, updateWrapScreen] = React.useState(true);
  const { message, clickCta, handleClose, scoreData, tournamentId, isWeeklyQuiz, isQuiz, memoryCardsFormat = false, backUrl, roundNumber } = props;
  console.log("message", message);
  const imageRef = React.useRef(null);
  var newFile;

  React.useEffect(() => {
    newFile = toBlob(imageRef.current);
  }, [imageRef]);
  React.useEffect(() => {
    setTimeout(() => {
      updateWrapScreen(false);
    }, 2000);
  });
  const shareOnWhatsapp = async () => {
    const data = {
      files: [
        new File([newFile], "Maidaan.png", {
          type: newFile.type,
        }),
      ],
      title: "This is the title",
      text: `Pavan Scored ${message.scoreData.currentGameScore} points over spellbee, You can challenge him here: https://maidaan.app`,
    };

    try {
      if (!navigator.canShare(data)) {
        window.alert("can't share over whatsapp");
      }
      await navigator.share(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewLeaderboard = () => {
    MEASURE(
      message.isDemoGame
        ? INSTRUMENTATION_TYPES.POST_DEMO_GAME_LEADERBOARD_BUTTON_CLICKED
        : INSTRUMENTATION_TYPES.POST_GAME_LEADERBOARD_BUTTON_CLICKED,
      localStorage.getItem("userId"),
      { tournamentId }
    );

    let url = `/leaderboard?tId=${tournamentId}`;
    if (backUrl) {
      url += `&back=${backUrl}`;
    }
    if (message.isDemoGame) {
      url += `&d=Y&gId=${message.demoGameId}`;
      if (message.group) {
        url += `&group=${message.group}`;
      }
    } else if (!message.isQuiz && !message.isWeeklyQuiz) {
      // url += "&ch=1";
      url += `&ch=1&round=${roundNumber}`;
    }

    if (message.isDemoFlow) {
      if (!backUrl) {
        url += `&back=pop-quiz-lobby`;
      }
      url += `&d=S`;
    }


    window.location.href = url;
  };

  const handleGoToLobby = () => {
    handleClose();
    let url = "/lobby";
    if (message.isDemoGame) {
      url += `?d=Y`;
      if (message.group) {
        url += `&group=${message.group}`;
      }
    }
    else if (message.isDemoFlow) {
      url = `/lobby-demo?d=S`
    }
    window.location.href = url;
  }

  return (
    <div ref={imageRef}>
      {wrapScreen ? (
        <div
          style={{
            width: "100%",
            height: "40vh",
            backgroundColor: "#CCF900",
            color: "#7F7F7F",
            fontSize: "calc(2vw + 30px)",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontStyle: "italic",
          }}
        >
          That’s a<br />
          Wrap!
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              flexDirection: "row-reverse",
              padding: "0 5px",
              height: "42px",
            }}
          >
            <div
              className="popupMessage"
              style={{
                color: "white",
                fontSize: "calc(0.6vw + 14px)",
                textAlign: "center",
                position: "absolute",
                width: "calc(100% - 10px)",
              }}
            >
              {message.message}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#F8F6F6",
              padding: "20px 20px 5px 20px",
            }}
          >
            <div style={{ display: "flex", gap: "calc(1vw + 19px)" }}>
              <div
                style={{
                  width: "50%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "17px",
                }}
              >
                {message.headersConfig?.[0]}
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    boxShadow: "-7px -5px 0px #ccf900",
                    borderRadius: "10px",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      lineHeight: "100%",
                      width: "100%",
                      justifyContent: "flex-start",
                      alignItems: "flex-end",
                      margin: "10px 0",
                      gap: "calc(0.25vw + 2px)",
                      padding: "10px 12px",
                      fontSize: "14px",
                    }}
                  >
                    <span
                      style={{
                        lineHeight: "39px",
                        fontSize: "calc(1vw + 40px)",
                      }}
                    >
                      {Math.floor(message.scoreData?.[0])}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "30px",
                margin: "20px 0",
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "calc(0.6vw + 8px)",
                }}
              >
                {message.headersConfig?.[1]}

                <div
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    boxShadow: "-7px -5px 0px #ccf900",
                    borderRadius: "10px",
                    fontSize: "12px",
                    padding: "7px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      lineHeight: "100%",
                      width: "100%",
                      justifyContent: "flex-start",
                      alignItems: "flex-end",
                      margin: "10px 0",
                      gap: "6%",
                      fontSize: "calc(0.6vw + 7px)",
                    }}
                  >
                    <span style={{ lineHeight: "80%", fontSize: "25px" }}>
                      {Math.floor(message.scoreData?.[1])}
                    </span>
                  </div>
                </div>
              </div>
              {(!message.scoreType ||
                !message.scoreType.includes("AccuracyBoost")) && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      fontSize: "calc(0.6vw + 8px)",
                    }}
                  >

                    {message.headersConfig?.[2]}

                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        boxShadow: "-7px -5px 0px #ccf900",
                        borderRadius: "10px",
                        fontSize: "12px",
                        padding: "7px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          lineHeight: "100%",
                          width: "100%",
                          justifyContent: "flex-start",
                          alignItems: "flex-end",
                          margin: "10px 0",
                          gap: "6%",
                          fontSize: "calc(0.6vw + 7px)",
                        }}
                      >
                        <span style={{ lineHeight: "80%", fontSize: "25px" }}>
                          {Math.floor(message.scoreData?.[2])}
                        </span>
                        {memoryCardsFormat ? "" : "secs/question"}
                      </div>
                    </div>
                  </div>
                )}
              {message.scoreType &&
                message.scoreType.includes("AccuracyBoost") && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      fontSize: "calc(0.6vw + 8px)",
                    }}
                  >
                    {message.headersConfig?.[2]}

                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        boxShadow: "-7px -5px 0px #ccf900",
                        borderRadius: "10px",
                        fontSize: "12px",
                        padding: "7px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          lineHeight: "100%",
                          width: "100%",
                          justifyContent: "flex-start",
                          alignItems: "flex-end",
                          margin: "10px 0",
                          gap: "6%",
                          fontSize: "calc(0.6vw + 7px)",
                        }}
                      >
                        <span style={{ lineHeight: "80%", fontSize: "25px" }}>
                          {Math.floor(message.scoreData?.[2])}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "calc(0.6vw + 8px)",
                }}
              >
                {message.headersConfig?.[3]}

                <div
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    boxShadow: "-7px -5px 0px #ccf900",
                    borderRadius: "10px",
                    fontSize: "12px",
                    padding: "7px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      lineHeight: "100%",
                      width: "100%",
                      justifyContent: "flex-start",
                      alignItems: "flex-end",
                      margin: "10px 0",
                      gap: "6%",
                      fontSize: "calc(0.6vw + 7px)",
                    }}
                  >
                    <span style={{ lineHeight: "80%", fontSize: "25px" }}>
                      {Math.floor(message.scoreData?.[3])}
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "calc(0.6vw + 8px)",
                }}
              >
                {message.headersConfig?.[4]}
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    boxShadow: "-7px -5px 0px #ccf900",
                    borderRadius: "10px",
                    fontSize: "calc(0.6vw + 7px)",
                    padding: "7px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      lineHeight: "100%",
                      width: "100%",
                      justifyContent: "flex-start",
                      alignItems: "flex-end",
                      margin: "10px 0",
                      gap: "6%",
                    }}
                  >
                    <span style={{ lineHeight: "80%", fontSize: "25px" }}>
                      {Math.floor(message.scoreData?.[4])}

                      {!memoryCardsFormat && (
                        <span style={{ fontSize: "18px", margin: "0 0 0 5px" }}>
                          %
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* <div
              style={{
                display: "flex",
                gap: "20px",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: "87%",
                  backgroundColor: "#7F7F7F",
                  position: "relative",
                  height: "37px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "calc(1vw + 50px)",
                    height: "calc(1vw + 50px)",
                    fontSize: "calc(1vw + 13px)",
                    color: "black",
                    backgroundColor: "#ccf900",
                    transform: "translate(-70%, -50%)",
                    position: "absolute",
                    top: "50%",
                    left: "0",
                    borderRadius: "100px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {message.scoreData.totalWordsSpent}
                </div>
                <div
                  style={{
                    color: "#CCF900",
                    fontSize: "calc(0.6vw + 7px)",
                    padding: "0 8px 0 0",
                    margin: "0px 0px 0px calc(1vw + 16px)",
                    fontWeight: "400",
                  }}
                >
                  Total words spelt on Maidaan till date
                </div>
              </div>
            </div> */}
            <div style={{ margin: "20px 0 0 0", width: "100%" }}>
              <div
                style={{
                  width: "100%",
                  minHeight: "40px",
                  position: "relative",
                  borderRadius: "10px",
                  display: "flex",
                  gap: "calc(1vw + 15px)",
                  justifyContent: "center",
                  textAlign: "center",
                  alignItems: "center",
                  margin: "10px 0 0 0",
                }}
              >
                {/* <div>
                  <img
                    src="/Assets/Icons/LightBulb.svg"
                    style={{ width: "16px", height: "auto" }}
                  />
                </div> */}
                <div
                  style={{
                    color: "black",
                    fontSize: "calc(0.6vw + 12px)",
                    // fontStyle: "italic",
                  }}
                >
                  Thanks for playing, we hope you had fun!
                </div>
              </div>
            </div>
          </div>
          <div
            id="asdfdafadsf"
            style={{
              fontSize: "12px",
              margin: "15px 0",
              display: "flex",
              justifyContent: message.isDemoGame ? "space-around" : "center",
              fontWeight: "400",
              textAlign: "left",
              padding: "0 20px",
            }}
          >
            {/* {message.isDemoGame ? (
              <ColorButton
                onClick={() => {
                  window.location.href = REGISTER_URL;
                }}
                variant="contained"
              >
                Register
              </ColorButton>
            ) : null} */}
            <ColorButton
              onClick={handleViewLeaderboard}
              variant="contained"
              className="animate__animated animate__pulse animate__infinite infinite"
            >
              {isWeeklyQuiz ? "Review Answers" : "Go to Leaderboard"}
            </ColorButton>

            {/* <span
              style={{
                fontWeight: "700",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Note:&nbsp;
            </span>
            <div
              onClick={() => {
                window.location.href = "/leaderboard";
              }}
            >
              View Leaderboard
            </div> */}
          </div>
        </>
      )}
    </div>
  );
}



function SimpleDialog(props) {
  const { open, message, cb, memoryCardsFormat, backUrl } = props;
  const imageRef = React.useRef(null);

  const clickCta = (cbFn) => {
    handleClose();
    cbFn();
  };
  const handleClose = () => {
    cb();
    message.closeAction && message.closeAction();
  };

  return (
    <>
      {message && (
        <Dialog
          open={open}
          className={message.type}
          style={{
            backgroundColor: "#d9d9d980",
            color: "white",
            fontWeight: "600",
          }}
        >
          {message.type !== "scoreCard" && (
            <Popup clickCta={clickCta} handleClose={handleClose} {...props} />
          )}
          {message.type === "scoreCard" && (
            <ScoreCard
              ref={imageRef}
              clickCta={clickCta}
              handleClose={handleClose}
              {...props}
              tournamentId={message.tournamentId}
              isWeeklyQuiz={message.isWeeklyQuiz}
              roundNumber={message.roundNumber}
            />
          )}
        </Dialog>
      )}
    </>
  );
}

export default SimpleDialog;
