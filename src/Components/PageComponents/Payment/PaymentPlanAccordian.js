import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactComponent as ExpandLessIcon } from "../../../assets/icons/expand-less.svg";
import { ReactComponent as ExpandMoreIcon } from "../../../assets/icons/expand-more.svg";
import { twMerge } from "tailwind-merge";

const PaymentPlanAccordian = ({ headerComponent, children, className, isOpen = false }) => {
  const [isOpenLocal, setIsOpenLocal] = useState(false);

  useEffect(() => {
    setIsOpenLocal(!!isOpen);
  }, [isOpen]);

  const toggleOpen = () => setIsOpenLocal(val => !val);
  return (
    <motion.div
      layout
      className={twMerge(
        "text-white rounded-lg p-4 border border-solid border-[#FFFFFF4D] py-[10px] px-2",
        className
      )}
    >
      <motion.div layout onClick={toggleOpen} className="flex items-center">
        {headerComponent}
        <div className="flex flex-1"></div>{" "}
        {isOpenLocal ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </motion.div>
      <AnimatePresence>
        {isOpenLocal && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentPlanAccordian;
