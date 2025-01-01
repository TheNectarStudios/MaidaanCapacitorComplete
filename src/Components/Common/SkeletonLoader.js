import React from 'react';
import { twMerge } from 'tailwind-merge';

const SkeletonLoader = ({ bgColor = '#e0e0e0', pulseColor = '#c6c6c6', className = '' }) => {
    const skeletonStyle = {
        backgroundColor: bgColor,
        backgroundImage: `linear-gradient(90deg, ${bgColor}, ${pulseColor}, ${bgColor})`
    };

    return (
      <div
        className={twMerge("skeleton-loader", className)}
        style={skeletonStyle}
      ></div>
    );
};

export default SkeletonLoader;