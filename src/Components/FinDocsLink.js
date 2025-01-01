import React from "react"
import Box from "@mui/material/Box";

export default function FinDocsLink(){
const imageUrl = "./Assets/Images/logo-horizontal-black.svg";

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        color: "black",
        paddingTop: "20px",
        paddingBottom: "20px",
        letterSpacing: 1,
        lineHeight: 1.3,
        textAlign: "left",
      }}
    >
      <Box
        sx={{
          // marginTop: { xs: "16vh", md: "24vh" },
          paddingLeft: { xs: "0px", sm: "13vw" },
          paddingRight: { xs: "20px", sm: "15vw" },
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <img
          src="./Assets/Images/logo-horizontal-black.svg"
          alt="logo"
          className="privacy-policy-logo"
        />
        <a
          href="/"
          style={{
            color: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="privacy-policy-back-btn">Visit Website</div>
        </a>
      </Box>

      <div>
        <ul>
            <li>
                <a
                    href="https://firebasestorage.googleapis.com/v0/b/maidaan-921e1.appspot.com/o/Company_Financial_Public_Docs%2FLevel-Field_MGT-7A_Annual%20Return.pdf?alt=media&token=d11c1e9e-fd51-40ae-87ed-cf9c5c1d5d56"
                    style={{
                        color: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'left',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        padding: '10px',
                        textDecoration: 'none',
                        height: '40px', 
                    }}
                    target="_blank"
                >
                Level Field MGT 7A - Annual Return
                </a>
            </li>
        </ul>
      </div>
    </Box>
  );
};


