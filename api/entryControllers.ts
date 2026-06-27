import { contestSecuredApi, userSecuredApi } from "./config";

export const entryControllers = {
  getAllEntries: async (searchQuery?: string, page: number = 1, limit: number = 9) => {
    try {
      let url = `/entries?status=semifinal&page=${page}&limit=${limit}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await userSecuredApi.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEntryById: async (contestId: string, entryId: string) => {
    try {
      const response = await contestSecuredApi.get(
        `/${contestId}/entries/${entryId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  voteForEntry: async (contestId: string, entryId: string, comment: string) => {
    try {
      const response = await contestSecuredApi.post(
        `/${contestId}/votes/${entryId}`,
        { comment }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
