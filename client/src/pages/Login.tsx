import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import api from "../api/axios";
import { setCredentials } from "../store/authSlice";
import type { AppDispatch } from "../store/store";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      dispatch(
        setCredentials({
          user,
          token,
        })
      );

      console.log("Login successful:", user);

      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);

      const message =
        error.response?.data?.message ||
        "Unable to login. Please check your credentials.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>ConnectSphere</h1>
          <p>Connect. Share. Grow.</p>
        </div>

        <div className="auth-content">
          <h2>Welcome back</h2>

          <p className="auth-subtitle">
            Sign in to continue to your professional network.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;