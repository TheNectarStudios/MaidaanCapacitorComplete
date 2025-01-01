import axios from "axios";
import { useEffect, useState } from "react";
import useToast from "../hooks/use-toast";

const AxiosInterceptor = ({ children }) => {
  const [isSet, setIsSet] = useState(false);
  const { ToastComponent, showToast } = useToast();

  useEffect(() => {
    const resInterceptor = (response) => {
      return response;
    };

    const errInterceptor = (error) => {
      if (error.response.status === 401) {
        window.location.href = "/login";
      }
      showToast(error.response.data.message, "error");
      return Promise.reject(error);
    };

    const interceptor = axios.interceptors.response.use(
      resInterceptor,
      errInterceptor
    );

    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers["Authorization"] = "Bearer " + token;
        }
        // config.headers['Content-Type'] = 'application/json';
        return config;
      },
      (error) => {
        Promise.reject(error);
      }
    );
    setIsSet(true);

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(interceptor)
    };
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    isSet && (
      <>
        {children}
        <ToastComponent />
      </>
    )
  );
};

export default axios;
export { AxiosInterceptor };