const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

// -----------------------------
// Types
// -----------------------------

export interface PlanPricingRule {
  id?: string;
  min_age: number;
  max_age: number;
  coverage_amount: number;
  duration_months: number;
  premium_frequency: "annual" | "monthly";
  premium_amount: number;
  is_active: boolean;
}

export interface PlanBenefit {
  id?: string;
  benefit_name: string;
  description?: string | null;
  is_included: boolean;
}

export interface PlanCondition {
  id?: string;
  condition_type: string;
  condition_value: string;
  description?: string | null;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  min_entry_age: number;
  max_entry_age: number;
  duration_months: number;
  is_active: boolean;

  pricing_rules: PlanPricingRule[];
  benefits: PlanBenefit[];
  conditions: PlanCondition[];
}

export interface PlanCreate {
  name: string;
  description?: string | null;
  plan_type: string;
  min_entry_age: number;
  max_entry_age: number;
  duration_months: number;

  pricing_rules: PlanPricingRule[];
  benefits: PlanBenefit[];
  conditions: PlanCondition[];
}

export type PlanUpdate = PlanCreate;

interface PlanResponse {
  message: string;
  plan: Plan;
}

// -----------------------------
// Error Handling
// -----------------------------

async function getErrorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));

  let message = data.detail || fallback;

  if (Array.isArray(message)) {
    message = message
      .map((item: { msg?: string }) => item.msg)
      .filter(Boolean)
      .join(", ");
  }

  return message;
}

// -----------------------------
// Public: Get Available Plans
// -----------------------------

export const getAvailablePlans = async (): Promise<Plan[]> => {
  const response = await fetch(
    `${API_URL}/admin/plans/available/plans`
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch health insurance plans.")
    );
  }

  return response.json();
};

// -----------------------------
// Admin: Get All Plans
// -----------------------------

export const getAllPlans = async (token: string): Promise<Plan[]> => {
  const response = await fetch(`${API_URL}/admin/plans/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch admin plans.")
    );
  }

  return response.json();
};

// -----------------------------
// Admin: Get Plan By ID
// -----------------------------

export const getPlanById = async (
  token: string,
  planId: string
): Promise<Plan> => {
  const response = await fetch(
    `${API_URL}/admin/plans/${planId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch plan details.")
    );
  }

  return response.json();
};

// -----------------------------
// Admin: Create Plan
// -----------------------------

export const createPlan = async (
  token: string,
  plan: PlanCreate
): Promise<PlanResponse> => {
  const response = await fetch(`${API_URL}/admin/plans/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(plan),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to create plan.")
    );
  }

  return response.json();
};

// -----------------------------
// Admin: Update Complete Plan
// -----------------------------

export const updatePlan = async (
  token: string,
  planId: string,
  plan: PlanUpdate
): Promise<PlanResponse> => {
  const response = await fetch(
    `${API_URL}/admin/plans/${planId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(plan),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to update plan.")
    );
  }

  return response.json();
};

// Admin: Activate / Deactivate
export const updatePlanStatus = async (
  token: string,
  planId: string,
  isActive: boolean
): Promise<PlanResponse> => {
  const response = await fetch(
    `${API_URL}/admin/plans/${planId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to update plan status.")
    );
  }

  return response.json();
};
