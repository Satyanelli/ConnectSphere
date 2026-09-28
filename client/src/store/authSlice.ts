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
  token: string | null;
  isAuthenticated: boolean;
}

const storedToken = localStorage.getItem("connectsphere_token");
const storedUser = localStorage.getItem("connectsphere_user");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      localStorage.setItem(
        "connectsphere_token",
        action.payload.token
      );

      localStorage.setItem(
        "connectsphere_user",
        JSON.stringify(action.payload.user)
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
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("connectsphere_token");
      localStorage.removeItem("connectsphere_user");
    },
  },
});

export const {
  setCredentials,
  updateUser,
  logout,
} = authSlice.actions;

export default authSlice.reducer;