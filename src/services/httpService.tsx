import axios from 'axios';
import Swal from 'sweetalert2';

// Constants for local storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const DEFAULT_LOGIN_PATH = '/auth'; 
const EMPLOYEE_LOGIN_PATH_PREFIX = '/emp'; 

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Defined Error Codes from Backend ---
const ERROR_CODE_AI_ACCESS_DENIED = "AI_ACCESS_DENIED";
const ERROR_CODE_AI_PLAN_RESTRICTION = "AI_PLAN_RESTRICTION";
const ERROR_CODE_INSUFFICIENT_CREDITS = "INSUFFICIENT_AI_CREDITS";
const ERROR_CODE_INSUFFICIENT_CREDITS_VIEW = "INSUFFICIENT_AI_CREDITS_VIEW"; 
const ERROR_CODE_AI_ACCESS_DENIED_VIEW = "AI_ACCESS_DENIED_VIEW";


// --- Confirm Authentication Locally ---
export const confirmAuthentication = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) !== null && localStorage.getItem(REFRESH_TOKEN_KEY) !== null;
}

// --- Redirection Logic ---
let redirectCallback: any;
export const setRedirectCallback = (callback: any) => {
  redirectCallback = callback;
};

const handleRedirectToLogin = () => {
  const userRole = localStorage.getItem('user_role');
  const userId = localStorage.getItem('user_id');
  if (redirectCallback) {
    const path = (userRole === "employee" && userId) ? `${EMPLOYEE_LOGIN_PATH_PREFIX}/${userId}/auth` : DEFAULT_LOGIN_PATH;
    redirectCallback(path);
  } else {
    console.error('Redirect callback not set! Using window.location.href as a fallback.');
    window.location.href = (userRole === "employee" && userId) ? `${EMPLOYEE_LOGIN_PATH_PREFIX}/${userId}/auth` : DEFAULT_LOGIN_PATH;
  }
};

// --- Axios Instance Creation ---
const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
});

const axiosRefreshInstance = axios.create({
  baseURL: BASE_API_URL,
});

// --- SweetAlert Helper for Login Prompt ---
const showLoginRequiredAlert = async (title: string, text: string) => {
  const result = await Swal.fire({
    title: title, text: text, icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Login', cancelButtonText: 'Cancel',
    confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
    customClass: { confirmButton: 'swal-confirm-button', cancelButton: 'swal-cancel-button' },
    allowOutsideClick: false,
  });
  if (result.isConfirmed) handleRedirectToLogin();
  return result.isConfirmed;
};

