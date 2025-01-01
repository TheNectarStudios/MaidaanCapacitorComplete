import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import React from "react";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


const AlertSnackbar = ({ toastMessage, isOpen, setIsOpen, type="error",autoHideDuration=6000 }) => {
  const recieverPopup = autoHideDuration === 10000;
  if(recieverPopup) {
    return(
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={isOpen}
      onClose={() => {}}
      //if autoHideDuration is 10000, then set onclose to setIsOpen(false) else null
      //onClose={() => setIsOpen(false)}
      autoHideDuration={autoHideDuration}
      action={[]} 
      className={`!z-[99999] text-primary-yellow`}
      >
      <Alert
        //onClose={() => setIsOpen(false)}
        action={[]} 
        onClose={autoHideDuration === 6000 ? () => setIsOpen(false) : () => {}}        
        severity={type}
        sx={{ width: "100%", textAlign: "center",backgroundColor:'#ccf900', color: '#3a3a3a' }}  
        >
        {toastMessage}
      </Alert>
    </Snackbar>
    );

  }
  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      //if autoHideDuration is 10000, then set onclose to setIsOpen(false) else null

      
      //onClose={() => setIsOpen(false)}
      autoHideDuration={autoHideDuration}
      action={[]} 
      className={`!z-[99999] text-primary-yellow`}
      >
      <Alert
        //onClose={() => setIsOpen(false)}
        onClose={autoHideDuration === 6000 ? () => setIsOpen(false) : () => {}}        
        severity={type}
        sx={{ width: "100%", textAlign: "center"}}  
        className={'text-primary-yellow' }
        >
        {toastMessage}
      </Alert>
    </Snackbar>
  );
};

export default AlertSnackbar;