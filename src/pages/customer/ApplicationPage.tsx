import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAvailablePlans, type Plan } from "../../services/plans";
import {
  createApplication,
  type InsuranceApplicationCreate,
} from "../../services/application";

export const ApplicationPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const planId = searchParams.get("planId") || "";

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState<InsuranceApplicationCreate>({
    plan_id: planId,
    date_of_birth: "",
    gender: "",
    address: "",
    nominee_name: "",
    nominee_relationship: "",
    nominee_dob: "",
    nominee_phone: "",
    medical_history: "",
  });

  // Fetch the selected plan
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoadingPlan(true);
        const plans = await getAvailablePlans();
        const selectedPlan = plans.find((item) => item.id === planId);

        if (!selectedPlan) {
          setError("Selected insurance plan could not be found.");
          return;
        }

        setPlan(selectedPlan);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load insurance plan."
        );
      } finally {
        setLoadingPlan(false);
      }
    };

    if (planId) {
      fetchPlan();
    } else {
      setError("No insurance plan was selected.");
      setLoadingPlan(false);
    }
  }, [planId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setError("Please log in to submit your application.");
      return;
    }

    if (!plan) {
      setError("Please select a valid insurance plan.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createApplication(token, {
        ...formData,
        plan_id: plan.id,
        nominee_dob: formData.nominee_dob || null,
        nominee_phone: formData.nominee_phone?.trim() || null,
        medical_history: formData.medical_history?.trim() || null,
      });

      // Show pop-up message
      setShowSuccessModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPlan) {
    return (
      <div className="main-content">
        <div className="content-card" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading selected insurance plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="view-header">
        <div className="view-title-wrap">
          <span className="view-eyebrow">Insurance Enrollment</span>
          <h1 className="view-title">Insurance Application</h1>
          <p className="view-description">
            Complete the details below to apply for your selected health insurance plan.
          </p>
        </div>
      </div>

      {error && (
        <div className="toast-banner error">
          <span>⚠ {error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            ✕
          </button>
        </div>
      )}

      {plan && (
        <>
          {/* PLAN SUMMARY CARD */}
          <div className="content-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Selected Insurance Plan</h3>

            <div className="drawer-info-grid">
              <div className="drawer-info-item">
                <span className="drawer-info-label">Plan Name</span>
                <span className="drawer-info-val">{plan.name}</span>
              </div>

              <div className="drawer-info-item">
                <span className="drawer-info-label">Monthly Premium</span>
                <span className="drawer-info-val">
                  ₹
                  {Number(
                    plan.pricing_rules.find(
                      (rule) =>
                        rule.premium_frequency === "monthly" && rule.is_active
                    )?.premium_amount ?? 0
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="drawer-info-item">
                <span className="drawer-info-label">Coverage Amount</span>
                <span className="drawer-info-val">
                  ₹
                  {Number(
                    plan.pricing_rules.find((rule) => rule.is_active)?.coverage_amount ?? 0
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="drawer-info-item">
                <span className="drawer-info-label">Duration</span>
                <span className="drawer-info-val">{plan.duration_months} months</span>
              </div>
            </div>
          </div>

          {/* APPLICATION FORM */}
          <form onSubmit={handleSubmit}>
            <div className="content-card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "1.25rem" }}>Personal Information</h3>

              <div className="form-field">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  className="form-input"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field" style={{ marginTop: "1rem" }}>
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className="form-input"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-field" style={{ marginTop: "1rem" }}>
                <label className="form-label">Residential Address</label>
                <textarea
                  name="address"
                  className="form-input"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter complete residential address"
                  required
                />
              </div>
            </div>

            <div className="content-card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "1.25rem" }}>Nominee Information</h3>

              <div className="form-field">
                <label className="form-label">Nominee Full Name</label>
                <input
                  type="text"
                  name="nominee_name"
                  className="form-input"
                  value={formData.nominee_name}
                  onChange={handleChange}
                  placeholder="Full name of beneficiary"
                  required
                />
              </div>

              <div className="form-field" style={{ marginTop: "1rem" }}>
                <label className="form-label">Relationship with Nominee</label>
                <input
                  type="text"
                  name="nominee_relationship"
                  className="form-input"
                  value={formData.nominee_relationship}
                  onChange={handleChange}
                  placeholder="e.g. Spouse, Parent, Child"
                  required
                />
              </div>

              <div className="form-field" style={{ marginTop: "1rem" }}>
                <label className="form-label">Nominee Date of Birth (Optional)</label>
                <input
                  type="date"
                  name="nominee_dob"
                  className="form-input"
                  value={formData.nominee_dob || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field" style={{ marginTop: "1rem" }}>
                <label className="form-label">Nominee Phone (Optional)</label>
                <input
                  type="tel"
                  name="nominee_phone"
                  className="form-input"
                  value={formData.nominee_phone || ""}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>

            <div className="content-card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "1.25rem" }}>Medical Declaration</h3>

              <div className="form-field">
                <label className="form-label">Medical History / Pre-existing Conditions</label>
                <textarea
                  name="medical_history"
                  className="form-input"
                  value={formData.medical_history || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Mention any existing medical conditions or past surgeries. If none, type 'None'."
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "2rem" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate("/customer/dashboard")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting Application..." : "Submit Application"}
              </button>
            </div>
          </form>
        </>
      )}

      {/* POP-UP SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "480px" }}>
            <div
              className="modal-header-banner"
              style={{
                textAlign: "center",
                padding: "2rem 1.5rem 1.75rem",
                background: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: "30px",
                  color: "#ffffff",
                }}
              >
                ✓
              </div>
              <h2 className="modal-title" style={{ fontSize: "1.4rem" }}>
                Application Submitted Successfully!
              </h2>
              <p className="modal-subtitle" style={{ color: "#d1fae5" }}>
                Your health insurance request is now being processed
              </p>
            </div>

            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.2rem",
                  fontSize: "0.88rem",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Plan Applied:</span>
                  <strong style={{ color: "var(--text-main)" }}>{plan?.name}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Monthly Premium:</span>
                  <strong style={{ color: "var(--primary-700)" }}>
                    ₹
                    {Number(
                      plan?.pricing_rules?.find(
                        (rule) => rule.premium_frequency === "monthly" && rule.is_active
                      )?.premium_amount || 0
                    ).toLocaleString("en-IN")}

                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Coverage Limit:</span>
                  <strong style={{ color: "var(--accent-emerald)" }}>
                    ₹
                    {Number(
                      plan?.pricing_rules?.find((rule) => rule.is_active)?.coverage_amount || 0
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed var(--border-light)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Current Status:</span>
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                    }}
                  >
                    ● Pending Review
                  </span>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                Thank you! Your application has been registered. An insurance administrator will review your medical declaration and issue your policy shortly.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ width: "100%", justifyContent: "center", padding: "11px" }}
                  onClick={() => navigate("/customer/dashboard")}
                >
                  View My Dashboard →
                </button>
                <Link
                  to="/"
                  className="secondary-btn"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", textDecoration: "none" }}
                >
                  Browse Other Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
