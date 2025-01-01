import { Dialog } from "@mui/material";

const DarkModal = ({ children, isOpen, ...rest }) => {
  return (
    <Dialog open={isOpen} className="register-success" {...rest}>
      <div className="relative flex flex-col justify-center items-center bg-primary-gradient text-white h-full overflow-hidden px-3 py-10 gap-6">
        {children}
      </div>
    </Dialog>
  );
}

export default DarkModal;