import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { collection, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import { useAuth } from "../../providers/auth-provider";
import AppButton from "../../Components/Common/AppButton";
import { ReactComponent as ExpandIcon } from "../../assets/icons/expand.svg"
import { ReactComponent as SendIcon } from "../../assets/icons/send.svg"
import { DisplaySettings } from "@mui/icons-material";

const Chat = ({ gameState, otherPlayerId, handleShowReaction }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isTypeClick, setIsTypeClick] = useState(false);
  const [chatState, setChatState] = useState({});
  const [allMessages, setAllMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("New message");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const { chatId } = gameState;

  useEffect(() => {
    if (!isTypeClick) return;
    setTimeout(() => {
      setShowMessages(true);
    }, 300);
  }, [allMessages, isTypeClick]);

  useEffect(() => {
    if (showMessages) {
      if (!containerRef.current) return;
      // scroll to the bottom of the chat
      const chatContainer = containerRef.current;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [showMessages]);

  useEffect(() => {
    if (isNewMessage) {
      if(isUserSender(allMessages?.[allMessages?.length - 1])){
        setPopupMessage("Message Sent!");
      }
      else {
        setPopupMessage("New message!");
      }
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
        setIsNewMessage(false);
      }, 2000); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewMessage]);

  const fetchMessages = async (messages) => {
    // fetch messages from the firebase messages collection
    // and set them in the state
    const memoryCardsCollection = collection(db, "messages");
    const messagesSnapshot = await Promise.all(
      messages.map(async (messageId) => {
        const messageRef = doc(memoryCardsCollection, messageId);
        const data = await getDoc(messageRef);
        return { id: messageId, ...data.data() };
      })
    );
    const reactionMessage = messagesSnapshot.find(
      (message) => message.showReaction
    );
    if (reactionMessage && reactionMessage?.sender !== user.id) {
      handleShowReaction(reactionMessage);
      setTimeout(() => {
        handleShowReaction(null);
        // update reaction message to not show reaction
        const messageRef = doc(memoryCardsCollection, reactionMessage.id);
        setDoc(messageRef, { showReaction: false }, { merge: true });
      }, 2000);
    }
    setAllMessages([...allMessages, ...messagesSnapshot]);

    const newMessages = messagesSnapshot.filter(
      (message) => !allMessages.find((existingMessage) => existingMessage.id === message.id)
    );
    if (newMessages.length > 0) {
      setIsNewMessage(true);
    }
  };

  useEffect(() => {
    // add a listener to the document with the gameId
    // if the document changes, we want to update the board
    if (!chatId) return;
    const memoryCardsCollection = collection(db, "chats");
    const unsubscribe = onSnapshot(
      doc(memoryCardsCollection, chatId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();

          setChatState(data);
          if (data?.messages.length !== allMessages.length) {
            // get messages that are not in allMessages
            const newMessages = data.messages.filter(
              (messageId) =>
                !allMessages.find((message) => message.id === messageId)
            );
            fetchMessages(newMessages);
          }
        }
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const handleTypeClick = () => {
    setIsTypeClick(true);
  };
  const handleClose = () => {
    setIsTypeClick(false);
    setShowMessages(false);
  };

  const isUserSender = (message) => {
    return message?.sender === user?.id;
  };

  const isMessageDisabled = () => {
    const trimmedMessage = message.trim();
    return !trimmedMessage;
  };

  const sendMessage = async (msg = "", showReaction = false) => {
    inputRef?.current?.focus();
    let trimmedMessage = msg.trim();
    if (isMessageDisabled() && !trimmedMessage) return;
    if (!trimmedMessage) {
      trimmedMessage = message.trim();
    }
    const memoryCardsCollection = collection(db, "messages");
    const messageRef = doc(memoryCardsCollection);
    const messageId = messageRef.id;
    const newMessage = {
      id: messageId,
      sender: user.id,
      text: trimmedMessage,
      createdAt: new Date(),
      image: "",
      showReaction,
    };
    const newMessages = [...allMessages, newMessage];
    setAllMessages(newMessages);
    // add this message id to the messages array in the chat document
    delete newMessage.id;
    const chatRef = doc(collection(db, "chats"), chatId);
    await setDoc(messageRef, newMessage);
    await setDoc(
      chatRef,
      { messages: [...chatState.messages, messageId] },
      { merge: true }
    );
    setMessage("");
  };

  function getCaret() {
    const el = inputRef.current;
    if (el.selectionStart) {
      return el.selectionStart;
    } else if (document.selection) {
      el.focus();
      var r = document.selection.createRange();
      if (r == null) {
        return 0;
      }
      var re = el.createTextRange(),
        rc = re.duplicate();
      re.moveToBookmark(r.getBookmark());
      rc.setEndPoint("EndToStart", re);
      return rc.text.length;
    }
    return 0;
  }

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      let msg = e.target.value;
      var content = msg;
      var caret = getCaret();
      if (e.shiftKey) {
        msg =
          content.substring(0, caret - 1) +
          "\n" +
          content.substring(caret, content.length);
        e.stopPropagation();
        setMessage(msg);
      } else {
        msg =
          content.substring(0, caret - 1) +
          content.substring(caret, content.length);
        sendMessage();
      }
    }
  };

  const renderPopupMessage = () => {
    if (
      isPopupVisible &&
      ((allMessages?.[allMessages?.length - 1]?.showReaction &&
        isUserSender(allMessages?.[allMessages?.length - 1])) ||
        (!allMessages?.[allMessages?.length - 1]?.showReaction &&
          !isUserSender(allMessages?.[allMessages?.length - 1])))
    ) {
      return (
        <div className="flex justify-center items-center bg-primary-yellow text-primary-gray-20 rounded-md w-fit p-4 shadow-lg absolute top-5 left-1/2 -translate-x-1/2">
          {popupMessage}
        </div>
      );
    }
    return <></>;
    // return (
    //   <>
    //     {isPopupVisible &&
    //       allMessages?.[allMessages?.length - 1]?.showReaction &&
    //       isUserSender(allMessages?.[allMessages?.length - 1]) && (
    //         <div
    //           className="flex justify-center items-center bg-primary-yellow"
    //           style={{
    //             color: "#3a3a3a",
    //             padding: "10px",
    //             borderRadius: "5px",
    //             margin: "10px",
    //             height: "40px",
    //           }}
    //         >
    //           {" "}
    //           <p>{popupMessage}</p>
    //         </div>
    //       )}
    //     {isPopupVisible &&
    //       !allMessages?.[allMessages?.length - 1]?.showReaction &&
    //       !isUserSender(allMessages?.[allMessages?.length - 1]) && (
    //         <div
    //           className="flex justify-center items-center bg-primary-yellow"
    //           style={{
    //             color: "#3a3a3a",
    //             padding: "10px",
    //             borderRadius: "5px",
    //             margin: "10px",
    //             height: "40px",
    //           }}
    //         >
    //           <p>{popupMessage}</p>
    //         </div>
    //       )}
    //   </>
    // );
  };
  const renderCondition = () => {
    if(!gameState.winner) return true;
    else if(gameState.winner && !isTypeClick) return false;
    else if(gameState.winner && isTypeClick) return true;
  } 

  const renderScreen = () => {

    if(gameState.winner && !isTypeClick){
      return (
        <div className="flex justify-between h-full p-4">
          <div className="flex-1 text-primary-yellow">
            <div>Chat with {gameState?.[otherPlayerId]?.name}</div>
            <div className="flex justify-evenly items-center h-full">
              <div
                className="rounded-full max-xs:text-3xl text-5xl"
                onClick={() => sendMessage("🔥", true)}
              >
                🔥
              </div>
              <div
                className="rounded-full max-xs:text-3xl text-5xl"
                onClick={() => sendMessage("💪🏻", true)}
              >
                💪🏻
              </div>
              <div
                className="rounded-full max-xs:text-3xl text-5xl"
                onClick={() => sendMessage("💩", true)}
              >
                💩
              </div>
            </div>
          </div>
          <div onClick={handleTypeClick}>
            <ExpandIcon className="w-4 h-4" />
          </div>
        </div>
        
      );

    }
    else if (!isTypeClick ) {
      return (
        <div className="flex justify-between h-full p-4">
          <div className="flex-1 text-primary-yellow">
            <div>Chat with {gameState?.[otherPlayerId]?.name}</div>
            <div className="flex justify-evenly items-center h-full">
              <div
                className="rounded-full max-xs:text-3xl text-5xl"
                onClick={() => sendMessage("🔥", true)}
              >
                🔥
              </div>
              <div
                className="rounded-full max-xs:text-3xl text-5xl"
                onClick={() => sendMessage("💪🏻", true)}
              >
                💪🏻
              </div>
              <div
                className="rounded-full max-xs:text-3xl text-5xl"
                onClick={() => sendMessage("💩", true)}
              >
                💩
              </div>
            </div>
          </div>
          <div onClick={handleTypeClick}>
            <ExpandIcon className="w-4 h-4" />
          </div>
        </div>
      );
    }
    else if (isTypeClick && showMessages) {
      return (
        <>
          <div onClick={handleClose} className="flex w-full justify-end p-4">
            <ExpandIcon className="w-4 h-4" />
          </div>
          <div
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
            ref={containerRef}
          >
            <div className="flex-1"></div>
            {allMessages.map((message) => {
              return (
                <div
                  key={message.id}
                  className={twMerge(
                    "flex",
                    isUserSender(message) ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={twMerge(
                      "w-fit px-4 py-2 rounded-2xl whitespace-pre-wrap break-words max-w-[80%]",
                      isUserSender(message)
                        ? "bg-primary-yellow text-primary-gray-20 self-end"
                        : "bg-primary-gray-10 self-start"
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }
  };

  return (
    <div
      className={twMerge(
        "absolute bottom-0 left-1/2 -translate-x-1/2 bg-primary-gradient text-white transition-all rounded-t-lg border border-solid border-primary-yellow border-b-0 overflow-auto z-2",
        isTypeClick
          ? "max-xs:h-[calc(70%-44px)] h-[calc(70%-44px)] w-full"
          : gameState.winner ? "h-[16%] w-[95%]" :"h-[22%] w-[95%]"
      )}
    >
      <div className="flex flex-col h-full w-full relative overflow-auto">
        {!showMessages && !gameState.winner && <div className="flex-1"></div>}
        {renderScreen()}
        {renderCondition() && <div
          onClick={handleTypeClick}
          className="flex items-center px-4 py-2 gap-2 relative"
        >
          {!isTypeClick && (
            <div className="absolute w-full h-full bg-transparent z-10 inset-0"></div>
          )}
          {(isTypeClick || allMessages?.length === 0) ? (
          <textarea
            value={
              !isTypeClick ? allMessages?.[allMessages?.length - 1]?.text : message
            }
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Start typing..."
            autoComplete="off"
            onKeyUp={handleEnterKey}
            ref={inputRef}
            className={twMerge(
              "resize-none w-full h-[42px] rounded-lg outline-none border-solid border border-primary-yellow md:text-lg font-[inherit] p-2 bg-transparent text-primary-yellow placeholder-primary-yellow placeholder-opacity-50",
              !isTypeClick && ""
            )}
            style={{ fontSize: "inherit" }}
            disabled={!isTypeClick}
          />
          ) : (
            <div
             key={allMessages?.[allMessages?.length - 1].id}
              className={twMerge(
                "flex justify-between gap-2 w-full self-center",
              )}
            >
            <div
              className={twMerge(
                "w-fit px-4 py-2 rounded-2xl whitespace-pre-wrap max-w-[50%] overflow-hidden truncate h-[42px]",
                isUserSender(allMessages?.[allMessages?.length - 1])
                  ? "bg-primary-yellow text-primary-gray-20 self-center"
                  : "bg-primary-gray-10 self-center"
                )}
              >
                {allMessages?.[allMessages?.length - 1].text}
              </div>
              <div className="flex">
                <textarea
                  //onChange={(e) => setMessage(e.target.value)}
                  placeholder={isUserSender(allMessages?.[allMessages?.length - 1])? "Start typing..." : "Reply..."}
                  className={twMerge(
                    "resize-none w-full h-[42px] rounded-lg outline-none border-solid border border-primary-yellow md:text-lg font-[inherit] p-2 bg-transparent text-primary-yellow placeholder-primary-yellow placeholder-opacity-50",
                    !isTypeClick && ""
                  )}
                  style={{ fontSize: "inherit" }}
                  disabled={!isTypeClick}
                />
                </div>
            </div>
          )}
          {isTypeClick? (<div className="w-fit">
            <SendIcon className="w-7 h-7" onClick={() => sendMessage()} />
          </div>):null}
        </div>}
        {renderPopupMessage()}
      </div>
    </div>
  );
};

export default Chat;
