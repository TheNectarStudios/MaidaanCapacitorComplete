import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { PRIMARY_COLOR } from "../../Constants/Commons";

function FacebookCircularProgress(props) {
  return (
    <Box sx={{ position: "relative", display: "grid", placeItems: "center" }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: PRIMARY_COLOR,
        }}
        size={40}
        thickness={4}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="indeterminate"
        disableShrink
        sx={{
          color: "#3a3a3a",
          animationDuration: "550ms",
          position: "absolute",
          top: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: "round",
          },
        }}
        size={40}
        thickness={4}
        {...props}
      />
      <div className="text-center text-[#f5f5f5] mt-2">{props.message ?? "Loading"}</div>
    </Box>
  );
}

export default function Loader(props) {
  return <FacebookCircularProgress {...props} />;
}
