import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginUser, getMicrosoftLoginUrl } from "../../services/auth";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  //This will fetch the plan id after the login
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get("planId");

  //show password eye button
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect to appropriate portal
  React.useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else if (planId) {
        navigate(`/customer/apply?planId=${planId}`, {
          replace: true,
        });
      } else {
        navigate("/customer/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleMicrosoftLogin = () => {
    window.location.href = getMicrosoftLoginUrl();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      // Pass token to AuthContext which fetches user profile
      const loggedInUser = await login(res.access_token);

      // Check destination from location.state if user was redirected from protected route
      const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname;

      if (loggedInUser.role === "admin") {
        if (destination && destination.startsWith("/admin")) {
          navigate(destination, { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } else {
        if (planId) {
          navigate(`/customer/apply?planId=${planId}`, {
            replace: true,
          });
        } else if (destination && destination.startsWith("/customer")) {
          navigate(destination, { replace: true });
        } else {
          navigate("/customer/dashboard", { replace: true });
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: "460px",
          width: "100%",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div className="modal-header-banner">
          <div className="modal-header-top">
            <span className="modal-badge">Secure Authentication</span>
          </div>
          <h1 className="modal-title" style={{ fontSize: "1.45rem" }}>
            Sign In to Health Care
          </h1>
          <p className="modal-subtitle">
            Access your insurance policy portal or administrator dashboard.
          </p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div className="toast-banner error" style={{ margin: "0 0 0.5rem 0" }}>
              <span>⚠ {error}</span>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
                  fontWeight: 700,
                }}
                onClick={() => setError("")}
              >
                ✕
              </button>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">
              <span>Email Address</span>
              <span className="label-required">* Required</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">
              <span>Password</span>
              <span className="label-required">* Required</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 9 4 10 7-0.4 1.3-1.4 2.7-2.7 3.7" />
                    <path d="M6.2 6.2C4.1 7.4 2.6 9.3 2 12c1 3 5 7 10 7 1 0 2-.2 2.9-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>

            </div>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <button
              type="submit"
              className="primary-btn"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In →"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "1rem 0",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
            OR
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            style={{
              width: "100%",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "#ffffff",
              color: "#242424",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              alt="Microsoft"
              width="20"
              height="20"
            />
            Sign in with Microsoft
          </button>


          <div
            style={{
              textAlign: "center",
              marginTop: "0.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            Don't have an account?{" "}
            <Link
              to={planId ? `/register?planId=${planId}` : "/register"}
              style={{ color: "var(--primary-600)", fontWeight: 700, textDecoration: "none" }}
            >
              Register as Customer
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
