const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  premium_amount: number;
  coverage_amount: number;
  duration_months: number;
  is_active: boolean;
}

export interface PlanCreate {
  name: string;
  description?: string | null;
  premium_amount: number;
  coverage_amount: number;
  duration_months: number;
}

// Public: Fetch available active plans
export const getAvailablePlans = async (): Promise<Plan[]> => {
  const response = await fetch(`${API_URL}/admin/plans/available/plans`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch health insurance plans");
  }

  return response.json();
};

// Admin: Fetch all plans (active + inactive)
export const getAllPlans = async (token: string): Promise<Plan[]> => {
  const response = await fetch(`${API_URL}/admin/plans/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch admin plans");
  }

  return response.json();
};

// Admin: Create a new plan
export const createPlan = async (
  token: string,
  plan: PlanCreate
): Promise<{ message: string; plan: Plan }> => {
  const response = await fetch(`${API_URL}/admin/plans/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(plan),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = resData.detail || "Failed to create plan.";
    if (Array.isArray(resData.detail)) {
      errorMsg = resData.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ");
    }
    throw new Error(errorMsg);
  }

  return resData;
};

// Admin: Activate or deactivate a plan
export const updatePlanStatus = async (
  token: string,
  planId: string,
  isActive: boolean
): Promise<{ message: string; plan: Plan }> => {
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

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to update plan status.");
  }

  return resData;
};