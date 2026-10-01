
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import Connections from "./pages/Connections";
import Requests from "./pages/Requests";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import CreatePost from "./pages/CreatePost";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/profile/:userId"
            element={<Profile />}
          />

          <Route
            path="/connections"
            element={<Connections />}
          />

          <Route
            path="/requests"
            element={<Requests />}
          />

          <Route
            path="/messages"
            element={<Messages />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/messages/:userId"
              element={<Chat />}
            />
          </Route>

          <Route
            path="/create-post"
            element={<CreatePost />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
