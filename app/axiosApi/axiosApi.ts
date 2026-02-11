import axios from "axios";

export const axiosApi = axios.create({
  baseURL: "https://api-huella-vital.onrender.com/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para registrar solicitudes
axiosApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("[Axios Request Error]", error);
    return Promise.reject(error);
  },
);

// Interceptor para registrar respuestas
axiosApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("[Axios Response Error]", error.response);
    } else if (error.request) {
      console.error("[Axios Request Error - No Response]", error.request);
    } else {
      console.error("[Axios General Error]", error.message);
    }
    return Promise.reject(error);
  },
);
