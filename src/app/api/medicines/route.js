import Medicine from "@/app/models/Medicine";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";
import { normalizeAndValidate } from "@/app/lib/validation";

export const GET = createGetHandler(Medicine, "Medicine");

export const POST = createPostHandler(
  Medicine,
  ["name", "description"],
  "Medicine",
  (body) => normalizeAndValidate(body, ["name", "description", "price"], "medicines"),
);

export const PUT = createPutHandler(
  Medicine,
  ["name", "description"],
  "Medicine",
  (body) => normalizeAndValidate(body, ["name", "description", "price"], "medicines"),
);

export const DELETE = createDeleteHandler(Medicine, "Medicine");