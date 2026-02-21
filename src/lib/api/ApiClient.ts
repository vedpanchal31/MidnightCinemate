import axios from "axios";

const ApiClient = axios.create();

ApiClient.interceptors.request.use(
  (config) => {
    // Only set baseURL for external APIs, not for Next.js API routes
    if (config.url?.startsWith("/api/")) {
      // For Next.js API routes, don't set baseURL
      delete config.baseURL;
    } else {
      // For external APIs, set baseURL from environment
      config.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

ApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.config?.url,
      error.response?.status,
      error.response?.data || error.message,
    );
    return Promise.reject(error);
  },
);

export default ApiClient;
