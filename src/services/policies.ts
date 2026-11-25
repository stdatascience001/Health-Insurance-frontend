const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface Policy {
  id: string;
  policy_number: string;
  application_id: string;
  customer_id: string;
  plan_id: string;
  plan_name: string;
  premium_amount: string;
  coverage_amount: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
}
//Policy cancellation Request
export interface PolicyCancellationRequest {
  id: string;
  policy_id: string;
  policy_number: string | null;
  customer_id: string;
  customer_name: string | null;
  customer_email: string | null;
  reason: string;
  additional_comments: string | null;
  status: string;
  admin_remarks: string | null;
  requested_at: string | null;
  reviewed_at: string | null;
}

export interface PolicyCancellationCreate {
  reason: string;
  additional_comments?: string;
}
// Customer: View own policies
export const getMyPolicies = async (token: string): Promise<Policy[]> => {
  const response = await fetch(`${API_URL}/policies/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to fetch your policies");
  }

  return resData;
};

// Admin: View all policies
export const getAllPolicies = async (token: string): Promise<Policy[]> => {
  const response = await fetch(`${API_URL}/policies/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to fetch all policies");
  }

  return resData;
};

//Admin can see the list of the cancellation request...
export interface CancellationRequestListResponse {
  total: number;
  skip: number;
  limit: number;
  items: PolicyCancellationRequest[];
}

export interface PolicyCancellationReview {
  status: "approved" | "rejected";
  admin_remarks?: string;
}

// Customer / Admin: View single policy
export const getPolicyById = async (
  token: string,
  policyId: string
): Promise<Policy> => {
  const response = await fetch(`${API_URL}/policies/${policyId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to fetch policy details");
  }

  return resData;
};

// Customer: Submit policy cancellation request
export const createPolicyCancellationRequest = async (
  token: string,
  policyId: string,
  data: PolicyCancellationCreate
): Promise<PolicyCancellationRequest> => {
  const response = await fetch(
    `${API_URL}/policies/${policyId}/cancellation_request`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      resData.detail || "Failed to submit cancellation request."
    );
  }

  return resData;
};

//For the admin...accept and reject the customer policies 
// Admin: Get all policy cancellation requests
export const getAllCancellationRequests = async (
  token: string,
  skip = 0,
  limit = 10,
  status?: string
): Promise<CancellationRequestListResponse> => {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  if (status) {
    params.append("status", status);
  }

  const response = await fetch(
    `${API_URL}/policies/cancellation-requests?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      resData.detail || "Failed to fetch cancellation requests."
    );
  }

  return resData;
};

// Admin: Approve or reject a cancellation request
export const reviewCancellationRequest = async (
  token: string,
  requestId: string,
  data: PolicyCancellationReview
): Promise<PolicyCancellationRequest> => {
  const response = await fetch(
    `${API_URL}/policies/cancellation-requests/${requestId}/review`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      resData.detail || "Failed to review cancellation request."
    );
  }

  return resData;
};