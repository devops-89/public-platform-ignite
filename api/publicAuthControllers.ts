import { userPublicApi } from "./config";

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
};
