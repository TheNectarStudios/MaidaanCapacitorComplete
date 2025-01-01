const BackButton = ({ onClick, svgIcon }) => {
    return (
      <button
        className="ml-4 pl-0 outline-none bg-none border-none bg-transparent absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
        onClick={onClick}
      >
        <img
          src={`/Assets/Icons/${svgIcon}`}
          alt="back-button"
          className="object-contain h-7 md:h-9 aspect-square"
        />
      </button>
    );
};

export default BackButton;