// --- Request Interceptor ---
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // No need to explicitly check for public endpoints here if 401 handles it
    return config;
  },
  (error) => {
    console.error('Axios request config error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
let isRefreshing = false;
let failedQueue: any[] = [];
let refreshTokenRetries = 0;
const MAX_REFRESH_RETRIES = 1;

const processQueue = (error: any, token: any = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error('Network Error or no response received:', error);
      // Consider a less intrusive way to notify network errors if they are frequent,
      // or let specific components handle retries. For now, a Swal is okay.
      // await Swal.fire({
      //     title: "Network Error",
      //     text: "Could not connect to the server. Please check your internet connection.",
      //     icon: "error",
      //     confirmButtonText: "OK"
      // });
      console.error(error);
      return Promise.reject(error);
    }

    const status = error.response.status;
    const responseData = error.response.data; // This is your JSON body from backend

    if (status === 401) {
      if (originalRequest.url?.includes('/auth/login/refresh/')) {
        console.error("Refresh token itself is invalid or expired. Redirecting to login.");
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        // Clear other user-specific items from localStorage
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id'); // Assuming you store this
        isRefreshing = false;
        processQueue(error, null);
        await showLoginRequiredAlert("Session Expired", "Your session has completely expired. Please log in again.");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => failedQueue.push({ resolve, reject }));
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        } catch (queueError) { return Promise.reject(queueError); }
      }

      if (refreshTokenRetries < MAX_REFRESH_RETRIES) {
        originalRequest._retry = true;
        isRefreshing = true;
        refreshTokenRetries++;
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          isRefreshing = false;
          processQueue(new Error('Refresh token not found.'), null);
          await showLoginRequiredAlert("Session Error", "Cannot refresh session. Please log in.");
          return Promise.reject(new Error('Refresh token not found.'));
        }

        try {
          const refreshResponse = await axiosRefreshInstance.post('/auth/login/refresh/', { refresh: refreshToken });
          const newAccessToken = refreshResponse.data.access;
          if (!newAccessToken) throw new Error('New access token not received.');

          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
          // No need to set axiosInstance.defaults.headers.common here if request interceptor handles it
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          refreshTokenRetries = 0; // Reset retries on successful refresh
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } catch (refreshError: unknown) {
          console.error('Token refresh failed:', (refreshError as any).response?.data || (refreshError as any).message);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_id');
          processQueue(refreshError, null);
          isRefreshing = false;
          await showLoginRequiredAlert("Session Expired", "Could not refresh your session. Please log in again.");
          return Promise.reject(refreshError);
        }
      } else {
        console.error(`Token refresh failed after ${refreshTokenRetries} attempts.`);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        isRefreshing = false;
        processQueue(error, null);
        await showLoginRequiredAlert("Session Expired", "Failed to refresh session. Please log in again.");
        return Promise.reject(error);
      }
    } else if (status === 403) {
      console.warn('403 Forbidden Error encountered. Response data:', responseData);
      const errorCode = responseData?.error_code; // Get your custom error code

      if (errorCode === ERROR_CODE_INSUFFICIENT_CREDITS || errorCode === ERROR_CODE_INSUFFICIENT_CREDITS_VIEW) {
        // Trigger the custom event to show the "Purchase Credits" modal
        const insufficientCreditsEvent = new CustomEvent('showPurchaseCreditsModal', {
          detail: {
            // Pass relevant data from the error response to the modal
            message: responseData.message || "You have insufficient AI credits for this action.",
            currentBalance: responseData.detail?.personal_balance || responseData?.personal_balance || 0,
            requiredCredits: responseData.detail?.required_credits || responseData?.required_credits,
            // Add more data
          }
        });
        console.log("Dispatching insufficient credits event:", insufficientCreditsEvent);
        window.dispatchEvent(insufficientCreditsEvent);
        // We've handled it by dispatching an event; we still reject the promise
        // so the calling component knows the original API call failed.
      } else if (errorCode === ERROR_CODE_AI_ACCESS_DENIED || errorCode === ERROR_CODE_AI_PLAN_RESTRICTION || errorCode === ERROR_CODE_AI_ACCESS_DENIED_VIEW) {
        await Swal.fire({
          title: errorCode === ERROR_CODE_AI_PLAN_RESTRICTION ? "Plan Restriction" : "AI Access Denied",
          text: responseData.message || "Your current plan does not grant access to this AI feature or your subscription is inactive.",
          icon: "error",
          confirmButtonText: "View Plans",
          customClass: { confirmButton: "swal-confirm-button" }
        }).then((result) => {
          if (result.isConfirmed && redirectCallback) {
            redirectCallback('/pay'); 
          } else if (result.isConfirmed) {
            window.location.href = '/pay';
          }
        });
      } else {
        // Default 403 handling for other permission issues
        console.log("Access Denied:", responseData);
        await Swal.fire({
          title: "Access Denied",
          text: responseData?.detail || responseData?.message || "You do not have permission to perform this action.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: { confirmButton: "swal-confirm-button" }
        });
      }
      // It's important to reject the promise so the component that made the call
      // knows it failed and can stop its own loading states, etc.
      return Promise.reject(error);

    } else if (status >= 500) {
      console.error(`Server Error (${status}):`, responseData);
      await Swal.fire({
          title: "Server Error",
          text: "An unexpected error occurred on our servers. Please try again later or contact support.",
          icon: "error",
          confirmButtonText: "OK"
      });
      return Promise.reject(error);
    } else if (status === 400 && responseData?.error === "Validation Error") {
        console.warn(`Validation Error (400):`, responseData);
        let validationMessages = "Please correct the following errors:\n";
        if (typeof responseData.details === 'object') {
            for (const key in responseData.details) {
                validationMessages += `- ${key}: ${responseData.details[key].join ? responseData.details[key].join(', ') : responseData.details[key]}\n`;
            }
        } else {
            validationMessages = responseData.details || "Invalid input provided.";
        }
        await Swal.fire({
            title: "Validation Error",
            html: `<pre style="text-align: left; white-space: pre-wrap;">${validationMessages}</pre>`,
            icon: "warning",
            confirmButtonText: "OK"
        });
        return Promise.reject(error); // Reject so component knows about validation failure
    }
    // For other 4xx errors not specifically handled above
    else if (status >= 400 && status < 500) {
      console.warn(`Client Error (${status}):`, responseData);
      //  await Swal.fire({
      //     title: `Error ${status}`,
      //     text: responseData?.detail || responseData?.message || "There was an issue with your request.",
      //     icon: "warning", // Use warning for client-side type errors generally
      //     confirmButtonText: "OK"
      // });
      return Promise.reject(error);
    }

    // Fallback for unhandled errors, though most should be caught above
    return Promise.reject(error);
  }
);

export default axiosInstance;