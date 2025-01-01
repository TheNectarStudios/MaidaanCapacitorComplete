import { useEffect } from "react";

const BackgroundImageWrapper = ({ isLight, children, oppositeOnLarge = false }) => {
    useEffect(() => {
        const appElem = document.querySelector(".App");
        const isLargeScreen = window.matchMedia('(min-width: 768px)').matches;

        if (oppositeOnLarge) {
            // If `oppositeOnLarge` is true, apply opposite classes on large screens
            if (isLight) {
                if (isLargeScreen) {
                    appElem.classList.add("dark-bg");
                    appElem.classList.remove("light-bg");
                } else {
                    appElem.classList.add("light-bg");
                    appElem.classList.remove("dark-bg");
                }
            } else {
                if (isLargeScreen) {
                    appElem.classList.add("light-bg");
                    appElem.classList.remove("dark-bg");
                } else {
                    appElem.classList.add("dark-bg");
                    appElem.classList.remove("light-bg");
                }
            }
        } else {
            // Normal behavior if `oppositeOnLarge` is false
            if (isLight) {
                appElem.classList.add("light-bg");
                appElem.classList.remove("dark-bg");
            } else {
                appElem.classList.add("dark-bg");
                appElem.classList.remove("light-bg");
            }
        }
    }, [isLight, oppositeOnLarge]);

    return <>{children}</>;
};

export default BackgroundImageWrapper;
