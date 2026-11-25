const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface InsuranceApplication {
  id: string;
  customer_id: string;
  plan_id: string;
  plan_name: string;
  premium_amount: string;
  coverage_amount: string;
  date_of_birth: string;
  gender: string;
  address: string;
  nominee_name: string;
  nominee_relationship: string;
  nominee_dob: string | null;
  nominee_phone: string | null;
  medical_history: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
}

export interface InsuranceApplicationCreate {
  plan_id: string;
  date_of_birth: string;
  gender: string;
  address: string;
  nominee_name: string;
  nominee_relationship: string;
  nominee_dob?: string | null;
  nominee_phone?: string | null;
  medical_history?: string | null;
}

export interface ApplicationReview {
  status: "approved" | "rejected";
  rejection_reason?: string | null;
}


//Pagination application
export interface PaginatedApplications {
  items: InsuranceApplication[],
  total: number,
  page: number,
  limit: number,
  total_pages: number;
}

// Customer: Submit insurance application
export const createApplication = async (
  token: string,
  data: InsuranceApplicationCreate
): Promise<{ message: string; application: InsuranceApplication }> => {
  const response = await fetch(`${API_URL}/applications/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to submit application");
  }

  return resData;
};

// Customer: Fetch own applications
export const getMyApplications = async (
  token: string
): Promise<InsuranceApplication[]> => {
  const response = await fetch(`${API_URL}/applications/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to fetch applications");
  }

  return resData;
};

// Admin: Fetch all applications
export const getAllApplications = async (
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedApplications> => {
  const response = await fetch(
    `${API_URL}/applications/?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to fetch applications");
  }

  return resData;
};

// Customer/Admin: Fetch individual application
export const getApplicationById = async (
  token: string,
  applicationId: string
): Promise<InsuranceApplication> => {
  const response = await fetch(
    `${API_URL}/applications/${applicationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to fetch application details");
  }

  return resData;
};

// Admin: Approve or reject application
export const reviewApplication = async (
  token: string,
  applicationId: string,
  data: ApplicationReview
): Promise<{ message: string; application: InsuranceApplication }> => {
  const response = await fetch(
    `${API_URL}/applications/${applicationId}/review`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to review application");
  }

  return resData;
};