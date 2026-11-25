
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateMe } from "../services/auth";

export const Navbar: React.FC = () => {
  const {
    isAuthenticated,
    user,
    isAdmin,
    isCustomer,
    logout,
    refreshUser,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const openProfile = () => {
    setFullName(user?.customer?.full_name || "");
    setPhone(user?.customer?.phone || "");
    setProfileError("");
    setProfileSuccess("");
    setShowProfile(true);
  };

  const closeProfile = () => {
    if (saving) return;
    setShowProfile(false);
    setProfileError("");
  };

  const handleUpdateProfile = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setProfileError("Name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setProfileError("");
      setProfileSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      await updateMe(token, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });

      await refreshUser();

      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => {
        setShowProfile(false);
        setProfileSuccess("");
      }, 1200);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setProfileError(
        err instanceof Error ? err.message : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="topbar">
        {/* BRAND LOGO */}
        <Link
          to="/"
          style={{ textDecoration: "none" }}
          className="brand-section"
        >
          <div className="brand-icon-wrapper">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>

          <div className="brand-details">
            <div className="brand-title">
              Health Care <span className="brand-badge">Individual Care</span>
            </div>
            <span className="brand-subtitle">
              Single Coverage Health Insurance
            </span>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="nav-menu" aria-label="Main Navigation">
          {!isAuthenticated && (
            <>
              <Link to="/" className={`nav-button ${location.pathname === "/" ? "active" : ""}`} style={{ textDecoration: "none" }}>
                Insurance Plans
              </Link>
              <Link
                to="/contact"
                className={`nav-button ${location.pathname === "/contact" ? "active" : ""
                  }`}
                style={{ textDecoration: "none" }}
              >
                Contact Us
              </Link>
              <Link to="#" className="nav-button" style={{ textDecoration: "none" }}>
                About Us
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/admin/dashboard" className={`nav-button ${location.pathname === "/admin/dashboard" ? "active" : ""}`} style={{ textDecoration: "none" }}>
                <span>Dashboard</span>
              </Link>
              <Link to="/admin/customers" className={`nav-button ${location.pathname === "/admin/customers" ? "active" : ""}`} style={{ textDecoration: "none" }}>
                <span>Customers</span>
              </Link>
              <Link to="/admin/plans" className={`nav-button ${location.pathname === "/admin/plans" ? "active" : ""}`} style={{ textDecoration: "none" }}>
                <span>Plans</span>
              </Link>
              <Link to="/admin/applications" className={`nav-button ${location.pathname === "/admin/applications" ? "active" : ""}`} style={{ textDecoration: "none" }}>
                <span>Applications</span>
              </Link>
            </>
          )}

          {isCustomer && (
            <>
              <Link to="/customer/dashboard" className={`nav-button ${location.pathname === "/customer/dashboard" ? "active" : ""}`} style={{ textDecoration: "none" }}>
                <span>My Dashboard</span>
              </Link>
              <Link to="/" className={`nav-button ${location.pathname === "/" ? "active" : ""}`} style={{ textDecoration: "none" }}>
                <span>Explore Plans</span>
              </Link>
            </>
          )}
        </nav>

        {/* TOPBAR ACTIONS */}
        <div className="topbar-actions">
          {!isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link to="/login" className="secondary-btn" style={{ textDecoration: "none", padding: "8px 18px", fontSize: "0.85rem" }}>
                Sign In
              </Link>
              <Link to="/register" className="primary-btn" style={{ textDecoration: "none", padding: "8px 18px", fontSize: "0.85rem" }}>
                Register
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {isCustomer ? (
                <button
                  type="button"
                  className="user-profile-card"
                  onClick={openProfile}
                  title="View and manage your account profile"
                  style={{
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    font: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(user?.customer?.full_name || user?.email)}
                  </div>

                  <div className="user-info">
                    <span className="user-name">
                      {user?.customer?.full_name || user?.email.split("@")[0]}
                    </span>
                    <span className="user-role">My Account</span>
                  </div>
                </button>
              ) : (
                <div
                  className="user-profile-card"
                  title={`${user?.role.toUpperCase()} Profile: ${user?.email}`}
                  onClick={() => navigate("/admin/dashboard")}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0e8a82 0%, #064e49 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                    }}
                  >
                    AD
                  </div>
                  <div className="user-info">
                    <span className="user-name">System Administrator</span>
                    <span className="user-role">Admin Portal</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="secondary-btn"
                style={{
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  color: "var(--accent-rose)",
                  borderColor: "#fecaca",
                  background: "#fef2f2",
                }}
                onClick={handleLogout}
                title="Sign out of your account"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CUSTOMER ACCOUNT PROFILE MODAL */}
      {showProfile && isCustomer && (
        <div
          onClick={closeProfile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-profile-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-card, #ffffff)",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 25px 70px rgba(0,0,0,0.22)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="metric-icon-box blue">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 id="account-profile-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)" }}>
                    Account Profile
                  </h2>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Manage your personal information
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeProfile}
                disabled={saving}
                aria-label="Close profile"
                style={{
                  border: "none",
                  background: "var(--bg-subtle)",
                  borderRadius: "8px",
                  width: "34px",
                  height: "34px",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  color: "var(--text-muted)",
                }}
              >
                ×
              </button>
            </div>

            {profileError && (
              <div className="toast-banner error" style={{ marginBottom: "16px" }}>
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="toast-banner success" style={{ marginBottom: "16px" }}>
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="form-field">
                <label className="form-label">Full Legal Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.customer?.email || user?.email || ""}
                  disabled
                />
              </div>

              <div className="form-field">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Customer ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.customer?.id || user?.id || ""}
                  disabled
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeProfile}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
