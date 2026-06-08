import axios from "axios";
import NProgress from "nprogress";
import { toast } from "sonner";
import "nprogress/nprogress.css";
import { useGlobalLoaderStore } from "@/stores/global-loader.store";

// Configure NProgress
NProgress.configure({ showSpinner: false, minimum: 0.1 });

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  headers: {
    "Content-Type": "application/json",
  },
});

let activeRequests = 0;
let mutationRequests = 0;
let isRedirectingToLogin = false;

const isMutation = (method?: string) => {
  return ["post", "put", "patch", "delete"].includes(method?.toLowerCase() || "");
};

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (activeRequests === 0) {
      NProgress.start();
    }
    activeRequests++;

    if (isMutation(config.method)) {
      if (mutationRequests === 0) {
        useGlobalLoaderStore.getState().setIsLoading(true);
      }
      mutationRequests++;
    }

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
    
    if (isMutation(error.config?.method)) {
      mutationRequests--;
      if (mutationRequests <= 0) {
        mutationRequests = 0;
        useGlobalLoaderStore.getState().setIsLoading(false);
      }
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

    if (isMutation(response.config?.method)) {
      mutationRequests--;
      if (mutationRequests <= 0) {
        mutationRequests = 0;
        useGlobalLoaderStore.getState().setIsLoading(false);
      }
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

    if (isMutation(error.config?.method)) {
      mutationRequests--;
      if (mutationRequests <= 0) {
        mutationRequests = 0;
        useGlobalLoaderStore.getState().setIsLoading(false);
      }
    }

    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          isRedirectingToLogin = false;
          window.location.href = "/login";
        }, 1500);
      }
    } else {
      const message = error.response?.data?.message || error.message || "An unexpected error occurred.";
      
      // Don't show toast for 401s on login requests to avoid double messaging
      if (error.response?.status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
