
import { useDrop } from "react-dnd";
import { twMerge } from "tailwind-merge";

const DragToBox = ({ value, score, index, handleRemoveLetter }) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      // The type (or types) to accept - strings or symbols
      accept: "LETTER",
      drop: (item) => {
        return { ...item, index };
      },
      // Props to collect
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [index]
  );

  const removeLetter = () => {
    handleRemoveLetter(index);
  };

  return (
    <div
      className={twMerge(
        "flex bg-transparent rounded-2xl border-[5px] border-solid border-primary-yellow h-full aspect-square max-w-[70px] w-full uppercase",
        value !== 0 &&
          "text-[32px] font-medium justify-center items-center bg-primary-yellow text-black relative",
        isOver && "bg-[#94b400] border-[#94b400]"
      )}
      ref={drop}
    >
      {value === 0 ? (
        <></>
      ) : (
        <div onClick={removeLetter}>
          {value}
          <div className="absolute top-1 right-1 text-sm">{score}</div>
        </div>
      )}
    </div>
  );
};

export default DragToBox;