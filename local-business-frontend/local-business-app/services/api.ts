import axios from "axios";

const api = axios.create({
  baseURL: "http://10.200.205.101:5000/api",
});

export default api;