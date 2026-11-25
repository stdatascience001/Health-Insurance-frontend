const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone?: string | null;
  password: string;
  confirm_password: string;
}

export interface RegisterResponse {
  message: string;
  customer_id: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "customer";
  customer?: CustomerProfile | null;
}

export const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = resData.detail || "Registration failed.";
    if (Array.isArray(resData.detail)) {
      errorMsg = resData.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ");
    }
    throw new Error(errorMsg);
  }

  return resData;
};

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = resData.detail || "Invalid email or password.";
    if (Array.isArray(resData.detail)) {
      errorMsg = resData.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ");
    }
    throw new Error(errorMsg);
  }

  return resData;
};

export const getMe = async (token: string): Promise<AuthUser> => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate session.");
  }

  return response.json();
};

export const updateMe = async (
  token: string,
  data: { full_name?: string; phone?: string | null }
): Promise<{ message: string; customer: CustomerProfile }> => {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.detail || "Failed to update profile.");
  }

  return resData;
};
