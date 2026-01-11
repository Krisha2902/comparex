import axios from "axios";
import API_BASE_URL from "../config/api";

export const createAlert = (data) => {
  return axios.post(`${API_BASE_URL}/api/alerts/create`, data);
};
