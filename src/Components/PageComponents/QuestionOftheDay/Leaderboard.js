import React, { useEffect, useState } from 'react'
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useAuth } from '../../../providers/auth-provider';


export const Leaderboard = ({ leaderboardData}) => {
  const [selectedSubject, setSelectedSubject] = useState("Maths");
  const { user } = useAuth();

  useEffect(() => {
    if(user){
      setSelectedLevel(user.grade?.toString());
    }
  }, [user])
  const [selectedLevel, setSelectedLevel] = useState(user?.grade ? user.grade?.toString() :"6");

  const userId = localStorage.getItem("userId");
  const handleChange = (event) => {
    setSelectedLevel(event.target.value);
  }

  const handleChangeSubject = (event) => {
    setSelectedSubject(event.target.value);
  }
  
  return (
    <div className="leaderboard">
      <div className="flex justify-between items-center">
        <div className="w-full flex justify-between items-center bg-[#3a3a3a] p-2 h-[48px] mb-4">
          <div className=" text-white text-sm md:pl-10">
            <b>Grade: </b>{" "}
            <Select
              id="t-select"
              sx={{
                height: "36px",
                color: "white",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(228, 219, 233, 0.25)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(228, 219, 233, 0.25)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(228, 219, 233, 0.25)",
                },
                ".MuiSvgIcon-root ": {
                  fill: "white !important",
                },
              }}
              value={selectedLevel}
              label="Select Round"
              onChange={handleChange}
            //input={<BootstrapInput />}
            >
              {leaderboardData && Object.keys(leaderboardData).map((level) => (
                <MenuItem value={level}>{level === "15" ? "Faculty": level}</MenuItem>
              ))}
            </Select>
          </div>

          <div className=" text-white text-sm md:pr-10">
            <b>Subject: </b>{" "}
            <Select
              id="t-select"
              sx={{
                height: "36px",
                color: "white",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(228, 219, 233, 0.25)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(228, 219, 233, 0.25)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(228, 219, 233, 0.25)",
                },
                ".MuiSvgIcon-root ": {
                  fill: "white !important",
                },
              }}
              value={selectedSubject}
              label="Select Round"
              onChange={handleChangeSubject}
            >
              {leaderboardData?.[selectedLevel] && Object.keys(leaderboardData?.[selectedLevel]).map((subject) => (
                <MenuItem value={subject}>{ subject }</MenuItem>
              ))}
            </Select>
          </div>
        </div>
        <div>

        </div>
      </div>
      <table className="table-auto overflow-auto border-collapse w-full">
        <thead className="h-9 text-sm sticky top-0">
          <tr>
            <th className="bg-primary-yellow text-black px-1">
              Rank
            </th>
            <th className="bg-primary-yellow text-black px-1">
              Name
            </th>
            <th className="bg-primary-yellow text-black px-1">
              Score
            </th>
            {/* {renderThirdColumnHeader()} */}
            <th className="bg-primary-yellow text-black px-1">
              Attempts
              {/* {render4thColumnHeader()} */}
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#575757] text-white text-sm">
          {leaderboardData?.[selectedLevel]?.[selectedSubject]
            ?.slice(0, 10)
            .map((row, i) => {
              return (
                <tr className={`${userId === row.userId ? "text-primary-yellow" : ""}`}>
                  <td className="text-center">{i + 1}</td>
                  <td
                    className={(
                      "pt-2",
                      "text-center")
                    }
                  >
                    {row.firstName}
                    {row.school ? (
                      <div className="flex flex-col text-[11px] justify-center">
                        {/* <span>Class {row.grade}</span> */}
                        <span>{row.school}</span>
                      </div>
                    ) : null}
                  </td>
                  <td className="text-center">
                    {row.score}
                  </td>
                  <td className="text-center">
                    {row.totalQuestions}
                  </td>
                </tr>
              );
            })}

          {!leaderboardData?.[selectedLevel]?.[selectedSubject]?.length && (
            <tr>
              <td colSpan={4} className="text-center">
                No one from selected grade has played selected round yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  )
}
