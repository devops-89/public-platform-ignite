import { contestSecuredApi } from "./config";

export const contestControllers = {
  getContestDetails: async (id: string | undefined) => {
    try {
      const response = await contestSecuredApi.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
