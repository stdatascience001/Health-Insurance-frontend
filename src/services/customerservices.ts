const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface Customer {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  is_deleted?: boolean;
  created_at: string;
}

export interface CustomerUpdate {
  full_name?: string;
  email?: string;
  phone?: string | null;
}

export interface AdminDashboardStats {
  message: string;
  total_users: number;
  total_customers: number;
  total_admins: number;
  total_applications?: number;
  total_policies?: number;
}

// Fetch dashboard statistics (Admin only)
export const getAdminDashboard = async (token: string): Promise<AdminDashboardStats> => {
  const response = await fetch(`${API_URL}/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch admin dashboard statistics");
  }

  return response.json();
};

// Fetch all customers (Admin only - protected)
export const getAdminCustomers = async (token: string): Promise<Customer[]> => {
  const response = await fetch(`${API_URL}/admin/customers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch customers");
  }

  return response.json();
};

// Fetch customer by ID (Admin only)
export const getCustomerById = async (token: string, customerId: string): Promise<Customer> => {
  const response = await fetch(`${API_URL}/admin/customers/${customerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch customer details");
  }

  return response.json();
};

// Update customer by ID (Admin only)
export const updateCustomer = async (
  token: string,
  customerId: string,
  data: CustomerUpdate
): Promise<{ message: string; customer: Customer }> => {
  const response = await fetch(`${API_URL}/admin/customers/${customerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to update customer");
  }

  return resData;
};

// Soft delete customer by ID (Admin only)
export const deleteCustomer = async (
  token: string,
  customerId: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/admin/customers/${customerId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to delete customer");
  }

  return resData;
};

// Aliases for backward compatibility
export const getCustomers = getAdminCustomers;
export const createCustomer = async (): Promise<never> => {
  throw new Error("Customer creation is now handled through /auth/register");
};

