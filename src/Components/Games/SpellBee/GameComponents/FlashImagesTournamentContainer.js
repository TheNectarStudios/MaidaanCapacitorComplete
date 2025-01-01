import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
const waitTime = 3;

const FlashImagesTournamentContainer = ({ question }) => {
  const [showImage, setShowImage] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canViewAgain, setCanViewAgain] = useState(false);
  const questionTime = question?.showTimer ?? 1.5;
  const timerRef = useRef();

  useEffect(() => {
    // clear any running timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const img = new Image();
    img.src = question?.imageUrl;

    const handleLoad = () => {
      setImageLoaded(true);
    };

    img.onload = handleLoad;
    // reset showImage to true and imageLoaded to false when question changes
    setShowImage(true);
    setImageLoaded(false);
    setCanViewAgain(false);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [question]);

  useEffect(() => {
    if (imageLoaded) {
      timerRef.current = setTimeout(() => {
        setShowImage(false);
        setCanViewAgain(false);
      }, questionTime * 1000);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [showImage, imageLoaded, questionTime]);

  const handleViewAgain = () => {
    if (!canViewAgain) return;
    setShowImage(true);
    // setImageLoaded(false);
    setCanViewAgain(false);
  };

  const handleAnimationComplete = () => {
    setCanViewAgain(true);
  };

  return (
    <div className="flex flex-col h-full w-screen justify-evenly relative">
      <div className="flex flex-col justify-center items-center">
        {showImage ? (
          imageLoaded ? (
            <img
              src={question?.imageUrl}
              alt={question?.question}
              className="object-contain w-full h-full max-h-[220px]"
            />
          ) : (
            <div className="w-[80vw] h-[220px] bg-white"></div>
          )
        ) : (
          <div className="h-[220px] grid place-items-center">
            <div
              className="w-36 h-8 bg-[#d5d5d5] rounded-[6px] overflow-hidden cursor-pointer relative"
              onClick={handleViewAgain}
            >
              <motion.div
                key="waitTime"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                exit={{ width: "100%" }}
                transition={{ duration: waitTime, ease: "linear" }}
                className="bg-primary-yellow h-full w-full text-center"
                onAnimationComplete={handleAnimationComplete}
              ></motion.div>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
                View Again
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="text-center flex justify-center items-center w-full absolute -bottom-[50px]">
        {question?.question}
      </div>
    </div>
  );
};

export default FlashImagesTournamentContainer;
