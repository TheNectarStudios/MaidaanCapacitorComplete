
const HangmanKeyboard = ({ keyboardState, onClick }) => {
    // create a custom keyboard layout
    return (
      <div className="bg-[#F5F5F5] w-full py-2 px-1">
        {keyboardState.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center items-center">
            {row.map((key, index) => (
              <button
                key={index}
                className="w-[34px] h-10 border-none outline-none rounded-[6px] shadow-[0px_1px_0px_0px_rgba(0,0,0,0.25)] bg-white text-black text-center uppercase mx-[2px] my-1 active:bg-[#E5E5E5] disabled:bg-[#999999] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                disabled={key.disabled}
                onClick={() => onClick(key.key, rowIndex)}
              >
                {key.key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
};

export default HangmanKeyboard;