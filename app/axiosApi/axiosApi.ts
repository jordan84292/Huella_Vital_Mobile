import axios from "axios";
export const axiosApi = axios.create({
  baseURL: "https://api-huella-vital.onrender.com/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});
