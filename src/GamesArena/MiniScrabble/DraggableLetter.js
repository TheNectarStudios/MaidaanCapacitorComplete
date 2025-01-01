import { useEffect } from "react";
import { useDrag } from "react-dnd";

const DraggableLetter = ({
  letter,
  score = 0,
  handleAddLetter,
  handleDrop = () => {},
  filledLetters,
  clickedIndex,
}) => {
  const [{ isDragging, dropResult }, drag, dragPreview] = useDrag(() => ({
    type: "LETTER",
    item: { letter, score, clickedIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      dropResult: monitor.getDropResult(),
    }),
  }));

  useEffect(() => {
    handleDrop(dropResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropResult]);

  const isLetterFilled =
    filledLetters.findIndex(
      ({ letter: _l, clickedIndex: _cl }) =>
        _l === letter && clickedIndex === _cl
    ) > -1;

  return (
    <div ref={dragPreview}>
      <div
        className="flex bg-primary-yellow rounded-2xl text-black relative h-[70px] w-[70px] text-[32px] font-medium justify-center items-center uppercase"
        ref={drag}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={() => {
          if (isLetterFilled) return;
          handleAddLetter(letter, score, clickedIndex);
        }}
      >
        {isLetterFilled ? (
          <></>
        ) : (
          <>
            {letter}
            <div className="absolute top-1 right-2 text-[18px]">{score}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default DraggableLetter;
