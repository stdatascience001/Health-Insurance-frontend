import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAvailablePlans, type Plan } from "../../services/plans";
import { PlanDetailsModal } from "../../components/PlanDetailsModal";
import { useAuth } from "../../context/AuthContext";

const PLAN_IMAGES = [
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80",
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000&auto=format&fit=crop&q=80";

function formatCurrency(amount: number | string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ---------- Small inline icons ---------- */
const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/* ---------- Phone notifications (hero) ---------- */
type NotifKind = "success" | "claim";

const NOTIF_ICONS: Record<NotifKind, React.ReactNode> = {
  success: (
    <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4" />
  ),
  claim: (
    <path d="M12 21s-7-4.4-9-9.2C1.6 8 4 5 7 5c2 0 3.4 1 5 3 1.6-2 3-3 5-3 3 0 5.4 3 4 6.8C19 16.6 12 21 12 21Z" />
  ),
};

type NotifItem = {
  kind: NotifKind;
  title: string;
  text: string;
};

/* ---------- Features ---------- */
const FEATURES = [
  {
    title: "Cashless hospitalization",
    text: "Get treated at network hospitals without paying upfront.",
    icon: (
      <Icon>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M12 11v5M9.5 13.5h5" />
      </Icon>
    ),
  },
  {
    title: "Clear, upfront pricing",
    text: "See your monthly premium and coverage before you sign up.",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 8h6M9 12h6M10 8c3 0 4 1.5 4 2.5S12.5 13 10 13l4 4" />
      </Icon>
    ),
  },
  {
    title: "Fully digital enrollment",
    text: "Apply online in minutes. No branch visits, no paper forms.",
    icon: (
      <Icon>
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
      </Icon>
    ),
  },
  {
    title: "Built for one person",
    text: "Every plan covers a single policyholder. Simple to understand.",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
      </Icon>
    ),
  },
];

/* ---------- Steps ---------- */
const STEPS = [
  {
    title: "Pick a plan",
    text: "Compare premiums and coverage, then open a plan to see its full benefits.",
  },
  {
    title: "Create your account",
    text: "Register with your details and submit your application online.",
  },
  {
    title: "Get covered",
    text: "Once approved, your policy is active and ready to use.",
  },
];

