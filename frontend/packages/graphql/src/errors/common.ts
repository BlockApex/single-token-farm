import { ApolloError } from "apollo-server";

export class NotFound extends ApolloError {
  constructor() {
    super("Not Found", "NOT_FOUND");
  }
}

export class InternalServerError extends ApolloError {
  constructor(message: string) {
    super(
      "An internal server error ocurred" + message,
      "INTERNAL_SERVER_ERROR"
    );
  }
}
