import { userPublicApi, authPublicApi, authSecuredApi } from "./config";

export const PublicAuthControllers = {
  createPublicUser: async (data: Record<string, unknown>) => {
    try {
      const result = await userPublicApi.post("create-public", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  verifyPublicOtp: async (payload: { email?: string; otp: string; [key: string]: unknown }) => {
    try {
      const result = await userPublicApi.post("verify-public-otp", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  login: async (data: Record<string, unknown>) => {
    try {
      let result = await authPublicApi.post("login", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  logout: async (data: Record<string, unknown> = {}) => {
    try {
      let result = await authSecuredApi.post("logout", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  forgotPassword: async (data: Record<string, unknown>) => {
    try {
      let result = await authPublicApi.post("forgot-password", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  resetPassword: async (data: Record<string, unknown>) => {
    try {
      let result = await authPublicApi.post("reset-password", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  resendPublicOtp: async (data: Record<string, unknown>) => {
    try {
      const result = await userPublicApi.post("resend-public-otp", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  resendOtp: async (data: Record<string, unknown>) => {
    try {
      const result = await authPublicApi.post("resend-otp", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
};
