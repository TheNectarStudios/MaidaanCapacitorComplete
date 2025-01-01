import React, { useEffect, useState } from "react";
import Loader from "../../../PageComponents/Loader";

export const ImageJumbledContainer = ({ answered, question, isImageLoaded, setIsImageLoaded, currentImageUrl, setCurrentImageUrl } ) => {
  //const [isImageLoaded, setIsImageLoaded] = useState(false);
  //const [currentImageUrl, setCurrentImageUrl] = useState("");

  useEffect(() => {
    const quesList = JSON.parse(localStorage.getItem("currentWord")) ?? [];
    const imageList = quesList?.map(q => q.imageUrl);

    // Preload images only if the image URLs change
    if(answered === 0){    
      const preloadedImages = preloadImages(imageList); } 
      else {
        const preloadedImages = preloadImages([imageList[imageList.length - 1]]);
      }

    setIsImageLoaded(false);
    // Set current image URL to the question's image URL
    if(setCurrentImageUrl){
      setCurrentImageUrl(question?.imageUrl);
    }
  }, [question?.imageUrl]);

  const onImageLoadSuccess = (ques) => {
    if (ques.imageUrl === currentImageUrl) {
      setIsImageLoaded(true);
    }} 

  const preloadImages = (urls) => { 
    const images = [];
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
      images.push(img);
    });
    console.log(images);
    return images;
  };

  return (
    <div
      style={{
        maxWidth: "94vw",
        borderRadius: "16px",
        padding: "4px",
        margin: 0,
        backgroundColor: "white",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        gap: "8px",
      }}
    >
      <img
        src={currentImageUrl}
        // height="160px"
        width="auto"
        alt={question.question}
        onLoad={() => onImageLoadSuccess(question)}
        className="transition-opacity ease-in-out h-[160px] w-auto md:h-[300px]"
        style={{ objectFit: "contain", opacity: isImageLoaded ? 1 : 0 }}
      />
      <div
        className="mt-2"
        style={{
          padding: "6px 12px",
        }}
      >
        <span className="absolute left-[20px] mt-0.5">
          <b>Unjumble</b>
        </span>
        <span className="text-xl uppercase">{question?.jumbledWord}</span>
      </div>
    </div>
  );
};
