import axios, { InternalAxiosRequestConfig } from "axios";
import { SERVER_ENDPOINTS } from "./serverConstant";

export const userPublicApi = axios.create({
  baseURL: SERVER_ENDPOINTS.USER_BASEURL,
});

export const authPublicApi = axios.create({
  baseURL: SERVER_ENDPOINTS.AUTH_BASEURL,
});

export const userSecuredApi = axios.create({
  baseURL: SERVER_ENDPOINTS.USER_BASEURL,
});

userSecuredApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig<unknown>) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("publicAccessToken") : null;
    if (token && config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const contestSecuredApi = axios.create({
  baseURL: SERVER_ENDPOINTS.CONTEST_BASEURL,
});

contestSecuredApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig<unknown>) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("publicAccessToken") : null;
    if (token && config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
