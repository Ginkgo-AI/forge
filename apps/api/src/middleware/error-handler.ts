import type { ErrorHandler } from "hono";
import { AppError, ValidationError } from "../lib/errors.js";

export const errorHandler: ErrorHandler = (err, c) => {
  // AppError subclasses (NotFoundError, ForbiddenError, ValidationError)
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { error: err.message };
    if (err.code) body.code = err.code;
    if (err instanceof ValidationError && err.details) {
      body.details = err.details;
    }
    return c.json(body, err.status as any);
  }

  // Postgres error codes
  const pgCode = (err as any)?.code;
  if (typeof pgCode === "string") {
    if (pgCode === "23505") {
      return c.json(
        { error: "A record with that value already exists", code: "DUPLICATE" },
        409
      );
    }
    if (pgCode === "23503") {
      return c.json(
        { error: "Referenced record does not exist", code: "FK_VIOLATION" },
        400
      );
    }
  }

  console.error(`[Error] ${err.message}`, err.stack);

  if (err instanceof Response) {
    return err;
  }

  const status =
    "status" in err && typeof err.status === "number" ? err.status : 500;
  const message = status === 500 ? "Internal server error" : err.message;

  return c.json({ error: message }, status as any);
};
