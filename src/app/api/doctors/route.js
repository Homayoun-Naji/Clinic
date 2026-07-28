import Doctor from "@/app/models/Doctor";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";
import { normalizeAndValidate } from "@/app/lib/validation";

export const GET = createGetHandler(Doctor, "Doctor");

export const POST = createPostHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "specialization", "phone"]),
);

export const PUT = createPutHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "specialization", "phone"]),
);

export const DELETE = createDeleteHandler(Doctor, "Doctor");