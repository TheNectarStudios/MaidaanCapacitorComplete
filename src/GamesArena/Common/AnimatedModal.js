import { motion } from "framer-motion";

const modalAnimationVariants = {
  hidden: {
    x: "-100vw",
    y: "-50%",
    opacity: 0,
  },
  visible: {
    x: "-50%",
    y: "-50%",
    opacity: 1,
    transition: {
      duration: 0.1,
      type: "spring",
      damping: 25,
      stiffness: 500,
    },
  },
  exit: {
    x: "100vw",
    y: "-50%",
    opacity: 0,
  },
};

const AnimatedModal = ({ children }) => {
    return (
      <motion.div
        className="bg-primary-gray-20 p-8 px-12 text-xl flex justify-center items-center flex-col gap-8 rounded-lg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-fit shadow---[0px_0px_50px_10px_rgba(87,87,87,0.62)]"
        variants={modalAnimationVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    );
};

export default AnimatedModal;