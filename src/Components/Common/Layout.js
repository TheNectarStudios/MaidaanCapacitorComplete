import React from 'react';
import BackButton from './BackButton';
import ArenaHeader from '../../GamesArena/Common/ArenaHeader';
import { twMerge } from 'tailwind-merge';

const Layout = ({ children, onBackClick, showHeader = false, showBack = true, headerText = '', showArenaHeader=false, layoutClassName = '' }) => {

  return (
      
      <div className={twMerge("h-full w-full relative overflow-hidden", layoutClassName)}>
        <div className="h-full w-full bg-primary-gradient absolute top-1/2 -translate-y-1/2 -z-[1]"></div>
        {/* <img
          src="/Assets/Images/vector-pattern.svg"
          alt="vector-pattern"
          className="absolute top-1/2 -translate-y-1/2 -z-[1] w-full aspect-square md:hidden"
        /> */}
        {/* <img
          src="/Assets/Images/pattern-desktop.svg"
          alt="vector-pattern"
          className="absolute top-1/2 -translate-y-1/2 -z-[1] h-full hidden md:block"
        /> */}

        <div className="flex h-full w-full items-center justify-center bg-transparent overflow-auto">
          <div className="w-full h-full max-w-3xl md:bg-[#3A3A3A] overflow-auto ">
            {showHeader && (
              <div className="text-primary-yellow text-2xl font-extrabold text-center mt-8 mb-4 mx-3 relative">
                {showBack && <BackButton onClick={onBackClick} />}
                {headerText}
              </div>
            )}
            {showArenaHeader && <ArenaHeader goBack={onBackClick} headerText={headerText} nonArenaRoute={true} showBack={showBack} />}
            {children}
          </div>
        </div>
      </div>
    );
};

export default Layout;