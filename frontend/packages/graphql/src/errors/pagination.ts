import { InternalServerError } from "./common";

export class PaginationError extends InternalServerError {
  constructor(error: string) {
    super("Pagination Error: " + error);
  }
}
