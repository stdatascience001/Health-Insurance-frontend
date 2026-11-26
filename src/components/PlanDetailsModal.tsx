import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Plan } from "../services/plans";
import { useAuth } from "../context/AuthContext";

interface PlanDetailsModalProps {
  plan: Plan | null;
  onClose: () => void;
}

function formatCurrency(amount: number | string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  plan,
  onClose,
}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!plan) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [plan, onClose]);

  if (!plan) return null;

  const activePricingRules = (plan.pricing_rules ?? []).filter(
    (rule) => rule.is_active
  );

  const monthlyRule = activePricingRules.find(
    (rule) => rule.premium_frequency === "monthly"
  );

  const annualRule = activePricingRules.find(
    (rule) => rule.premium_frequency === "annual"
  );

  const highestCoverageRule = [...activePricingRules].sort(
    (a, b) => Number(b.coverage_amount) - Number(a.coverage_amount)
  )[0];

  const coverageAmount = highestCoverageRule?.coverage_amount ?? 0;
  const monthlyPremium = monthlyRule?.premium_amount;
  const annualPremium = annualRule?.premium_amount;

  const handleSelectPlan = () => {
    onClose();

    if (isAdmin) {
      navigate("/admin/dashboard");
    } else if (isAuthenticated) {
      navigate(`/customer/apply?planId=${plan.id}`);
    } else {
      navigate(`/login?planId=${plan.id}`);
    }
  };

  const coveredList = [
    {
      title: "In-Patient & ICU Hospitalization",
      tag: "100% Cashless",
      description: `Full cashless coverage for hospital room rent, ICU/ICCU charges, nursing, and physician & surgeon fees up to ${formatCurrency(
        coverageAmount
      )}.`,
    },
    {
      title: "Pre & Post-Hospitalization Care",
      tag: "30 & 60 Days",
      description:
        "Medical bills, diagnostic tests, pathology, and prescribed medicines covered 30 days prior to admission and 60 days following hospital discharge.",
    },
    {
      title: "Day Care Procedures & Surgeries",
      tag: "500+ Surgeries",
      description:
        "500+ modern medical procedures and advanced surgeries requiring less than 24 hours of hospitalization (cataract, dialysis, chemotherapy, etc.).",
    },
    {
      title: "Dedicated 100% Individual Sum Insured",
      tag: "Zero Pool Sharing",
      description: `Full ${formatCurrency(
        coverageAmount
      )} coverage limit is reserved exclusively for you as a single policyholder with zero shared family pool dilution.`,
    },
    {
      title: "Emergency Road Ambulance Cover",
      tag: "Emergency Transit",
      description:
        "Transportation expenses covered for emergency road ambulance transit to the nearest network hospital per hospitalization event.",
    },
    {
      title: "Annual Health Checkup & Tax Benefit",
      tag: "Section 80D",
      description:
        "100% complimentary annual preventive wellness checkup for the individual, plus income tax deductions up to ₹25,000 under Section 80D.",
    },
  ];

  const notCoveredList = [
    {
      title: "Cosmetic & Aesthetic Treatments",
      tag: "Not Covered",
      description:
        "Cosmetic surgeries, aesthetic procedures, hair treatments, and plastic surgery (unless reconstructive post-accident).",
    },
    {
      title: "Self-Inflicted Injuries & Extreme Sports",
      tag: "Excluded",
      description:
        "Treatment resulting from intentional self-harm or participation in hazardous, extreme, or unauthorized activities.",
    },
    {
      title: "Non-Prescribed Medicines & Trials",
      tag: "Not Covered",
      description:
        "Self-medication, experimental unverified therapies, and medicines taken without a registered medical doctor's prescription.",
    },
    {
      title: "Non-Medical Toiletries & Supplies",
      tag: "Non-Medical",
      description:
        "Personal comfort items, convenience kits, hospital administrative fees, and non-medical disposable supplies.",
    },
    {
      title: "Standard 30-Day Initial Waiting Period",
      tag: "Waiting Period",
      description:
        "Initial 30-day waiting period from policy inception for illnesses (emergency accidental injuries covered from Day 1).",
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card plan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-banner plan-modal-header">
          <div className="modal-header-top">
            <span className="modal-badge">Individual Health Plan</span>

            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <h2 className="modal-title" id="plan-modal-title">
            {plan.name}
          </h2>

          <p className="modal-subtitle">
            Healthcare coverage designed exclusively for single policyholders
          </p>
        </div>

        <div className="plan-modal-body">
          {plan.description && (
            <div className="plan-modal-about-box">
              <span className="plan-modal-heading">About this plan</span>
              <p className="plan-modal-text">{plan.description}</p>
            </div>
          )}

          <div className="plan-modal-stats">
            <div className="plan-modal-stat">
              <div className="plan-modal-stat-header">
                <span className="plan-modal-stat-label">
                  Monthly Premium
                </span>

                <span className="plan-modal-stat-icon-wrap premium">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
              </div>

              <strong className="plan-modal-stat-value premium">
                {monthlyPremium !== undefined
                  ? formatCurrency(monthlyPremium)
                  : "Not configured"}
              </strong>

              <span className="plan-modal-stat-note">
                {monthlyPremium !== undefined
                  ? "per month (individual)"
                  : "Monthly pricing unavailable"}
              </span>
            </div>

            <div className="plan-modal-stat">
              <div className="plan-modal-stat-header">
                <span className="plan-modal-stat-label">
                  Individual Sum Insured
                </span>

                <span className="plan-modal-stat-icon-wrap coverage">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
              </div>

              <strong className="plan-modal-stat-value coverage">
                {formatCurrency(coverageAmount)}
              </strong>

              <span className="plan-modal-stat-note">
                dedicated annual coverage
              </span>
            </div>

            <div className="plan-modal-stat">
              <div className="plan-modal-stat-header">
                <span className="plan-modal-stat-label">Policy Term</span>

                <span className="plan-modal-stat-icon-wrap neutral">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
              </div>

              <strong
                className="plan-modal-stat-value"
                style={{
                  fontSize: "1.25rem",
                  color: "var(--text-main)",
                }}
              >
                {plan.duration_months} Months
              </strong>

              <span className="plan-modal-stat-note">
                policy duration
              </span>
            </div>

            <div className="plan-modal-stat">
              <div className="plan-modal-stat-header">
                <span className="plan-modal-stat-label">
                  Hospital Network
                </span>

                <span className="plan-modal-stat-icon-wrap emerald">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M12 6v6" />
                  </svg>
                </span>
              </div>

              <strong
                className="plan-modal-stat-value"
                style={{
                  fontSize: "1.25rem",
                  color: "var(--accent-emerald)",
                }}
              >
                500+ Network
              </strong>

              <span className="plan-modal-stat-note">
                100% cashless access
              </span>
            </div>
          </div>

          {annualPremium !== undefined && (
            <div className="plan-modal-about-box">
              <span className="plan-modal-heading">
                Annual Premium
              </span>

              <p className="plan-modal-text">
                {formatCurrency(annualPremium)} per year
              </p>
            </div>
          )}

          <div className="plan-modal-section">
            <div className="plan-modal-section-header">
              <h3 className="plan-modal-section-title">
                What is covered under this plan
              </h3>

              <span className="plan-modal-badge-pill">
                Individual Only
              </span>
            </div>

            <ul className="plan-modal-bullet-list">
              {coveredList.map((item) => (
                <li
                  key={item.title}
                  className="plan-modal-bullet-item"
                >
                  <span
                    className="plan-modal-bullet-icon"
                    aria-hidden="true"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>

                  <div className="plan-modal-bullet-text">
                    <div className="plan-modal-bullet-line">
                      <strong>{item.title}</strong>
                      <span className="plan-modal-bullet-tag">
                        {item.tag}
                      </span>
                    </div>

                    <p className="plan-modal-bullet-desc">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="plan-modal-section">
            <div className="plan-modal-section-header">
              <h3 className="plan-modal-section-title">
                What's not covered
              </h3>

              <span className="plan-modal-badge-pill exclusion">
                Exclusions
              </span>
            </div>

            <ul className="plan-modal-bullet-list">
              {notCoveredList.map((item) => (
                <li
                  key={item.title}
                  className="plan-modal-bullet-item exclusion-item"
                >
                  <span
                    className="plan-modal-bullet-icon exclusion-icon"
                    aria-hidden="true"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>

                  <div className="plan-modal-bullet-text">
                    <div className="plan-modal-bullet-line">
                      <strong>{item.title}</strong>

                      <span className="plan-modal-bullet-tag exclusion">
                        {item.tag}
                      </span>
                    </div>

                    <p className="plan-modal-bullet-desc">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="plan-modal-footer">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={handleSelectPlan}
            disabled={!plan.is_active}
          >
            {plan.is_active
              ? "Get started with this plan →"
              : "Plan unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
};