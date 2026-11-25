import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyPolicies, createPolicyCancellationRequest, type Policy } from "../../services/policies";
import {
  getMyApplications,
  type InsuranceApplication,
} from "../../services/application";

function formatCurrency(amount: number | string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-IN", { 
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const CustomerDashboard: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const customer = user?.customer;

  // Policies and Applications Data State
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [applications, setApplications] = useState<InsuranceApplication[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  //Policy cancellation Request...
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [submittingCancellation, setSubmittingCancellation] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [pendingCancellationPolicyIds, setPendingCancellationPolicyIds] =
    useState<string[]>([]);

  // Feedback State
  const [error, setError] = useState("");

  // Load Policies and Applications
  const loadData = async () => {
    if (!token) {
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);
      setError("");

      const [policiesData, appsData] = await Promise.all([
        getMyPolicies(token).catch((err) => {
          console.error("Failed to fetch policies:", err);
          return [] as Policy[];
        }),

        getMyApplications(token).catch((err) => {
          console.error("Failed to fetch applications:", err);
          return [] as InsuranceApplication[];
        }),
      ]);

      setPolicies(policiesData);
      setApplications(appsData);
    } catch (err) {
      console.error("Error loading customer dashboard data:", err);
      setError("Failed to load your policy or application data.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);


  // Refresh Dashboard
  const handleRefresh = async () => {
    try {
      await refreshUser();
      await loadData();
    } catch (err) {
      console.error("Failed to refresh dashboard:", err);
      setError("Failed to refresh your dashboard.");
    }
  };

  const pendingCount = applications.filter(
    (a) => a.status === "pending"
  ).length;

  const activePolicyCount = policies.filter(
    (p) => p.status === "active"
  ).length;

  const handleCancellationSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token || !selectedPolicy) return;

    if (!cancellationReason) {
      setCancellationError("Please select a cancellation reason.");
      return;
    }

    try {
      setSubmittingCancellation(true);
      setCancellationError("");
      setCancellationMessage("");

      await createPolicyCancellationRequest(token, selectedPolicy.id, {
        reason: cancellationReason,
        additional_comments: additionalComments.trim() || undefined,
      });

      setPendingCancellationPolicyIds((prev) =>
        prev.includes(selectedPolicy.id)
          ? prev
          : [...prev, selectedPolicy.id]
      );

      setCancellationMessage(
        `Cancellation request submitted successfully for policy ${selectedPolicy.policy_number}.`
      );

      setSelectedPolicy(null);
      setCancellationReason("");
      setAdditionalComments("");
    } catch (error) {
      setCancellationError(
        error instanceof Error
          ? error.message
          : "Failed to submit cancellation request."
      );
    } finally {
      setSubmittingCancellation(false);
    }
  };

  return (
    <div className="main-content">

      {/* HEADER */}
      <div className="view-header">
        <div className="view-title-wrap">
          <span className="view-eyebrow">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-emerald)",
              }}
            />
            Policyholder Portal
          </span>

          <h1 className="view-title">
            Welcome, {customer?.full_name || user?.email.split("@")[0]}
          </h1>

          <p className="view-description">
            View your active health insurance policies, monitor submitted
            applications, and manage your profile.
          </p>
        </div>

        <div className="view-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={handleRefresh}
            disabled={loadingData}
          >
            {loadingData ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </div>
      </div>

      {/* CANCELLATION SUCCESS MESSAGE */}
      {cancellationMessage && (
        <div className="toast-banner success">
          <span>✓ {cancellationMessage}</span>

          <button
            type="button"
            onClick={() => setCancellationMessage("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* CANCELLATION ERROR MESSAGE */}
      {/* DASHBOARD ERROR MESSAGE */}
      {error && (
        <div className="toast-banner error">
          <span>⚠ {error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* METRICS STRIP */}
      <div className="metrics-strip" style={{ marginBottom: "1.75rem" }}>

        {/* ACTIVE POLICIES */}
        <div className="metric-strip-card">
          <div className="metric-icon-box emerald">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <div className="metric-strip-info">
            <span className="metric-strip-label">Active Policies</span>
            <span className="metric-strip-value">
              {loadingData ? "..." : activePolicyCount}
            </span>
            <span className="metric-strip-sub">
              Active coverage plans
            </span>
          </div>
        </div>

        {/* PENDING APPLICATIONS */}
        <div className="metric-strip-card">
          <div className="metric-icon-box teal">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>

          <div className="metric-strip-info">
            <span className="metric-strip-label">
              Pending Applications
            </span>
            <span className="metric-strip-value">
              {loadingData ? "..." : pendingCount}
            </span>
            <span className="metric-strip-sub">
              Awaiting review
            </span>
          </div>
        </div>

        {/* ACCOUNT STATUS */}
        <div className="metric-strip-card">
          <div className="metric-icon-box blue">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div className="metric-strip-info">
            <span className="metric-strip-label">
              Account Status
            </span>
            <span
              className="metric-strip-value"
              style={{
                fontSize: "1.2rem",
                color: "var(--accent-emerald)",
              }}
            >
              Verified
            </span>
            <span className="metric-strip-sub">
              Individual policyholder
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE POLICIES SECTION */}
      <div
        className="content-card"
        style={{
          padding: "1.75rem",
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div className="metric-icon-box emerald">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "var(--text-main)",
                  margin: 0,
                }}
              >
                My Active Policies
              </h3>

              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                }}
              >
                Official issued insurance contracts
              </span>
            </div>
          </div>

          <Link
            to="/"
            className="secondary-btn"
            style={{
              textDecoration: "none",
              fontSize: "0.82rem",
            }}
          >
            + Apply for New Plan
          </Link>
        </div>

        {loadingData ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Loading policies...
          </p>
        ) : policies.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background:
                    pendingCount > 0
                      ? "var(--accent-amber)"
                      : "var(--text-muted)",
                }}
              />

              <strong
                style={{
                  fontSize: "0.92rem",
                  color: "var(--text-main)",
                }}
              >
                {pendingCount > 0
                  ? "Application in Progress"
                  : "No Active Policies Yet"}
              </strong>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                margin: "0 0 1rem",
              }}
            >
              {pendingCount > 0
                ? "You have submitted an application that is awaiting admin review. Once approved, your policy will automatically appear here."
                : "You currently do not have any active health insurance policies. Explore our individual coverage plans to get covered today."}
            </p>

            {pendingCount === 0 && (
              <Link
                to="/"
                className="primary-btn"
                style={{
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  display: "inline-flex",
                }}
              >
                Browse Plans →
              </Link>
            )}
          </div>
        ) : (
          <div
            className="table-container"
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              overflowX: "auto",
              borderRadius: "8px",
            }}
          >
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Policy Number</th>
                  <th>Plan Name</th>
                  <th>Coverage</th>
                  <th>Monthly Premium</th>
                  <th>Start Date</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td>
                      <span
                        className="id-badge"
                        style={{ fontWeight: 700 }}
                      >
                        {policy.policy_number}
                      </span>
                    </td>

                    <td>
                      <strong style={{ color: "var(--text-main)" }}>
                        {policy.plan_name}
                      </strong>
                    </td>

                    <td>
                      <span
                        style={{
                          color: "var(--accent-emerald)",
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(policy.coverage_amount)}
                      </span>
                    </td>

                    <td>
                      {formatCurrency(policy.premium_amount)} / mo
                    </td>

                    <td>
                      {new Date(policy.start_date).toLocaleDateString()}
                    </td>

                    <td>
                      {new Date(policy.end_date).toLocaleDateString()}
                    </td>

                    <td>
                      <span className="status-badge status-active">
                        <span className="status-dot"></span>
                        Active
                      </span>
                    </td>
                    <td>
                      {pendingCancellationPolicyIds.includes(policy.id) ? (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "5px 10px",
                            borderRadius: "12px",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            border: "1px solid #fde68a",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Request Pending
                        </span>
                      ) : policy.status === "active" ? (
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{
                            color: "#dc2626",
                            borderColor: "#fecaca",
                            fontSize: "0.78rem",
                            padding: "6px 10px",
                            whiteSpace: "nowrap",
                          }}
                          onClick={() => {
                            setCancellationError("");
                            setCancellationMessage("");
                            setSelectedPolicy(policy);
                          }}
                        >
                          Request Cancellation
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Under Review...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* POLICY CANCELLATION MODAL */}
      {selectedPolicy && (
        <div
          onClick={() => {
            if (!submittingCancellation) {
              setSelectedPolicy(null);
              setCancellationError("");
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            className="content-card"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "1.75rem",
              borderRadius: "14px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.2rem",
                    color: "var(--text-main)",
                  }}
                >
                  Request Policy Cancellation
                </h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Policy: {selectedPolicy.policy_number}
                </p>
              </div>

              <button
                type="button"
                disabled={submittingCancellation}
                onClick={() => {
                  setSelectedPolicy(null);
                  setCancellationError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "1.25rem",
                fontSize: "0.85rem",
                color: "#92400e",
              }}
            >
              Submitting this request will not immediately cancel your policy.
              Your request will be reviewed by an administrator.
            </div>

            <form onSubmit={handleCancellationSubmit}>
              <div style={{ marginBottom: "1.1rem" }}>
                <label
                  htmlFor="cancellationReason"
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    marginBottom: "7px",
                    color: "var(--text-main)",
                  }}
                >
                  Reason for Cancellation *
                </label>

                <select
                  id="cancellationReason"
                  value={cancellationReason}
                  onChange={(event) =>
                    setCancellationReason(event.target.value)
                  }
                  required
                  disabled={submittingCancellation}
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    background: "white",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="">Select a reason</option>
                  <option value="Financial Issues">Financial Issues</option>
                  <option value="Switching Insurance Provider">
                    Switching Insurance Provider
                  </option>
                  <option value="Employer Coverage">Employer Coverage</option>
                  <option value="Duplicate Coverage">Duplicate Coverage</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Dissatisfaction with Services">
                    Dissatisfaction with Services
                  </option>
                  <option value="Change in Healthcare Requirements">
                    Change in Healthcare Requirements
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  htmlFor="additionalComments"
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    marginBottom: "7px",
                    color: "var(--text-main)",
                  }}
                >
                  Additional Comments{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--text-muted)",
                    }}
                  >
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="additionalComments"
                  value={additionalComments}
                  onChange={(event) =>
                    setAdditionalComments(event.target.value)
                  }
                  placeholder="Please provide any additional details..."
                  rows={4}
                  disabled={submittingCancellation}
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    resize: "vertical",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {cancellationError && (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "10px",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  ⚠ {cancellationError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={submittingCancellation}
                  onClick={() => {
                    setSelectedPolicy(null);
                    setCancellationError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submittingCancellation || !cancellationReason}
                  style={{
                    background: "#dc2626",
                    borderColor: "#dc2626",
                  }}
                >
                  {submittingCancellation
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMITTED APPLICATIONS SECTION */}
      <div
        className="content-card"
        style={{
          padding: "1.75rem",
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "1.25rem",
          }}
        >
          <div className="metric-icon-box teal">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>

          <div>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--text-main)",
                margin: 0,
              }}
            >
              My Applications
            </h3>

            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              Track the status of your insurance enrollments
            </span>
          </div>
        </div>

        {loadingData ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Loading applications...
          </p>
        ) : applications.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                margin: "0 0 1rem",
              }}
            >
              You have not submitted any insurance applications yet.
            </p>

            <Link
              to="/"
              className="primary-btn"
              style={{
                textDecoration: "none",
                fontSize: "0.85rem",
                display: "inline-flex",
              }}
            >
              Explore Plans & Apply →
            </Link>
          </div>
        ) : (
          <div
            className="table-responsive"
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              overflowX: "auto",
              borderRadius: "8px",
            }}
          >
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Nominee</th>
                  <th>Monthly Premium</th>
                  <th>Coverage</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong style={{ color: "var(--text-main)" }}>
                        {app.plan_name}
                      </strong>
                    </td>

                    <td>
                      <div>{app.nominee_name}</div>

                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        ({app.nominee_relationship})
                      </span>
                    </td>

                    <td>{formatCurrency(app.premium_amount)}</td>

                    <td>{formatCurrency(app.coverage_amount)}</td>

                    <td>
                      {app.created_at
                        ? new Date(app.created_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      {app.status === "pending" && (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            border: "1px solid #fde68a",
                          }}
                        >
                          ● Under Review
                        </span>
                      )}

                      {app.status === "approved" && (
                        <span
                          style={{
                            background: "#f0fdf4",
                            color: "#15803d",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          ✓ Approved
                        </span>
                      )}

                      {app.status === "rejected" && (
                        <div>
                          <span
                            style={{
                              background: "#fef2f2",
                              color: "#b91c1c",
                              padding: "3px 10px",
                              borderRadius: "12px",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              border: "1px solid #fecaca",
                            }}
                          >
                            ✕ Rejected
                          </span>

                          {app.rejection_reason && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#b91c1c",
                                marginTop: "4px",
                              }}
                            >
                              Reason: {app.rejection_reason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
