import { contestSecuredApi, userSecuredApi } from "./config";

export const entryControllers = {
  getAllEntries: async () => {
    try {
      // the user explicitly asked to use the endpoint with status=semifinal on local_user_url
      const response = await userSecuredApi.get(
        `/entries?status=semifinal`
      );
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