export const HomePage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inspectingPlan, setInspectingPlan] = useState<Plan | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const plansContainerRef = useRef<HTMLDivElement>(null);
  const plansSectionRef = useRef<HTMLElement>(null);

  /* ---------- Notifications ---------- */
  const notifItems: NotifItem[] = [
    {
      kind: "success",
      title: "Policy activated",
      text: "You are covered. Welcome aboard.",
    },
    {
      kind: "claim",
      title: "Cashless claim",
      text: "The hospital bill was settled directly.",
    },
    {
      kind: "success",
      title: "Application",
      text: "Insurance application is under review.",
    },
  ];

  const staticNotifs = notifItems;

  /* ---------- Plans carousel scrolling ---------- */
  const updateScrollState = useCallback(() => {
    const el = plansContainerRef.current;

    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    );
  }, []);

  const scrollPlans = (direction: "left" | "right") => {
    plansContainerRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const scrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* ---------- Load plans ---------- */
  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAvailablePlans();
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load insurance plans."
      );

      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    updateScrollState();

    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("resize", updateScrollState);
    };
  }, [plans, loading, updateScrollState]);

  /* ---------- Buy plan ---------- */
  const handleBuy = (plan: Plan) => {
    if (isAdmin) {
      navigate("/admin/dashboard");
    } else if (isAuthenticated) {
      navigate(`/customer/apply?planId=${plan.id}`);
    } else {
      navigate(`/login?planId=${plan.id}`);
    }
  };

  return (
    <div className="main-content home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">
            Individual health insurance
          </span>

          <h1 className="hero-title">
            Health cover that is simple, clear and yours.
          </h1>

          <p className="hero-desc">
            Choose a plan built for one person. See what it costs and what
            it covers, then enroll online with cashless hospitalization
            included.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-btn-light"
              onClick={scrollToPlans}
            >
              Browse plans
            </button>

            {!isAuthenticated && (
              <Link to="/register" className="hero-btn-ghost">
                Create account
              </Link>
            )}
          </div>

          <ul className="hero-points">
            <li>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Cashless claims
            </li>

            <li>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              100% online enrollment
            </li>

            <li>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Transparent pricing
            </li>
          </ul>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <img src={HERO_IMAGE} alt="" className="hero-img" />

          <div className="hero-notifs">
            {staticNotifs.map((item, slot) => (
              <div
                key={item.title}
                className={`notif ${slot % 2 === 0 ? "notif-left" : "notif-right"
                  } slot-${slot}`}
              >
                <span className={`notif-icon ${item.kind}`}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {NOTIF_ICONS[item.kind]}
                  </svg>
                </span>

                <div className="notif-body">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>

                <em className="notif-time">now</em>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="feature-row" aria-label="Why choose us">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-item">
            <span className="feature-icon">{f.icon}</span>

            <div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-text">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="toast-banner error" role="alert">
          <span>⚠ {error}</span>

          <button className="secondary-btn" onClick={loadPlans}>
            Retry
          </button>
        </div>
      )}

      {/* PLANS */}
      <section ref={plansSectionRef} className="plans-section" id="plans">
        <div className="section-head">
          <div>
            <h2 className="section-title">Choose your individual plan</h2>

            <p className="section-desc">
              Plans built exclusively for single policyholders. Review what is covered in detail, compare premiums, and apply online.
            </p>
          </div>

          <div className="section-actions">
            <button
              className="secondary-btn"
              onClick={loadPlans}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh plans"}
            </button>
          </div>
        </div>

        {/* LOADING SKELETONS */}
        {loading && (
          <div
            className="plans-skeleton-row"
            aria-busy="true"
            aria-label="Loading plans"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="plan-card skeleton-card">
                <div className="skeleton-block skeleton-img" />

                <div className="plan-content-body">
                  <div className="skeleton-block skeleton-line w60" />
                  <div className="skeleton-block skeleton-line w90" />
                  <div className="skeleton-block skeleton-line w75" />
                  <div className="skeleton-block skeleton-box" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && plans.length === 0 && (
          <div
            className="content-card"
            style={{
              padding: "3rem 2rem",
              textAlign: "center",
            }}
          >
            <div
              className="empty-illustration"
              style={{ margin: "0 auto 1rem" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              No plans available right now
            </h3>

            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                marginBottom: "1.25rem",
              }}
            >
              New plans will appear here as soon as they are published.
              Check again in a moment.
            </p>

            <button className="secondary-btn" onClick={loadPlans}>
              Check again
            </button>
          </div>
        )}

        {/* PLANS CAROUSEL */}
        {!loading && plans.length > 0 && (
          <div className="plans-scroll-wrapper">
            <button
              type="button"
              className="plans-scroll-arrow left"
              onClick={() => scrollPlans("left")}
              aria-label="Scroll plans left"
              disabled={!canScrollLeft}
            >
              &#10094;
            </button>

            <div
              className="plans-grid plans-horizontal-scroll"
              ref={plansContainerRef}
              onScroll={updateScrollState}
            >
              {plans.map((plan, index) => (
                <article key={plan.id} className="plan-card">
                  <div className="plan-image-box">
                    <img
                      src={PLAN_IMAGES[index % PLAN_IMAGES.length]}
                      alt=""
                      className="plan-card-img"
                      loading="lazy"
                    />

                    <div className="plan-img-gradient" />

                    <span className="plan-single-pill">
                      Individual coverage
                    </span>
                  </div>

                  <div className="plan-content-body">
                    <h3 className="plan-card-name">{plan.name}</h3>

                    <p className="plan-card-desc">
                      {plan.description ||
                        "Healthcare coverage designed exclusively for individual policyholders."}
                    </p>

                    <div className="plan-pricing-row">
                      <div className="plan-price-block">
                        <span className="plan-price-val">
                          {formatCurrency(
                            plan.pricing_rules?.find(
                              (rule) => rule.premium_frequency === "monthly" && rule.is_active
                            )?.premium_amount ?? 0
                          )}
                        </span>

                        <span className="plan-price-unit">
                          {" "}/ month
                        </span>
                      </div>
                    </div>

                    <dl className="plan-facts">
                      <div>
                        <dt>Coverage</dt>
                        <dd className="plan-coverage-limit">
                          {formatCurrency(
                            plan.pricing_rules?.find((rule) => rule.is_active)?.coverage_amount ?? 0
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Duration</dt>
                        <dd>{plan.duration_months} months</dd>
                      </div>
                    </dl>

                    <div className="plan-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{
                          flex: 1,
                          justifyContent: "center",
                        }}
                        onClick={() => setInspectingPlan(plan)}
                      >
                        View details
                      </button>

                      <button
                        type="button"
                        className="primary-btn"
                        style={{
                          flex: 1.2,
                          justifyContent: "center",
                        }}
                        disabled={!plan.is_active}
                        onClick={() => handleBuy(plan)}
                      >
                        {plan.is_active ? "Buy plan" : "Unavailable"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="plans-scroll-arrow right"
              onClick={() => scrollPlans("right")}
              aria-label="Scroll plans right"
              disabled={!canScrollRight}
            >
              &#10095;
            </button>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="steps-section" aria-label="How it works">
        <h2 className="section-title">Get covered in three steps</h2>

        <ol className="steps-list">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step-item">
              <span className="step-number">{i + 1}</span>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-text">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FINAL CTA */}
      {!isAuthenticated && (
        <section className="cta-band">
          <div>
            <h2 className="cta-title">Ready to protect your health?</h2>

            <p className="cta-text">
              Create a free account and apply for a plan in minutes.
            </p>
          </div>

          <Link to="/register" className="hero-btn-light">
            Create account
          </Link>
        </section>
      )}

      {/* PLAN DETAILS MODAL */}
      <PlanDetailsModal
        plan={inspectingPlan}
        onClose={() => setInspectingPlan(null)}
      />
    </div>
  );
};