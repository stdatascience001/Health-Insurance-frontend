import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  updatePlanStatus,
  type Plan,
  type PlanCreate,
  type PlanPricingRule,
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

interface PricingRuleForm {
  min_age: string;
  max_age: string;
  coverage_amount: string;
  duration_months: string;
  premium_frequency: "annual" | "monthly";
  premium_amount: string;
  is_active: boolean;
}

interface BenefitForm {
  benefit_name: string;
  description: string;
  is_included: boolean;
}

interface ConditionForm {
  condition_type: string;
  condition_value: string;
  description: string;
}

const emptyPricingRule = (): PricingRuleForm => ({
  min_age: "18",
  max_age: "65",
  coverage_amount: "1000000",
  duration_months: "12",
  premium_frequency: "annual",
  premium_amount: "",
  is_active: true,
});

const emptyBenefit = (): BenefitForm => ({
  benefit_name: "",
  description: "",
  is_included: true,
});

const emptyCondition = (): ConditionForm => ({
  condition_type: "waiting_period",
  condition_value: "",
  description: "",
});

export const AdminPlans: React.FC = () => {
  const { token } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [previewPlan, setPreviewPlan] = useState<Plan | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Basic plan information
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [planType, setPlanType] = useState("individual");
  const [minEntryAge, setMinEntryAge] = useState("18");
  const [maxEntryAge, setMaxEntryAge] = useState("65");
  const [durationMonths, setDurationMonths] = useState("12");

  // Dynamic configuration sections
  const [pricingRules, setPricingRules] = useState<PricingRuleForm[]>([
    emptyPricingRule(),
  ]);

  const [benefits, setBenefits] = useState<BenefitForm[]>([
    emptyBenefit(),
  ]);

  const [conditions, setConditions] = useState<ConditionForm[]>([
    emptyCondition(),
  ]);

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
      setError(
        err instanceof Error ? err.message : "Unable to load insurance plans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [token]);

  // Only explicitly configured active monthly rules contribute to this KPI.
  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.is_active).length;
    const inactive = total - active;

    const monthlyRules = plans
      .filter((plan) => plan.is_active)
      .flatMap((plan) =>
        (plan.pricing_rules ?? []).filter(
          (rule) =>
            rule.is_active && rule.premium_frequency === "monthly"
        )
      );

    const avgPrem = monthlyRules.length
      ? Math.round(
        monthlyRules.reduce(
          (sum, rule) => sum + Number(rule.premium_amount || 0),
          0
        ) / monthlyRules.length
      )
      : 0;

    return { total, active, inactive, avgPrem };
  }, [plans]);

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

  const getMonthlyRule = (plan: Plan) => {
    return plan.pricing_rules?.find(
      (rule) =>
        rule.premium_frequency === "monthly" && rule.is_active
    ) ?? null;
  };

  const getHighestCoverageRule = (plan: Plan): PlanPricingRule | undefined =>
    [...(plan.pricing_rules ?? [])]
      .filter((rule) => rule.is_active)
      .sort(
        (a, b) =>
          Number(b.coverage_amount) - Number(a.coverage_amount)
      )[0];

  const resetForm = () => {
    setName("");
    setDescription("");
    setPlanType("individual");
    setMinEntryAge("18");
    setMaxEntryAge("65");
    setDurationMonths("12");
    setPricingRules([emptyPricingRule()]);
    setBenefits([emptyBenefit()]);
    setConditions([emptyCondition()]);
    setEditingPlanId(null);
  };

  const handleEditPlan = async (plan: Plan) => {
    if (!token) {
      setError("Authentication required.");
      return;
    }
    try {
      setError("");
      setSaving(true);

      const existingPlan = await getPlanById(token, plan.id);

      setName(existingPlan.name);
      setDescription(existingPlan.description ?? "");
      setPlanType(existingPlan.plan_type);
      setMinEntryAge(String(existingPlan.min_entry_age));
      setMaxEntryAge(String(existingPlan.max_entry_age));
      setDurationMonths(String(existingPlan.duration_months));

      setPricingRules(
        (existingPlan.pricing_rules ?? []).map((rule) => ({
          min_age: String(rule.min_age),
          max_age: String(rule.max_age),
          coverage_amount: String(rule.coverage_amount),
          duration_months: String(rule.duration_months),
          premium_frequency: rule.premium_frequency.trim() as "annual" | "monthly",
          premium_amount: String(rule.premium_amount),
          is_active: rule.is_active,
        }))
      );

      setBenefits(
        (existingPlan.benefits ?? []).map((benefit) => ({
          benefit_name: benefit.benefit_name,
          description: benefit.description ?? "",
          is_included: benefit.is_included,
        }))
      );

      setConditions(
        (existingPlan.conditions ?? []).map((condition) => ({
          condition_type: condition.condition_type,
          condition_value: condition.condition_value,
          description: condition.description ?? "",
        }))
      );

      setEditingPlanId(existingPlan.id);
      setShowAddModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load plan details."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAddModal = () => {
    if (saving) return;
    setShowAddModal(false);
    resetForm();
  };

  const updatePricingRule = (
    index: number,
    field: keyof PricingRuleForm,
    value: string | boolean
  ) => {
    setPricingRules((prev) =>
      prev.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      )
    );
  };

  const updateBenefit = (
    index: number,
    field: keyof BenefitForm,
    value: string | boolean
  ) => {
    setBenefits((prev) =>
      prev.map((benefit, i) =>
        i === index ? { ...benefit, [field]: value } : benefit
      )
    );
  };

  const updateCondition = (
    index: number,
    field: keyof ConditionForm,
    value: string
  ) => {
    setConditions((prev) =>
      prev.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    );
  };

  const handleCreatePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) return;

    const minAge = Number(minEntryAge);
    const maxAge = Number(maxEntryAge);
    const duration = Number(durationMonths);

    if (!name.trim() || name.trim().length < 3) {
      setError("Plan name must contain at least 3 characters.");
      return;
    }

    if (
      !Number.isInteger(minAge) ||
      !Number.isInteger(maxAge) ||
      minAge < 18 ||
      maxAge < minAge
    ) {
      setError("Enter a valid entry age range. Minimum age must be at least 18.");
      return;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      setError("Policy duration must be at least 1 month.");
      return;
    }

    if (pricingRules.length === 0) {
      setError("Add at least one pricing rule.");
      return;
    }

    for (let i = 0; i < pricingRules.length; i++) {
      const rule = pricingRules[i];
      const ruleMinAge = Number(rule.min_age);
      const ruleMaxAge = Number(rule.max_age);
      const coverage = Number(rule.coverage_amount);
      const premium = Number(rule.premium_amount);
      const ruleDuration = Number(rule.duration_months);

      if (
        !Number.isInteger(ruleMinAge) ||
        !Number.isInteger(ruleMaxAge) ||
        ruleMinAge < minAge ||
        ruleMaxAge > maxAge ||
        ruleMaxAge < ruleMinAge
      ) {
        setError(
          `Pricing rule ${i + 1}: Enter a valid age range within the plan's entry age range.`
        );
        return;
      }

      if (!Number.isFinite(coverage) || coverage <= 0) {
        setError(`Pricing rule ${i + 1}: Coverage amount must be greater than 0.`);
        return;
      }

      if (!Number.isFinite(premium) || premium <= 0) {
        setError(`Pricing rule ${i + 1}: Premium amount must be greater than 0.`);
        return;
      }

      if (!Number.isInteger(ruleDuration) || ruleDuration <= 0) {
        setError(`Pricing rule ${i + 1}: Enter a valid policy duration.`);
        return;
      }
    }

    const validBenefits = benefits.filter(
      (benefit) => benefit.benefit_name.trim()
    );

    const validConditions = conditions.filter(
      (condition) =>
        condition.condition_type.trim() &&
        condition.condition_value.trim()
    );

    try {
      setSaving(true);
      setError("");

      const payload: PlanCreate = {
        name: name.trim(),
        description: description.trim() || null,
        plan_type: planType,
        min_entry_age: minAge,
        max_entry_age: maxAge,
        duration_months: duration,

        pricing_rules: pricingRules.map((rule) => ({
          min_age: Number(rule.min_age),
          max_age: Number(rule.max_age),
          coverage_amount: Number(rule.coverage_amount),
          duration_months: Number(rule.duration_months),
          premium_frequency: rule.premium_frequency.trim() as "annual" | "monthly",
          premium_amount: Number(rule.premium_amount),
          is_active: rule.is_active,
        })),

        benefits: validBenefits.map((benefit) => ({
          benefit_name: benefit.benefit_name.trim(),
          description: benefit.description.trim() || null,
          is_included: benefit.is_included,
        })),

        conditions: validConditions.map((condition) => ({
          condition_type: condition.condition_type,
          condition_value: condition.condition_value.trim(),
          description: condition.description.trim() || null,
        })),
      };

      if (editingPlanId) {
        // Update existing plan
        const res = await updatePlan(token, editingPlanId, payload);

        const updatedPlans = await getAllPlans(token);
        setPlans(updatedPlans);

        setSuccessToast(`Plan "${res.plan.name}" updated successfully.`);
      } else {
        // Create new plan
        const res = await createPlan(token, payload);

        setPlans((prev) => [res.plan, ...prev]);
        setCurrentPage(1);

        setSuccessToast(`Plan "${res.plan.name}" published successfully.`);
      }

      resetForm();
      setShowAddModal(false);

      setTimeout(() => setSuccessToast(""), 4500);
    } catch (err) {
      console.error("Failed to save plan:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save plan."
      );
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

      const response = await updatePlanStatus(
        token,
        plan.id,
        newStatus
      );

      setPlans((prev) =>
        prev.map((item) =>
          item.id === plan.id ? response.plan : item
        )
      );

      setSuccessToast(
        `"${plan.name}" ${newStatus ? "activated" : "deactivated"} successfully.`
      );

      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      console.error("Failed to update plan status:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update plan status."
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
          <button
            className="secondary-btn"
            onClick={loadPlans}
            disabled={loading}
          >
            {loading ? "Syncing..." : "Refresh Plans"}
          </button>

          <button
            className="primary-btn"
            onClick={() => {
              resetForm();
              setError("");
              setShowAddModal(true);
            }}
          >
            + Create New Plan
          </button>
        </div>
      </div>

      {/* TOASTS */}
      {successToast && (
        <div className="toast-banner success">
          <span>✓ {successToast}</span>

          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontWeight: 700,
            }}
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

      {/* KPI METRICS */}
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
            <span className="metric-strip-value">
              {stats.avgPrem ? formatCurrency(stats.avgPrem) : "—"}
            </span>
            <span className="metric-strip-sub">
              Across configured active monthly rules
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="admin-plans-toolbar">
        <div className="admin-plans-search">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--text-muted)" }}
          >
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

        <div
          className="admin-status-filters"
          role="group"
          aria-label="Filter by status"
        >
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
                    <div className="table-empty-state">
                      Loading insurance plans...
                    </div>
                  </td>
                </tr>
              ) : paginatedPlans.length > 0 ? (
                paginatedPlans.map((plan) => {
                  const monthlyRule = getMonthlyRule(plan);
                  const coverageRule = getHighestCoverageRule(plan);

                  return (
                    <tr key={plan.id}>
                      <td style={{ maxWidth: "320px" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          <strong
                            style={{
                              color: "var(--text-main)",
                              fontSize: "0.95rem",
                            }}
                          >
                            {plan.name}
                          </strong>

                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                              lineHeight: 1.4,
                            }}
                          >
                            {plan.description ||
                              "Healthcare coverage designed exclusively for individual policyholders."}
                          </span>

                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--text-muted)",
                              textTransform: "capitalize",
                            }}
                          >
                            {plan.plan_type.replace(/_/g, " ")} · Ages{" "}
                            {plan.min_entry_age}–{plan.max_entry_age}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              color: "var(--primary-700)",
                              fontSize: "0.96rem",
                            }}
                          >
                            {monthlyRule
                              ? formatCurrency(monthlyRule.premium_amount)
                              : "Not configured"}
                          </span>

                          {monthlyRule && (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--text-light)",
                              }}
                            >
                              / month
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              color: "var(--accent-emerald)",
                              fontSize: "0.96rem",
                            }}
                          >
                            {coverageRule
                              ? formatCurrency(coverageRule.coverage_amount)
                              : "—"}
                          </span>

                          {coverageRule && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {formatLakhsWords(coverageRule.coverage_amount)}{" "}
                              dedicated limit
                            </span>
                          )}
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
                          style={{
                            minWidth: "72px",
                            textAlign: "center",
                          }}
                        >
                          {plan.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "10px",
                          }}
                        >
                          <button
                            type="button"
                            className="plan-preview-btn"
                            onClick={() => setPreviewPlan(plan)}
                            title="Preview plan"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>

                            <span>Preview</span>
                          </button>

                          {/* Plan Edit Button */}
                          <button
                            type="button"
                            className="plan-preview-btn"
                            onClick={() => handleEditPlan(plan)}
                            title="Edit plan"
                          >
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={plan.is_active}
                            aria-label={`${plan.is_active ? "Deactivate" : "Activate"} ${plan.name}`}
                            disabled={updatingPlanId !== null}
                            onClick={() => handleTogglePlanStatus(plan)}
                            title={
                              plan.is_active
                                ? "Click to deactivate plan"
                                : "Click to activate plan"
                            }
                            className={`plan-toggle-switch ${plan.is_active ? "active" : ""}`}
                          >
                            <span className="plan-toggle-handle" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

        {/* PAGINATION */}
        <div className="table-footer">
          <span>
            Showing{" "}
            <strong>
              {filteredPlans.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(currentPage * pageSize, filteredPlans.length)}
            </strong>{" "}
            of <strong>{filteredPlans.length}</strong>{" "}
            {filteredPlans.length !== plans.length &&
              `(filtered from ${plans.length})`}{" "}
            plans
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
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
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
        <div
          className="modal-backdrop"
          onClick={handleCloseAddModal}
        >
          <div
            className="modal-card admin-plan-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="modal-header-banner">
              <div className="modal-header-top">
                <span className="modal-badge">
                  Plan Catalog Manager
                </span>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseAddModal}
                  disabled={saving}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <h2 className="modal-title">
                {editingPlanId ? "Edit Insurance Plan" : "Create Insurance Plan"}
              </h2>

              <p className="modal-subtitle">
                Configure plan eligibility, coverage, pricing, benefits, and policy conditions.
              </p>
            </div>

            <form
              onSubmit={handleCreatePlan}
              style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
            >
              <div className="admin-modal-body-scroll">
                {/* SECTION 1: BASIC INFORMATION */}
                <div className="admin-form-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title">
                        1. Basic Information
                      </h3>
                      <p className="admin-section-desc">
                        Define the plan identity and customer eligibility.
                      </p>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <div className="admin-label-row">
                      <label className="admin-label" htmlFor="plan-modal-name">
                        Plan Name
                      </label>
                      <span className="admin-req-tag">* Required</span>
                    </div>

                    <input
                      id="plan-modal-name"
                      type="text"
                      className="admin-modal-input"
                      placeholder="e.g. Executive Platinum Shield"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      minLength={3}
                      maxLength={100}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="admin-form-group">
                    <div className="admin-label-row">
                      <label className="admin-label" htmlFor="plan-modal-desc">
                        Plan Description
                      </label>
                    </div>

                    <textarea
                      id="plan-modal-desc"
                      className="admin-modal-textarea"
                      rows={3}
                      placeholder="Describe the plan and its key highlights..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="admin-grid-3">
                    <div className="admin-form-group">
                      <label className="admin-label">
                        Plan Type <span className="admin-req-star">*</span>
                      </label>

                      <select
                        className="admin-modal-select"
                        value={planType}
                        onChange={(e) => setPlanType(e.target.value)}
                        required
                      >
                        <option value="individual">Individual</option>
                        <option value="family">Family Floater</option>
                        <option value="senior">Senior Citizen</option>
                        <option value="critical_illness">Critical Illness</option>
                        <option value="comprehensive">Comprehensive</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">
                        Minimum Entry Age
                      </label>

                      <input
                        type="number"
                        className="admin-modal-input"
                        min="0"
                        max="100"
                        value={minEntryAge}
                        onChange={(e) => setMinEntryAge(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">
                        Maximum Entry Age
                      </label>

                      <input
                        type="number"
                        className="admin-modal-input"
                        min="0"
                        max="100"
                        value={maxEntryAge}
                        onChange={(e) => setMaxEntryAge(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: COVERAGE & POLICY */}
                <div className="admin-form-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title">
                        2. Coverage &amp; Policy
                      </h3>
                      <p className="admin-section-desc">
                        Set the default policy duration. Individual coverage amounts are configured through pricing rules below.
                      </p>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">
                      Default Policy Duration (Months)
                    </label>

                    <input
                      type="number"
                      className="admin-modal-input"
                      min="1"
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(e.target.value)}
                      required
                    />

                    <div className="duration-presets-row">
                      <span className="presets-label">Duration:</span>

                      {DURATION_PRESETS.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          className={`duration-chip ${durationMonths === String(item.value) ? "active" : ""}`}
                          onClick={() => setDurationMonths(String(item.value))}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PRICING CONFIGURATION */}
                <div className="admin-form-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title">
                        3. Pricing Configuration
                      </h3>
                      <p className="admin-section-desc">
                        Configure premiums separately for each age group, coverage amount, and payment frequency.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-add-section-item"
                      onClick={() =>
                        setPricingRules((prev) => [
                          ...prev,
                          emptyPricingRule(),
                        ])
                      }
                    >
                      + Add Pricing Rule
                    </button>
                  </div>

                  {pricingRules.map((rule, index) => (
                    <div key={index} className="pricing-rule-card">
                      <div className="pricing-rule-card-header">
                        <span className="pricing-rule-card-title">
                          Pricing Rule {index + 1}
                        </span>

                        {pricingRules.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-rule"
                            onClick={() =>
                              setPricingRules((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="admin-grid-3">
                        <div className="admin-form-group">
                          <label className="admin-label">Minimum Age</label>
                          <input
                            type="number"
                            className="admin-modal-input"
                            min="0"
                            max="100"
                            value={rule.min_age}
                            onChange={(e) =>
                              updatePricingRule(index, "min_age", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-label">Maximum Age</label>
                          <input
                            type="number"
                            className="admin-modal-input"
                            min="0"
                            max="100"
                            value={rule.max_age}
                            onChange={(e) =>
                              updatePricingRule(index, "max_age", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-label">Coverage Amount (₹)</label>
                          <input
                            type="number"
                            className="admin-modal-input"
                            min="1"
                            step="1"
                            placeholder="1000000"
                            value={rule.coverage_amount}
                            onChange={(e) =>
                              updatePricingRule(index, "coverage_amount", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="admin-grid-3">
                        <div className="admin-form-group">
                          <label className="admin-label">Policy Duration (Months)</label>
                          <input
                            type="number"
                            className="admin-modal-input"
                            min="1"
                            value={rule.duration_months}
                            onChange={(e) =>
                              updatePricingRule(index, "duration_months", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-label">Payment Frequency</label>
                          <select
                            className="admin-modal-select"
                            value={rule.premium_frequency}
                            onChange={(e) =>
                              updatePricingRule(
                                index,
                                "premium_frequency",
                                e.target.value as "annual" | "monthly"
                              )
                            }
                          >
                            <option value="annual">Annual</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-label">
                            {rule.premium_frequency === "monthly"
                              ? "Monthly Premium (₹)"
                              : "Annual Premium (₹)"}
                          </label>
                          <input
                            type="number"
                            className="admin-modal-input"
                            min="0.01"
                            step="0.01"
                            placeholder={
                              rule.premium_frequency === "monthly"
                                ? "e.g. 1200"
                                : "e.g. 12000"
                            }
                            value={rule.premium_amount}
                            onChange={(e) =>
                              updatePricingRule(index, "premium_amount", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>

                      <label className="admin-checkbox-label">
                        <input
                          type="checkbox"
                          checked={rule.is_active}
                          onChange={(e) =>
                            updatePricingRule(index, "is_active", e.target.checked)
                          }
                        />
                        <span>Active pricing rule</span>
                      </label>
                    </div>
                  ))}

                  <div className="coverage-presets-row">
                    <span className="presets-label">Coverage presets:</span>

                    {COVERAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className={`coverage-chip ${pricingRules[0]?.coverage_amount === String(preset.value) ? "active" : ""}`}
                        onClick={() => {
                          updatePricingRule(
                            0,
                            "coverage_amount",
                            String(preset.value)
                          );
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTION 4: BENEFITS */}
                <div className="admin-form-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title">4. Benefits</h3>
                      <p className="admin-section-desc">
                        Define the benefits included or excluded from this plan.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-add-section-item"
                      onClick={() =>
                        setBenefits((prev) => [
                          ...prev,
                          emptyBenefit(),
                        ])
                      }
                    >
                      + Add Benefit
                    </button>
                  </div>

                  {benefits.map((benefit, index) => (
                    <div key={index} className="admin-item-card">
                      <div className="admin-item-card-header">
                        <span className="pricing-rule-card-title">Benefit {index + 1}</span>

                        {benefits.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-rule"
                            onClick={() =>
                              setBenefits((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-label">Benefit Name</label>
                        <input
                          type="text"
                          className="admin-modal-input"
                          placeholder="e.g. Hospitalization Coverage"
                          value={benefit.benefit_name}
                          onChange={(e) =>
                            updateBenefit(index, "benefit_name", e.target.value)
                          }
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-label">Description</label>
                        <textarea
                          className="admin-modal-textarea"
                          rows={2}
                          placeholder="Explain this benefit..."
                          value={benefit.description}
                          onChange={(e) =>
                            updateBenefit(index, "description", e.target.value)
                          }
                        />
                      </div>

                      <label className="admin-checkbox-label">
                        <input
                          type="checkbox"
                          checked={benefit.is_included}
                          onChange={(e) =>
                            updateBenefit(index, "is_included", e.target.checked)
                          }
                        />
                        <span>Included in this plan</span>
                      </label>
                    </div>
                  ))}
                </div>

                {/* SECTION 5: CONDITIONS */}
                <div className="admin-form-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title">5. Conditions &amp; Exclusions</h3>
                      <p className="admin-section-desc">
                        Configure waiting periods, copay, room rent limits, deductibles, and exclusions.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-add-section-item"
                      onClick={() =>
                        setConditions((prev) => [
                          ...prev,
                          emptyCondition(),
                        ])
                      }
                    >
                      + Add Condition
                    </button>
                  </div>

                  {conditions.map((condition, index) => (
                    <div key={index} className="admin-item-card">
                      <div className="admin-item-card-header">
                        <span className="pricing-rule-card-title">Condition {index + 1}</span>

                        {conditions.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-rule"
                            onClick={() =>
                              setConditions((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="admin-grid-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="admin-form-group">
                          <label className="admin-label">Condition Type</label>
                          <select
                            className="admin-modal-select"
                            value={condition.condition_type}
                            onChange={(e) =>
                              updateCondition(index, "condition_type", e.target.value)
                            }
                          >
                            <option value="waiting_period">Waiting Period</option>
                            <option value="exclusion">Exclusion</option>
                            <option value="copay">Copay</option>
                            <option value="room_rent">Room Rent Limit</option>
                            <option value="deductible">Deductible</option>
                            <option value="sub_limit">Sub-limit</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-label">Condition Value</label>
                          <input
                            type="text"
                            className="admin-modal-input"
                            placeholder="e.g. 30 days, 10%, 5000"
                            value={condition.condition_value}
                            onChange={(e) =>
                              updateCondition(index, "condition_value", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-label">Description</label>
                        <textarea
                          className="admin-modal-textarea"
                          rows={2}
                          placeholder="Explain the condition or limitation..."
                          value={condition.description}
                          onChange={(e) =>
                            updateCondition(index, "description", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseAddModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={saving}
                >
                  {saving
                    ? (editingPlanId ? "Updating Plan..." : "Publishing Plan...")
                    : (editingPlanId ? "Update Plan" : "Publish Plan to Catalog")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN PREVIEW */}
      <PlanDetailsModal
        plan={previewPlan}
        onClose={() => setPreviewPlan(null)}
      />
    </div>
  );
};