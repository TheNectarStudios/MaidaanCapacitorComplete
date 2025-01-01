import React from "react";

const SnackBar = (props) => {
  React.useEffect(() => {
    setTimeout(() => {
      props.updateOpen({
        open: false,
        message: "",
        type: "",
        duration: 1500,
      });
    }, props.open.duration);
  });
  return (
    <div>
      {props.open.open && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: "40%",
            minHeight: "35px",
            zIndex: "99",
            boxShadow: "3px 3px 10px grey",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 10px 2px 10px",
            whiteSpace: "nowrap",
            color: "black",
            textAlign: "center",
            backgroundColor:
              props.open.type === "success" ? "#CCF900" : "#FF0000",
          }}
        >
          {props.open.message}
        </div>
      )}
    </div>
  );
};

export default SnackBar;
