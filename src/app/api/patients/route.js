import Patient from "@/app/models/Patient";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";
import { normalizeAndValidate } from "@/app/lib/validation";

export const GET = createGetHandler(Patient, "Patient");

export const POST = createPostHandler(
  Patient,
  ["first_name", "last_name", "birth_date", "disease"],
  "Patient",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "birth_date", "disease"]),
);

export const PUT = createPutHandler(
  Patient,
  ["first_name", "last_name", "birth_date", "disease"],
  "Patient",
  (body) => normalizeAndValidate(body, ["first_name", "last_name", "birth_date", "disease"]),
);

export const DELETE = createDeleteHandler(Patient, "Patient");