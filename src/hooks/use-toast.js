import { useCallback, useMemo, useState } from "react";
import AlertSnackbar from "../Components/Common/AlertSnackbar";

const useToast = () => {
    const [toast, setToast] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState("error");
    const [autoHideDuration, setAutoHideDuration] = useState(6000);
    
    const showToast = useCallback((message, type = "error",showDuration=6000) => {
      setIsOpen(true);
      setToast(message);
      setType(type);
      setAutoHideDuration(showDuration);
    }, []);
    
    const hideToast = useCallback(() => {
        setToast('');
        setIsOpen(false);
    }, []);

    const ToastComponent = useCallback(() => {
        return (
          <AlertSnackbar
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            toastMessage={toast}
            type={type}
            autoHideDuration={autoHideDuration}
          />
        );
    }, [isOpen, toast, type])
    
    
    return useMemo(() => ({
      toast,
      showToast,
      hideToast,
      ToastComponent,
    }), [toast, showToast, hideToast, ToastComponent]);
};

export default useToast;