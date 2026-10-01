
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { store } from "../store/store";
import {
  updateAccessToken,
  logout,
} from "../store/authSlice";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add access token to every protected request
api.interceptors.request.use(
  (config) => {
    const accessToken =
      store.getState().auth.accessToken;

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Automatically refresh expired access token
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | InternalAxiosRequestConfig & {
            _retry?: boolean;
          };

    // Only handle 401 once for each request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken =
        store.getState().auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          "http://localhost:5000/api/auth/refresh-token",
          {
            refreshToken,
          }
        );

        const newAccessToken =
          response.data.accessToken;

        store.dispatch(
          updateAccessToken(newAccessToken)
        );

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

