
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  headline?: string;
  about?: string;
  location?: string;
  skills?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const storedAccessToken = localStorage.getItem(
  "connectsphere_access_token"
);

const storedRefreshToken = localStorage.getItem(
  "connectsphere_refresh_token"
);

const storedUser = localStorage.getItem(
  "connectsphere_user"
);

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
  isAuthenticated: !!storedAccessToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;

      localStorage.setItem(
        "connectsphere_access_token",
        action.payload.accessToken
      );

      localStorage.setItem(
        "connectsphere_refresh_token",
        action.payload.refreshToken
      );

      localStorage.setItem(
        "connectsphere_user",
        JSON.stringify(action.payload.user)
      );
    },

    updateAccessToken: (
      state,
      action: PayloadAction<string>
    ) => {
      state.accessToken = action.payload;

      localStorage.setItem(
        "connectsphere_access_token",
        action.payload
      );
    },

    updateUser: (
      state,
      action: PayloadAction<User>
    ) => {
      state.user = action.payload;

      localStorage.setItem(
        "connectsphere_user",
        JSON.stringify(action.payload)
      );
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      localStorage.removeItem(
        "connectsphere_access_token"
      );

      localStorage.removeItem(
        "connectsphere_refresh_token"
      );

      localStorage.removeItem(
        "connectsphere_user"
      );
    },
  },
});

export const {
  setCredentials,
  updateAccessToken,
  updateUser,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
