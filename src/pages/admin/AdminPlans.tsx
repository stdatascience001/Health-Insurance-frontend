import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllPlans,
  createPlan,
  updatePlanStatus,
  type Plan,
  type PlanCreate,
} from "../../services/plans";
import { PlanDetailsModal } from "../../components/PlanDetailsModal";

function formatCurrency(amount: number | string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLakhsWords(amount: number | string) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `${cr % 1 === 0 ? cr : cr.toFixed(2)} Crore${cr > 1 ? "s" : ""}`;
  }
  if (value >= 100000) {
    const lk = value / 100000;
    return `${lk % 1 === 0 ? lk : lk.toFixed(1)} Lakh${lk > 1 ? "s" : ""}`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return "";
}

const COVERAGE_PRESETS = [
  { label: "₹5 Lakhs", value: 500000 },
  { label: "₹10 Lakhs", value: 1000000 },
  { label: "₹20 Lakhs", value: 2000000 },
  { label: "₹50 Lakhs", value: 5000000 },
  { label: "₹1 Crore", value: 10000000 },
];

const DURATION_PRESETS = [
  { label: "12 Months (1 Year)", value: 12 },
  { label: "24 Months (2 Years)", value: 24 },
  { label: "36 Months (3 Years)", value: 36 },
];

export const AdminPlans: React.FC = () => {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Plan Details Preview Modal
  const [previewPlan, setPreviewPlan] = useState<Plan | null>(null);

  // Create Plan Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [premiumAmount, setPremiumAmount] = useState("");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("12");
  const [saving, setSaving] = useState(false);

  // Update plan status tracking
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const loadPlans = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getAllPlans(token);
      setPlans(data);
    } catch (err) {
      console.error("Failed to load admin plans:", err);
      setError(err instanceof Error ? err.message : "Unable to load insurance plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [token]);

  // Key KPI stats
  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.is_active).length;
    const inactive = total - active;
    const avgPrem = total
      ? Math.round(
          plans.reduce((sum, p) => sum + Number(p.premium_amount || 0), 0) / total
        )
      : 0;
    return { total, active, inactive, avgPrem };
  }, [plans]);

  // Filtered & Paginated Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        plan.name.toLowerCase().includes(q) ||
        (plan.description && plan.description.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && plan.is_active) ||
        (statusFilter === "inactive" && !plan.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredPlans.length / pageSize);

  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreatePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    const premium = parseFloat(premiumAmount);
    const coverage = parseFloat(coverageAmount);
    const duration = parseInt(durationMonths, 10);

    if (isNaN(premium) || premium <= 0) {
      setError("Premium amount must be greater than 0.");
      return;
    }

    if (isNaN(coverage) || coverage <= 0) {
      setError("Coverage amount must be greater than 0.");
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      setError("Duration must be at least 1 month.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: PlanCreate = {
        name: name.trim(),
        description: description.trim() || null,
        premium_amount: premium,
        coverage_amount: coverage,
        duration_months: duration,
      };

      const res = await createPlan(token, payload);
      setPlans((prev) => [res.plan, ...prev]);
      setCurrentPage(1);

      // Reset form
      setName("");
      setDescription("");
      setPremiumAmount("");
      setCoverageAmount("");
      setDurationMonths("12");
      setShowAddModal(false);

      setSuccessToast(`Plan "${res.plan.name}" published successfully.`);
      setTimeout(() => setSuccessToast(""), 4500);
    } catch (err) {
      console.error("Failed to create plan:", err);
      setError(err instanceof Error ? err.message : "Failed to create plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlanStatus = async (plan: Plan) => {
    if (!token || updatingPlanId) return;

    const newStatus = !plan.is_active;

    try {
      setUpdatingPlanId(plan.id);
      setError("");

      const response = await updatePlanStatus(token, plan.id, newStatus);

      setPlans((prev) =>
        prev.map((item) => (item.id === plan.id ? response.plan : item))
      );

      setSuccessToast(
        `"${plan.name}" ${newStatus ? "activated" : "deactivated"} successfully.`
      );

      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      console.error("Failed to update plan status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update plan status."
      );
    } finally {
      setUpdatingPlanId(null);
    }
  };

  return (
    <div className="main-content">
      {/* VIEW HEADER */}
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
            Plan Catalog Administration
          </span>
          <h1 className="view-title">Manage Insurance Plans</h1>
          <p className="view-description">
            Configure, publish, and monitor individual health insurance coverage schedules offered to policyholders.
          </p>
        </div>

        <div className="view-actions">
          <button className="secondary-btn" onClick={loadPlans} disabled={loading}>
            {loading ? "Syncing..." : "Refresh Plans"}
          </button>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            + Create New Plan
          </button>
        </div>
      </div>

      {/* TOASTS */}
      {successToast && (
        <div className="toast-banner success">
          <span>✓ {successToast}</span>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            onClick={() => setSuccessToast("")}
          >
            ✕
          </button>
        </div>
      )}

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

      {/* KPI METRICS STRIP */}
      <div className="metrics-strip">
        <div className="metric-strip-card">
          <div className="metric-icon-box teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div className="metric-strip-info">
            <span className="metric-strip-label">Total Plans</span>
            <span className="metric-strip-value">{stats.total}</span>
            <span className="metric-strip-sub">Configured in database</span>
          </div>
        </div>

        <div className="metric-strip-card">
          <div className="metric-icon-box emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="metric-strip-info">
            <span className="metric-strip-label">Active in Catalog</span>
            <span className="metric-strip-value" style={{ color: "var(--accent-emerald)" }}>
              {stats.active}
            </span>
            <span className="metric-strip-sub">Live for customer purchase</span>
          </div>
        </div>

        <div className="metric-strip-card">
          <div className="metric-icon-box blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="metric-strip-info">
            <span className="metric-strip-label">Avg. Monthly Premium</span>
            <span className="metric-strip-value">{formatCurrency(stats.avgPrem)}</span>
            <span className="metric-strip-sub">Across all catalog plans</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="admin-plans-toolbar">
        <div className="admin-plans-search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search plans by name or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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

        <div className="admin-status-filters" role="group" aria-label="Filter by status">
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            All Plans ({plans.length})
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("active");
              setCurrentPage(1);
            }}
          >
            Active ({stats.active})
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === "inactive" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("inactive");
              setCurrentPage(1);
            }}
          >
            Inactive ({stats.inactive})
          </button>
        </div>
      </div>

      {/* PLANS TABLE */}
      <div className="content-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Plan Name &amp; Overview</th>
                <th>Monthly Premium</th>
                <th>Sum Insured</th>
                <th>Duration</th>
                <th>Catalog Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-state">Loading insurance plans...</div>
                  </td>
                </tr>
              ) : paginatedPlans.length > 0 ? (
                paginatedPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td style={{ maxWidth: "320px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <strong style={{ color: "var(--text-main)", fontSize: "0.95rem" }}>
                          {plan.name}
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                          {plan.description || "Healthcare coverage designed exclusively for individual policyholders."}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                        <span style={{ fontWeight: 800, color: "var(--primary-700)", fontSize: "0.96rem" }}>
                          {formatCurrency(plan.premium_amount)}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-light)" }}>/ mo</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 800, color: "var(--accent-emerald)", fontSize: "0.96rem" }}>
                          {formatCurrency(plan.coverage_amount)}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {formatLakhsWords(plan.coverage_amount)} dedicated limit
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="duration-chip">
                        {plan.duration_months} Months
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-pill ${plan.is_active ? "active" : ""}`}
                        style={{ minWidth: "72px", textAlign: "center" }}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                        {/* CUSTOMER PREVIEW BUTTON */}
                        <button
                          type="button"
                          className="plan-preview-btn"
                          onClick={() => setPreviewPlan(plan)}
                          title="Preview how customers see this plan in PlanDetailsModal"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Preview</span>
                        </button>

                        {/* STATUS TOGGLE SWITCH */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={plan.is_active}
                          aria-label={`${plan.is_active ? "Deactivate" : "Activate"} ${plan.name}`}
                          disabled={updatingPlanId !== null}
                          onClick={() => handleTogglePlanStatus(plan)}
                          title={plan.is_active ? "Click to deactivate plan" : "Click to activate plan"}
                          className={`plan-toggle-switch ${plan.is_active ? "active" : ""}`}
                        >
                          <span className="plan-toggle-handle" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-state">
                      {searchQuery || statusFilter !== "all"
                        ? "No plans match your current search or filter criteria."
                        : "No insurance plans created yet. Click '+ Create New Plan' to publish your first plan."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="table-footer">
          <span>
            Showing{" "}
            <strong>
              {filteredPlans.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(currentPage * pageSize, filteredPlans.length)}
            </strong>{" "}
            of <strong>{filteredPlans.length}</strong> {filteredPlans.length !== plans.length && `(filtered from ${plans.length})`} plans
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE PLAN MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => !saving && setShowAddModal(false)}>
          <div className="modal-card admin-plan-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-banner">
              <div className="modal-header-top">
                <span className="modal-badge">Plan Catalog Manager</span>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <h2 className="modal-title">Create Insurance Plan</h2>
              <p className="modal-subtitle">
                Configure coverage limits, monthly premiums, and descriptions for individual policyholders.
              </p>
            </div>

            <form className="modal-form" onSubmit={handleCreatePlan}>
              <div className="form-field">
                <label className="form-label">
                  <span>Plan Name</span>
                  <span className="label-required">* Required</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Executive Platinum Shield"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={3}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  <span>Plan Description / Key Highlights</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Optional</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Summary of specific benefits, highlights, or hospital network notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: "vertical", height: "auto" }}
                />
              </div>

              {/* COVERAGE AMOUNT WITH PRESETS */}
              <div className="form-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Sum Insured / Annual Coverage (₹)</span>
                    <span className="label-required">* Required</span>
                  </label>
                  {coverageAmount && !isNaN(Number(coverageAmount)) && Number(coverageAmount) > 0 && (
                    <span className="formatted-preview-pill">
                      {formatCurrency(coverageAmount)} ({formatLakhsWords(coverageAmount)})
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 1000000"
                  value={coverageAmount}
                  onChange={(e) => setCoverageAmount(e.target.value)}
                  required
                  style={{ marginTop: "6px" }}
                />

                {/* Quick Presets */}
                <div className="preset-buttons-row">
                  <span className="preset-label">Quick Presets:</span>
                  {COVERAGE_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={`preset-btn ${coverageAmount === String(p.value) ? "selected" : ""}`}
                      onClick={() => setCoverageAmount(String(p.value))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MONTHLY PREMIUM */}
              <div className="form-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Monthly Premium (₹)</span>
                    <span className="label-required">* Required</span>
                  </label>
                  {premiumAmount && !isNaN(Number(premiumAmount)) && Number(premiumAmount) > 0 && (
                    <span className="formatted-preview-pill premium">
                      {formatCurrency(premiumAmount)} / month
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 1200"
                  value={premiumAmount}
                  onChange={(e) => setPremiumAmount(e.target.value)}
                  required
                  style={{ marginTop: "6px" }}
                />
              </div>

              {/* DURATION WITH PRESETS */}
              <div className="form-field">
                <label className="form-label">
                  <span>Policy Tenure / Duration (Months)</span>
                  <span className="label-required">* Required</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="12"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  required
                />
                <div className="preset-buttons-row">
                  <span className="preset-label">Tenure:</span>
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      className={`preset-btn ${durationMonths === String(d.value) ? "selected" : ""}`}
                      onClick={() => setDurationMonths(String(d.value))}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Publishing Plan..." : "Publish Plan to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN DETAILS PREVIEW MODAL */}
      <PlanDetailsModal
        plan={previewPlan}
        onClose={() => setPreviewPlan(null)}
      />
    </div>
  );
};
