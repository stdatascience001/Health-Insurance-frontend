import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminDashboard,
  type AdminDashboardStats,
} from "../../services/customerservices";
import {
  getAllCancellationRequests,
  reviewCancellationRequest,
  type PolicyCancellationRequest,
} from "../../services/policies";

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cancellation request states
  const [requests, setRequests] = useState<PolicyCancellationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");

  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const pageSize = 10;

  // Review modal states
  const [selectedRequest, setSelectedRequest] =
    useState<PolicyCancellationRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">(
    "approved"
  );
  const [adminRemarks, setAdminRemarks] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // View details modal for completed requests
  const [viewingRequest, setViewingRequest] =
    useState<PolicyCancellationRequest | null>(null);

  // Load dashboard statistics
  const loadDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const data = await getAdminDashboard(token);
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load dashboard stats."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load cancellation requests
  const loadCancellationRequests = async () => {
    if (!token) return;

    try {
      setRequestsLoading(true);
      setRequestsError("");

      const data = await getAllCancellationRequests(
        token,
        currentPage * pageSize,
        pageSize,
        statusFilter || undefined
      );

      setRequests(data.items);
      setTotalRequests(data.total);
    } catch (err) {
      console.error("Failed to load cancellation requests:", err);
      setRequestsError(
        err instanceof Error
          ? err.message
          : "Unable to load cancellation requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [token]);

  useEffect(() => {
    loadCancellationRequests();
  }, [token, currentPage, statusFilter]);

  // Open review modal
  const openReviewModal = (
    request: PolicyCancellationRequest,
    status: "approved" | "rejected"
  ) => {
    setSelectedRequest(request);
    setReviewStatus(status);
    setAdminRemarks("");
    setReviewError("");
  };

  // Submit admin review
  const handleReviewSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token || !selectedRequest) return;

    try {
      setReviewLoading(true);
      setReviewError("");
      setSuccessMessage("");

      await reviewCancellationRequest(token, selectedRequest.id, {
        status: reviewStatus,
        admin_remarks: adminRemarks.trim() || undefined,
      });

      setSuccessMessage(
        `Cancellation request for policy "${selectedRequest.policy_number || selectedRequest.id}" was ${reviewStatus} successfully.`
      );

      setSelectedRequest(null);
      setAdminRemarks("");

      await loadCancellationRequests();
      await loadDashboard();
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : "Failed to review cancellation request."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // Filter requests locally if search query is provided
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter(
      (r) =>
        (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
        (r.customer_email && r.customer_email.toLowerCase().includes(q)) ||
        (r.policy_number && r.policy_number.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q))
    );
  }, [requests, searchQuery]);

  const totalPages = Math.ceil(totalRequests / pageSize);

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <span className="admin-status-badge pending">
            <span className="status-dot-pulse" />
            Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="admin-status-badge approved">
            ✓ Approved
          </span>
        );
      case "rejected":
        return (
          <span className="admin-status-badge rejected">
            ✕ Rejected
          </span>
        );
      default:
        return <span className="admin-status-badge">{status}</span>;
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Operational metrics
  const conversionRate = useMemo(() => {
    if (!stats?.total_applications || stats.total_applications === 0) return 0;
    return Math.round(((stats.total_policies || 0) / stats.total_applications) * 100);
  }, [stats]);

  return (
    <div className="main-content">
      {/* EXECUTIVE HEADER */}
      <div className="view-header">
        <div className="view-title-wrap">
          <span className="view-eyebrow">
            <span className="live-status-dot" />
            Executive Operations Command Center
          </span>

          <h1 className="view-title">Insurance Administration Dashboard</h1>

          <p className="view-description">
            Real-time analytics, underwriting performance, member lifecycle monitoring, and policy cancellation compliance.
          </p>
        </div>

        <div className="view-actions">
          <button
            className="secondary-btn"
            onClick={() => {
              loadDashboard();
              loadCancellationRequests();
            }}
            disabled={loading || requestsLoading}
            title="Reload latest statistics and cancellation queue"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading || requestsLoading ? "spin-icon" : ""}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading || requestsLoading ? "Syncing..." : "Sync Live Data"}</span>
          </button>

          <Link to="/admin/applications" className="primary-btn">
            Open Underwriting Desk →
          </Link>
        </div>
      </div>

      {/* TOAST BANNERS */}
      {error && (
        <div className="toast-banner error">
          <span>⚠ {error}</span>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="toast-banner success">
          <span>✓ {successMessage}</span>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            onClick={() => setSuccessMessage("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* 4-COLUMN BALANCED KPI METRICS STRIP */}
      <div className="metrics-strip-four">
        {/* Card 1: Registered Accounts */}
        <div className="metric-strip-card">
          <div className="metric-icon-box teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <div className="metric-strip-info">
            <span className="metric-strip-label">Registered Users</span>
            <span className="metric-strip-value">
              {loading ? "—" : stats?.total_users ?? 0}
            </span>
            <span className="metric-strip-sub">Total database accounts</span>
          </div>
        </div>

        {/* Card 2: Total Policyholders */}
        <div className="metric-strip-card">
          <div className="metric-icon-box emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          <div className="metric-strip-info">
            <span className="metric-strip-label">Enrolled Customers</span>
            <span className="metric-strip-value" style={{ color: "var(--accent-emerald)" }}>
              {loading ? "—" : stats?.total_customers ?? 0}
            </span>
            <span className="metric-strip-sub">Verified policyholders</span>
          </div>
        </div>

        {/* Card 3: Applications Submitted */}
        <div className="metric-strip-card">
          <div className="metric-icon-box blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>

          <div className="metric-strip-info">
            <span className="metric-strip-label">Total Applications</span>
            <span className="metric-strip-value">
              {loading ? "—" : stats?.total_applications ?? 0}
            </span>
            <span className="metric-strip-sub">Customer submissions</span>
          </div>
        </div>

        {/* Card 4: Active Policies */}
        <div className="metric-strip-card">
          <div className="metric-icon-box indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          <div className="metric-strip-info">
            <span className="metric-strip-label">Active Policies</span>
            <span className="metric-strip-value" style={{ color: "var(--primary-700)" }}>
              {loading ? "—" : stats?.total_policies ?? 0}
            </span>
            <span className="metric-strip-sub">
              {conversionRate > 0 ? `${conversionRate}% conversion rate` : "Active contracts"}
            </span>
          </div>
        </div>
      </div>

      {/* QUICK WORKSPACE TILES */}
      <div className="admin-workspaces-section">
        <div className="admin-workspace-card">
          <div className="admin-workspace-top">
            <div className="metric-icon-box blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 15h6M9 11h6" />
              </svg>
            </div>
            <span className="workspace-badge blue">Underwriting</span>
          </div>

          <h3 className="admin-workspace-title">Underwriting &amp; Policies</h3>
          <p className="admin-workspace-desc">
            Review pending health insurance applications, inspect medical history disclosures, approve or reject coverage requests, and audit issued policies.
          </p>

          <Link to="/admin/applications" className="admin-workspace-link">
            <span>Open Underwriting Queue</span>
            <span>→</span>
          </Link>
        </div>

        <div className="admin-workspace-card">
          <div className="admin-workspace-top">
            <div className="metric-icon-box teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="workspace-badge teal">CRM</span>
          </div>

          <h3 className="admin-workspace-title">Customer Management</h3>
          <p className="admin-workspace-desc">
            Access the directory of individual policyholders, inspect identity records, update profile data, verify contact information, and manage member statuses.
          </p>

          <Link to="/admin/customers" className="admin-workspace-link">
            <span>Manage Policyholders</span>
            <span>→</span>
          </Link>
        </div>

        <div className="admin-workspace-card">
          <div className="admin-workspace-top">
            <div className="metric-icon-box emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="workspace-badge emerald">Catalog</span>
          </div>

          <h3 className="admin-workspace-title">Insurance Plans Catalog</h3>
          <p className="admin-workspace-desc">
            Configure coverage limits, adjust monthly premiums, activate or deactivate individual plans, and publish new insurance options to the marketplace.
          </p>

          <Link to="/admin/plans" className="admin-workspace-link">
            <span>Configure Plans Catalog</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* POLICY CANCELLATION REQUESTS MANAGEMENT */}
      <div className="content-card" style={{ marginTop: "1.75rem" }}>
        {/* SECTION HEADER */}
        <div className="admin-section-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 className="admin-section-title">Policy Cancellation Requests</h2>
              <span className="count-pill">
                {totalRequests} {statusFilter ? statusFilter : "total"}
              </span>
            </div>
            <p className="admin-section-subtitle">
              Audit, investigate, and approve or reject policy cancellation requests submitted by individual policyholders.
            </p>
          </div>
        </div>

        {/* TOOLBAR: SEARCH & STATUS TABS */}
        <div className="admin-cancellation-toolbar">
          <div className="admin-cancellation-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by customer name, email, or policy #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="admin-status-filters" role="group" aria-label="Filter requests by status">
            <button
              type="button"
              className={`admin-filter-pill ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(0);
              }}
            >
              Pending Review
            </button>
            <button
              type="button"
              className={`admin-filter-pill ${statusFilter === "approved" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("approved");
                setCurrentPage(0);
              }}
            >
              Approved
            </button>
            <button
              type="button"
              className={`admin-filter-pill ${statusFilter === "rejected" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("rejected");
                setCurrentPage(0);
              }}
            >
              Rejected
            </button>
            <button
              type="button"
              className={`admin-filter-pill ${statusFilter === "" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("");
                setCurrentPage(0);
              }}
            >
              All Requests
            </button>
          </div>
        </div>

        {requestsError && (
          <div className="toast-banner error" style={{ margin: "0 1.5rem 1rem" }}>
            ⚠ {requestsError}
          </div>
        )}

        {/* TABLE */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Policy Number</th>
                <th>Cancellation Reason</th>
                <th>Requested Date</th>
                <th>Review Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {requestsLoading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-state">Loading cancellation requests...</div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-state">
                      {searchQuery
                        ? "No cancellation requests match your search."
                        : `No ${statusFilter || ""} cancellation requests found.`}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    {/* Customer */}
                    <td>
                      <div className="table-customer-cell">
                        <span className="customer-avatar-chip">
                          {getInitials(request.customer_name)}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong style={{ color: "var(--text-main)", fontSize: "0.92rem" }}>
                            {request.customer_name || "Unknown Customer"}
                          </strong>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {request.customer_email || "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Policy ID (Fixed nested td bug) */}
                    <td>
                      <span className="policy-number-chip">
                        {request.policy_number || "N/A"}
                      </span>
                    </td>

                    {/* Reason */}
                    <td style={{ maxWidth: "280px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <strong style={{ color: "var(--text-main)", fontSize: "0.86rem" }}>
                          {request.reason}
                        </strong>
                        {request.additional_comments && (
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {request.additional_comments}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <span style={{ fontSize: "0.84rem", color: "var(--text-body)" }}>
                        {formatDate(request.requested_at)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td>
                      {getStatusBadge(request.status)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        {request.status.toLowerCase() === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="admin-action-btn approve"
                              onClick={() => openReviewModal(request, "approved")}
                              title="Approve cancellation and initiate policy termination"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="admin-action-btn reject"
                              onClick={() => openReviewModal(request, "rejected")}
                              title="Reject cancellation request"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="plan-preview-btn"
                            onClick={() => setViewingRequest(request)}
                            title="View audit remarks and decision details"
                          >
                            View Audit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="table-footer">
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Showing{" "}
            <strong>
              {totalRequests === 0 ? 0 : currentPage * pageSize + 1}
              {"–"}
              {Math.min((currentPage + 1) * pageSize, totalRequests)}
            </strong>{" "}
            of <strong>{totalRequests}</strong> requests
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage === 0 || requestsLoading}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", padding: "0 4px" }}>
              Page {currentPage + 1} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage + 1 >= totalPages || requestsLoading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* REVIEW DECISION MODAL */}
      {selectedRequest && (
        <div
          className="modal-backdrop"
          onClick={() => !reviewLoading && setSelectedRequest(null)}
        >
          <div
            className="modal-card admin-review-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            {/* MODAL HEADER */}
            <div className={`modal-header-banner ${reviewStatus === "approved" ? "approved-banner" : "rejected-banner"}`}>
              <div className="modal-header-top">
                <span className="modal-badge">
                  {reviewStatus === "approved" ? "Approval Action" : "Rejection Action"}
                </span>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedRequest(null)}
                  disabled={reviewLoading}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <h2 className="modal-title" id="review-modal-title">
                {reviewStatus === "approved"
                  ? "Approve Policy Cancellation"
                  : "Reject Policy Cancellation"}
              </h2>
              <p className="modal-subtitle">
                {reviewStatus === "approved"
                  ? "Terminating policy contract. Customer coverage will be officially cancelled."
                  : "Rejecting cancellation request. The customer's policy will remain active."}
              </p>
            </div>

            <div className="plan-modal-body">
              {/* POLICY SUMMARY CARD */}
              <div className="admin-review-summary-card">
                <div className="review-summary-row">
                  <span className="review-summary-label">Policy Number</span>
                  <strong className="review-summary-val">
                    {selectedRequest.policy_number || "N/A"}
                  </strong>
                </div>

                <div className="review-summary-row">
                  <span className="review-summary-label">Customer</span>
                  <span className="review-summary-val">
                    {selectedRequest.customer_name || "Unknown"} ({selectedRequest.customer_email || "No email"})
                  </span>
                </div>

                <div className="review-summary-row">
                  <span className="review-summary-label">Stated Reason</span>
                  <strong className="review-summary-val" style={{ color: "var(--accent-rose)" }}>
                    {selectedRequest.reason}
                  </strong>
                </div>

                {selectedRequest.additional_comments && (
                  <div className="review-summary-row comments">
                    <span className="review-summary-label">Customer Comments</span>
                    <p className="review-summary-comment-text">
                      "{selectedRequest.additional_comments}"
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-field">
                  <label htmlFor="admin-remarks" className="form-label">
                    <span>Admin Decision Remarks</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Optional</span>
                  </label>

                  <textarea
                    id="admin-remarks"
                    className="form-input"
                    rows={3}
                    value={adminRemarks}
                    onChange={(event) => setAdminRemarks(event.target.value)}
                    placeholder={
                      reviewStatus === "approved"
                        ? "e.g. Verified customer request. Cancellation approved in accordance with policy terms."
                        : "e.g. Request rejected as the policy is past the eligible cancellation grace period."
                    }
                    style={{ resize: "vertical", height: "auto" }}
                  />
                </div>

                {reviewError && (
                  <div className="toast-banner error">
                    ⚠ {reviewError}
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setSelectedRequest(null)}
                    disabled={reviewLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={reviewStatus === "approved" ? "primary-btn" : "danger-btn"}
                    disabled={reviewLoading}
                  >
                    {reviewLoading
                      ? "Processing Decision..."
                      : reviewStatus === "approved"
                        ? "Confirm Approval & Terminate"
                        : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS / AUDIT MODAL */}
      {viewingRequest && (
        <div
          className="modal-backdrop"
          onClick={() => setViewingRequest(null)}
        >
          <div
            className="modal-card admin-review-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-banner">
              <div className="modal-header-top">
                <span className="modal-badge">Cancellation Audit</span>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setViewingRequest(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <h2 className="modal-title">Cancellation Audit Record</h2>
              <p className="modal-subtitle">
                Historical record and decision remarks for Policy {viewingRequest.policy_number || viewingRequest.id}
              </p>
            </div>

            <div className="plan-modal-body">
              <div className="admin-review-summary-card">
                <div className="review-summary-row">
                  <span className="review-summary-label">Status</span>
                  <div>{getStatusBadge(viewingRequest.status)}</div>
                </div>

                <div className="review-summary-row">
                  <span className="review-summary-label">Policyholder</span>
                  <span className="review-summary-val">
                    {viewingRequest.customer_name || "Unknown"} ({viewingRequest.customer_email || "—"})
                  </span>
                </div>

                <div className="review-summary-row">
                  <span className="review-summary-label">Reason</span>
                  <strong className="review-summary-val">{viewingRequest.reason}</strong>
                </div>

                {viewingRequest.additional_comments && (
                  <div className="review-summary-row comments">
                    <span className="review-summary-label">Customer Comments</span>
                    <p className="review-summary-comment-text">"{viewingRequest.additional_comments}"</p>
                  </div>
                )}

                <div className="review-summary-row">
                  <span className="review-summary-label">Requested On</span>
                  <span className="review-summary-val">{formatDate(viewingRequest.requested_at)}</span>
                </div>

                {viewingRequest.reviewed_at && (
                  <div className="review-summary-row">
                    <span className="review-summary-label">Reviewed On</span>
                    <span className="review-summary-val">{formatDate(viewingRequest.reviewed_at)}</span>
                  </div>
                )}

                {viewingRequest.admin_remarks && (
                  <div className="review-summary-row comments">
                    <span className="review-summary-label">Admin Remarks</span>
                    <p className="review-summary-comment-text" style={{ color: "var(--primary-800)" }}>
                      "{viewingRequest.admin_remarks}"
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setViewingRequest(null)}
                >
                  Close Record
                </button>
              </div>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};
