import React from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./Carousel.css";

const CustomDot = ({ onClick, active, index, carouselState }) => {
  return (
    <li>
      <button
        style={{
          background: active ? "#ccf900" : "grey",
          border: "none",
          padding: "4px",
          margin: "2.5px",
          borderRadius: "50%",
        }}
        onClick={() => onClick()}
      ></button>
    </li>
  );
};

export const CarouselComponent = ({
  dataLength,
  afterChange,
  children,
  itemsPerPage = 0,
}) => {
  const handleAfterChange = (previousSlide, { currentSlide }) => {
    if (afterChange) {
      afterChange(currentSlide);
    }
  };

  return (
    <Carousel
      // additionalTransfrom={0}
      arrows={dataLength > 1 ? true : false}
      afterChange={handleAfterChange}
      customDot={<CustomDot />}
      // centerMode={false}
      // className={itemsPerPage || dataLength <= 1 ? "" : "md:[&>ul]:space-x-5"}
      draggable={dataLength > 1 ? true : false}
      infinite
      minimumTouchDrag={80}
      renderDotsOutside={false}
      responsive={{
        desktop: {
          breakpoint: {
            max: 3000,
            min: 1024,
          },
          items: itemsPerPage > 0 ? itemsPerPage : dataLength > 1 ? 2 : 1,
          slidesToSlide:
            itemsPerPage > 0 ? itemsPerPage : dataLength > 1 ? 2 : 1,
        },
        mobile: {
          breakpoint: {
            max: 763,
            min: 0,
          },
          items: 1,
        },
        tablet: {
          breakpoint: {
            max: 1024,
            min: 768,
          },
          items: itemsPerPage > 0 ? itemsPerPage : dataLength > 1 ? 2 : 1,
          slidesToSlide:
            itemsPerPage > 0 ? itemsPerPage : dataLength > 1 ? 2 : 1,
        },
      }}
      rewind={false}
      rewindWithAnimation={false}
      rtl={false}
      shouldResetAutoplay
      showDots={dataLength > 1 ? true : false}
      sliderClass=""
      swipeable={dataLength > 1 ? true : false}
      partialVisbile
    >
      {children}
    </Carousel>
  );
};
