import { api } from "../../../api/axios";
import type { User } from "../../../contexts/AuthContext";
import type { PortalRole } from "../schemas/authSchemas";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: PortalRole;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    tokens?: {
      accessToken: string;
    };
    user: User;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },
  
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    const response = await api.get<{ success: boolean; data: User }>("/auth/me");
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/auth/verify-email", { token });
    return response.data;
  },

  verifyOtp: async (payload: { email: string; otp: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/auth/verify-otp", payload);
    return response.data;
  },

  resendOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/auth/resend-otp", { email });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (payload: { token: string; password: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/auth/reset-password", payload);
    return response.data;
  },

  verifyPhone: async (payload: { email: string; phone: string; firebaseToken: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/auth/verify-phone", payload);
    return response.data;
  }
};
