import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllApplications,
  reviewApplication,
  type InsuranceApplication,
} from "../../services/application";
import { getAllPolicies, type Policy } from "../../services/policies";

function formatCurrency(amount: number | string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const AdminApplications: React.FC = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<"applications" | "policies">("applications");
  const [applications, setApplications] = useState<InsuranceApplication[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [inspectingApp, setInspectingApp] = useState<InsuranceApplication | null>(null);
  const [approvingApp, setApprovingApp] = useState<InsuranceApplication | null>(null);
  const [rejectingApp, setRejectingApp] = useState<InsuranceApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  //Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const pageSize = 5;

  // Pop-up Toast messages
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadData = useCallback(async (page: number) => {
    if (!token) return;

    try {
      setLoading(true);

      const [appsData, policiesData] = await Promise.all([
        getAllApplications(token, page, pageSize).catch((err) => {
          console.error("Failed to load applications:", err);
          return null;
        }),
        getAllPolicies(token).catch((err) => {
          console.error("Failed to load policies:", err);
          return [] as Policy[];
        }),
      ]);

      if (appsData) {
        setApplications(appsData.items);
        setTotalApplications(appsData.total);
        setTotalPages(appsData.total_pages);
      }

      setPolicies(policiesData);
    } catch (err) {
      console.error("Error loading data:", err);
      showToast("Failed to fetch applications and policies", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData(currentPage);
  }, [loadData, currentPage]);

  // Handle Application Approval
  const handleApprove = async () => {
    if (!token || !approvingApp) return;

    try {
      setProcessing(true);
      await reviewApplication(token, approvingApp.id, {
        status: "approved",
      });

      showToast(`Application for ${approvingApp.plan_name} approved successfully! Policy has been issued.`);
      setApprovingApp(null);
      await loadData(currentPage);
    } catch (err) {
      console.error("Approval error:", err);
      showToast(err instanceof Error ? err.message : "Failed to approve application.", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Application Rejection
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectingApp) return;

    if (!rejectionReason.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }

    try {
      setProcessing(true);
      await reviewApplication(token, rejectingApp.id, {
        status: "rejected",
        rejection_reason: rejectionReason.trim(),
      });

      showToast(`Application has been rejected.`, "success");
      setRejectingApp(null);
      setRejectionReason("");
      await loadData(currentPage);
    } catch (err) {
      console.error("Rejection error:", err);
      showToast(err instanceof Error ? err.message : "Failed to reject application.", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "All" || app.status.toLowerCase() === statusFilter.toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        app.plan_name.toLowerCase().includes(q) ||
        (app.customer_name && app.customer_name.toLowerCase().includes(q)) ||
        (app.customer_email && app.customer_email.toLowerCase().includes(q)) ||
        app.nominee_name.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchTerm]);

  // Filtered policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        !q ||
        p.policy_number.toLowerCase().includes(q) ||
        p.plan_name.toLowerCase().includes(q) ||
        (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
        (p.customer_email && p.customer_email.toLowerCase().includes(q))
      );
    });
  }, [policies, searchTerm]);

  const pendingCount = applications.filter((a) => a.status === "pending").length;


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
            Underwriting & Operations
          </span>
          <h1 className="view-title">Applications & Policies</h1>
          <p className="view-description">
            Review submitted insurance applications, verify medical disclosures, issue coverage, and inspect active policies.
          </p>
        </div>

        <div className="view-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => loadData(currentPage)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* POP-UP TOAST */}
      {toastMessage && (
        <div className={`toast-banner ${toastMessage.type}`}>
          <span>
            {toastMessage.type === "success" ? "✓" : "⚠"} {toastMessage.text}
          </span>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontWeight: 700,
            }}
            onClick={() => setToastMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("applications")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background:
              activeTab === "applications"
                ? "var(--primary-700)"
                : "transparent",
            color:
              activeTab === "applications"
                ? "#ffffff"
                : "var(--text-muted)",
          }}
        >
          <span>Insurance Applications</span>

          {pendingCount > 0 && (
            <span
              style={{
                background:
                  activeTab === "applications"
                    ? "#ffffff"
                    : "var(--accent-amber)",
                color:
                  activeTab === "applications"
                    ? "var(--primary-800)"
                    : "#ffffff",
                padding: "2px 7px",
                borderRadius: "10px",
                fontSize: "0.72rem",
                fontWeight: 800,
              }}
            >
              {pendingCount} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("policies")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background:
              activeTab === "policies"
                ? "var(--primary-700)"
                : "transparent",
            color:
              activeTab === "policies"
                ? "#ffffff"
                : "var(--text-muted)",
          }}
        >
          <span>Issued Policies</span>
          <span
            style={{
              background:
                activeTab === "policies"
                  ? "rgba(255,255,255,0.25)"
                  : "var(--bg-subtle)",
              color:
                activeTab === "policies"
                  ? "#ffffff"
                  : "var(--text-main)",
              padding: "2px 7px",
              borderRadius: "10px",
              fontSize: "0.72rem",
              fontWeight: 800,
            }}
          >
            {policies.length}
          </span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS */}
      {activeTab === "applications" && (
        <div className="content-card" style={{ padding: "1.75rem" }}>
          {/* SEARCH & FILTERS */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search applicant or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "260px" }}
              />

              <div style={{ display: "flex", gap: "6px" }}>
                {["All", "Pending", "Approved", "Rejected"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        statusFilter === st
                          ? "var(--primary-700)"
                          : "#ffffff",
                      color:
                        statusFilter === st
                          ? "#ffffff"
                          : "var(--text-main)",
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Showing {filteredApplications.length} matching applications on this page
              ({totalApplications} total)
            </span>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>
              Loading applications...
            </p>
          ) : filteredApplications.length === 0 ? (
            <div
              style={{
                padding: "2.5rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <p>No insurance applications match your filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Applicant / Customer</th>
                    <th>Plan</th>
                    <th>Monthly Premium</th>
                    <th>Coverage</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <strong
                          style={{
                            color: "var(--text-main)",
                            display: "block",
                          }}
                        >
                          {app.customer_name || "Customer"}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {app.customer_email || app.customer_id}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: "var(--text-main)" }}>
                          {app.plan_name}
                        </strong>
                      </td>

                      <td>{formatCurrency(app.premium_amount)}</td>

                      <td>
                        <span
                          style={{
                            color: "var(--accent-emerald)",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(app.coverage_amount)}
                        </span>
                      </td>

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
                            ● Pending
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
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{
                              padding: "4px 9px",
                              fontSize: "0.78rem",
                            }}
                            onClick={() => setInspectingApp(app)}
                          >
                            Details
                          </button>

                          {app.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="primary-btn"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "0.78rem",
                                  background: "#059669",
                                  borderColor: "#059669",
                                }}
                                onClick={() => setApprovingApp(app)}
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                className="secondary-btn"
                                style={{
                                  padding: "4px 9px",
                                  fontSize: "0.78rem",
                                  color: "#dc2626",
                                  borderColor: "#fecaca",
                                }}
                                onClick={() => {
                                  setRejectingApp(app);
                                  setRejectionReason("");
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!loading && totalApplications > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1.5rem",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}
              >
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, totalApplications)}
                {" "}of {totalApplications} applications
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => prev - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="secondary-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => prev + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POLICIES */}
      {activeTab === "policies" && (
        <div className="content-card" style={{ padding: "1.75rem" }}>
          {/* SEARCH */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Search policy number, customer, plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "320px" }}
            />

            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Total Issued: {filteredPolicies.length}
            </span>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading policies...</p>
          ) : filteredPolicies.length === 0 ? (
            <div
              style={{
                padding: "2.5rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <p>No active policies found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Policy Number</th>
                    <th>Customer</th>
                    <th>Plan Name</th>
                    <th>Coverage Limit</th>
                    <th>Monthly Premium</th>
                    <th>Term Dates</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPolicies.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="id-badge" style={{ fontWeight: 700 }}>
                          {p.policy_number}
                        </span>
                      </td>

                      <td>
                        <strong
                          style={{
                            color: "var(--text-main)",
                            display: "block",
                          }}
                        >
                          {p.customer_name || "Customer"}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {p.customer_email || p.customer_id}
                        </span>
                      </td>

                      <td>{p.plan_name}</td>

                      <td>
                        <span
                          style={{
                            color: "var(--accent-emerald)",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(p.coverage_amount)}
                        </span>
                      </td>

                      <td>{formatCurrency(p.premium_amount)} / mo</td>

                      <td>
                        <span style={{ fontSize: "0.82rem" }}>
                          {new Date(p.start_date).toLocaleDateString()} –{" "}
                          {new Date(p.end_date).toLocaleDateString()}
                        </span>
                      </td>

                      <td>
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
                          ● Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* POP-UP MODAL: DETAILS */}
      {inspectingApp && (
        <div
          className="modal-backdrop"
          onClick={() => setInspectingApp(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div className="modal-header-banner">
              <div className="modal-header-top">
                <span className="modal-badge">
                  Application Specification
                </span>
                <button
                  className="modal-close-btn"
                  onClick={() => setInspectingApp(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <h2 className="modal-title">{inspectingApp.plan_name}</h2>
              <p className="modal-subtitle">
                Applicant: {inspectingApp.customer_name || inspectingApp.customer_id}
              </p>
            </div>

            <div
              style={{
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div className="drawer-info-grid">
                <div className="drawer-info-item">
                  <span className="drawer-info-label">Date of Birth</span>
                  <span className="drawer-info-val">
                    {inspectingApp.date_of_birth}
                  </span>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Gender</span>
                  <span
                    className="drawer-info-val"
                    style={{ textTransform: "capitalize" }}
                  >
                    {inspectingApp.gender}
                  </span>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Nominee Name</span>
                  <span className="drawer-info-val">
                    {inspectingApp.nominee_name}
                  </span>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Relationship</span>
                  <span className="drawer-info-val">
                    {inspectingApp.nominee_relationship}
                  </span>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Nominee DOB</span>
                  <span className="drawer-info-val">
                    {inspectingApp.nominee_dob || "—"}
                  </span>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Nominee Phone</span>
                  <span className="drawer-info-val">
                    {inspectingApp.nominee_phone || "—"}
                  </span>
                </div>
              </div>

              <div>
                <span className="drawer-info-label">Residential Address</span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.88rem",
                    color: "var(--text-main)",
                  }}
                >
                  {inspectingApp.address}
                </p>
              </div>

              <div>
                <span className="drawer-info-label">
                  Medical History / Disclosures
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.88rem",
                    color: "var(--text-main)",
                    background: "var(--bg-subtle)",
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {inspectingApp.medical_history || "No prior conditions stated."}
                </p>
              </div>

              {inspectingApp.rejection_reason && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    color: "#b91c1c",
                  }}
                >
                  <strong>Rejection Reason:</strong>{" "}
                  {inspectingApp.rejection_reason}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setInspectingApp(null)}
                >
                  Close
                </button>

                {inspectingApp.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{
                        background: "#059669",
                        borderColor: "#059669",
                      }}
                      onClick={() => {
                        const app = inspectingApp;
                        setInspectingApp(null);
                        setApprovingApp(app);
                      }}
                    >
                      Approve & Issue Policy
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      style={{
                        color: "#dc2626",
                        borderColor: "#fecaca",
                      }}
                      onClick={() => {
                        const app = inspectingApp;
                        setInspectingApp(null);
                        setRejectingApp(app);
                        setRejectionReason("");
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: APPROVE CONFIRMATION */}
      {approvingApp && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "460px" }}>
            <div
              className="modal-header-banner"
              style={{
                background: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
                textAlign: "center",
                padding: "1.75rem 1.5rem",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                  fontSize: "24px",
                  color: "#ffffff",
                }}
              >
                ✓
              </div>

              <h2 className="modal-title" style={{ fontSize: "1.3rem" }}>
                Approve Application?
              </h2>
              <p className="modal-subtitle" style={{ color: "#d1fae5" }}>
                This will automatically issue an active policy to the customer.
              </p>
            </div>

            <div
              style={{
                padding: "1.5rem 1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Applicant:</span>
                  <strong>
                    {approvingApp.customer_name || approvingApp.customer_id}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Plan:</span>
                  <strong>{approvingApp.plan_name}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Coverage:</span>
                  <strong style={{ color: "var(--accent-emerald)" }}>
                    {formatCurrency(approvingApp.coverage_amount)}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Monthly Premium:
                  </span>
                  <strong>
                    {formatCurrency(approvingApp.premium_amount)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setApprovingApp(null)}
                  disabled={processing}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-btn"
                  style={{
                    background: "#059669",
                    borderColor: "#059669",
                  }}
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? "Issuing Policy..." : "Confirm & Issue Policy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: REJECT APPLICATION */}
      {rejectingApp && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "460px" }}>
            <div
              className="modal-header-banner"
              style={{
                background: "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
              }}
            >
              <div className="modal-header-top">
                <span className="modal-badge">Application Review</span>
                <button
                  className="modal-close-btn"
                  onClick={() => setRejectingApp(null)}
                >
                  ✕
                </button>
              </div>

              <h2 className="modal-title" style={{ fontSize: "1.3rem" }}>
                Reject Application
              </h2>
              <p className="modal-subtitle" style={{ color: "#fee2e2" }}>
                Applicant: {rejectingApp.customer_name || rejectingApp.customer_id}
              </p>
            </div>

            <form
              onSubmit={handleReject}
              style={{
                padding: "1.5rem 1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div className="form-field">
                <label className="form-label">
                  Rejection Reason (Required)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete medical history, pre-existing condition beyond plan threshold..."
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setRejectingApp(null)}
                  disabled={processing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  style={{
                    background: "#dc2626",
                    borderColor: "#dc2626",
                  }}
                  disabled={processing}
                >
                  {processing ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

};
