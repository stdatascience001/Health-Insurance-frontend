import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { registerUser, loginUser } from "../../services/auth";
import { getAvailablePlans, type Plan } from "../../services/plans";
import { useAuth } from "../../context/AuthContext";

function formatCurrency(amount: number | string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const planIdParam = searchParams.get("planId") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState(planIdParam);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await getAvailablePlans();
        setPlans(data);
        if (!selectedPlanId && data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load plans for registration:", err);
      }
    }
    fetchPlans();
  }, [selectedPlanId]);

  const activeSelectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
        confirm_password: confirmPassword,
      };

      await registerUser(payload);

      setSuccess(
        `Registration successful! Welcome, ${fullName.trim()}. Logging you in...`
      );

      // Automatically sign in the newly registered customer
      try {
        const loginRes = await loginUser({
          email: payload.email,
          password: payload.password,
        });
        await login(loginRes.access_token);
        setTimeout(() => {
          if (planIdParam) {
            navigate(`/customer/apply?planId=${planIdParam}`, {
              replace: true,
            });
          } else {
            navigate("/customer/dashboard", { replace: true });
          }
        }, 1200);
      } catch {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Customer registration failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to register customer."
      );
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
          maxWidth: "520px",
          width: "100%",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div className="modal-header-banner">
          <div className="modal-header-top">
            <span className="modal-badge">Customer Enrollment</span>
          </div>
          <h1 className="modal-title" style={{ fontSize: "1.45rem" }}>
            Register as Policyholder
          </h1>
          <p className="modal-subtitle">
            Create your individual health insurance customer account.
          </p>
        </div>

        {/* SELECTED PLAN CONTEXT CARD */}
        {activeSelectedPlan && (
          <div
            style={{
              padding: "1rem 1.5rem",
              background: "var(--primary-50)",
              borderBottom: "1px solid var(--primary-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--primary-700)",
                  letterSpacing: "0.06em",
                }}
              >
                Selected Plan
              </span>
              <strong
                style={{
                  display: "block",
                  fontSize: "0.95rem",
                  color: "var(--text-main)",
                }}
              >
                {activeSelectedPlan.name}
              </strong>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {formatCurrency(activeSelectedPlan.pricing_rules?.find(
                  (rule) => rule.premium_frequency === "monthly" && rule.is_active
                )?.premium_amount ?? 0)}/mo •{" "}
                {formatCurrency(
                  activeSelectedPlan.pricing_rules?.find(
                    (rule) => rule.is_active
                  )?.coverage_amount ?? 0
                )}{" "} coverage
              </span>
            </div>

            <Link
              to="/"
              style={{
                fontSize: "0.75rem",
                color: "var(--primary-600)",
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Change Plan
            </Link>
          </div>
        )}

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div className="toast-banner error" style={{ margin: "0 0 0.5rem 0" }}>
              <span>⚠ {error}</span>
            </div>
          )}

          {success && (
            <div className="toast-banner success" style={{ margin: "0 0 0.5rem 0" }}>
              <span>✓ {success}</span>
            </div>
          )}

          {/* FULL NAME */}
          <div className="form-field">
            <label className="form-label">
              <span>Full Legal Name</span>
              <span className="label-required">* Required</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                minLength={2}
                maxLength={150}
                required
                autoFocus
              />
            </div>
          </div>

          {/* EMAIL */}
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
                placeholder="e.g. rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={150}
                required
              />
            </div>
          </div>

          {/* PHONE */}
          <div className="form-field">
            <label className="form-label">
              <span>Phone Number</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Optional</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="form-field">
            <label className="form-label">
              <span>Password</span>
              <span className="label-required">* Min 8 characters</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="form-field">
            <label className="form-label">
              <span>Confirm Password</span>
              <span className="label-required">* Required</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <button
              type="submit"
              className="primary-btn"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Registering Account..." : "Complete Registration →"}
            </button>
          </div>

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
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--primary-600)", fontWeight: 700, textDecoration: "none" }}>
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
