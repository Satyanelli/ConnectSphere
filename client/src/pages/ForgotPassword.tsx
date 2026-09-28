
import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setResetToken("");

      const response = await api.post(
        "/auth/forgot-password",
        {
          email,
        }
      );

      setSuccess(response.data.message);

      /*
       * Local development only.
       * Later this token will come through email.
       */
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
    } catch (error: any) {
      console.error(
        "Forgot password error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to process password reset."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password</h1>

          <p>
            Enter your email to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          {resetToken && (
            <div className="success-message">
              <strong>
                Reset Token:
              </strong>

              <p
                style={{
                  wordBreak: "break-all",
                  marginTop: "8px",
                }}
              >
                {resetToken}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ForgotPassword;