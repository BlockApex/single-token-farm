import { CommonErrors } from "@/errors";

export default {
  Query: {
    health: async () => {
      try {
        return {
          message: "Up and running",
        };
      } catch (error) {
        throw new CommonErrors.InternalServerError((error as Error).message);
      }
    },
  },
};
