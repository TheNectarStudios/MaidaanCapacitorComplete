import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import * as FB from "../Firebase/FirebaseFunctions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const AttemptedWordList = (props) => {
  const [childId, setChildId] = useState("");
  const [tId, setTId] = useState("");
  const [data, setData] = useState([]);

  const handleCIDChange = (event) => {
    setChildId(event.target.value);
  };
  const handleTIDChange = (event) => {
    setTId(event.target.value);
  };

  const handleButtonClick = async () => {
    const data = await FB.getAllDocsWithQuery(`children/${childId}/games`, {
      field: "tournamentId",
      operator: "==",
      value: tId,
    });
    setData(data);
  };

  return (
    <div style={{ margin: "20px" }}>
      <TextField
        id="outlined-basic"
        label="Child ID"
        variant="outlined"
        onChange={handleCIDChange}
        style={{ margin: "10px" }}
      />
      <br />
      <TextField
        id="filled-basic"
        label="Tournament ID"
        variant="outlined"
        onChange={handleTIDChange}
        style={{ margin: "10px" }}
      />
      <br />
      <Button
        variant="contained"
        onClick={handleButtonClick}
        style={{ margin: "10px" }}
      >
        Get Data
      </Button>
      <br />
      <div>
        {data.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ROUND</TableCell>
                <TableCell>WORD</TableCell>
                <TableCell>YOUR RESPONSE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
                <React.Fragment key={`row-${item.round}`}>
                  <TableRow>
                    <TableCell rowSpan={item.attemptedWords.length + 1}>
                      {item.round}
                    </TableCell>
                  </TableRow>
                  {item.attemptedWords.map((attemptedWord) => (
                    <TableRow key={`row-${attemptedWord}`}>
                      <TableCell>{attemptedWord}</TableCell>
                    </TableRow>
                  ))}
                  {item.responses.map((res) => (
                    <TableRow key={`row-${res}`}>
                      <TableCell>{res}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </div>
    </div>
  );
};

export default AttemptedWordList;
