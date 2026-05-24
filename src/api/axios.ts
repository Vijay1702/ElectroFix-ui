import axios from "axios";
import NProgress from "nprogress";
import { toast } from "sonner";
import "nprogress/nprogress.css";

// Configure NProgress
NProgress.configure({ showSpinner: false, minimum: 0.1 });

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  headers: {
    "Content-Type": "application/json",
  },
});

let activeRequests = 0;

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (activeRequests === 0) {
      NProgress.start();
    }
    activeRequests++;

    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      NProgress.done();
    }
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0) {
      NProgress.done();
    }

    // Optional: show toast for specific successful mutations
    if (response.config.method && ["post", "put", "delete"].includes(response.config.method)) {
      // Let the specific UI handle its own toast.promise if it wants, but we could add global success here
      // However, showing success globally can be noisy if the UI already shows it.
    }

    return response;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      NProgress.done();
    }

    const message = error.response?.data?.message || error.message || "An unexpected error occurred.";
    
    // Don't show toast for 401s if you handle it elsewhere (like redirecting to login)
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
