import React from "react";

function Reset(props) {
  return (
    <button className="Reset__button" onClick={props.resetApp}>
      Reset Board
    </button>
  );
}

export default Reset;
