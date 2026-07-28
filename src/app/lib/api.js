/**
 * Single source of truth for all CRUD / API operations.
 *
 * - Client-side helpers (fetchEntities, createEntity, updateEntity, deleteEntity)
 *   wrap fetch so components don't duplicate request/error handling.
 * - Server-side handlers (createPostHandler, createPutHandler, createDeleteHandler)
 *   build Next.js route handlers backed by Mongoose models.
 *
 * The module is safe to import from both client and server code: it has no
 * static server-only imports. The DB connection is loaded lazily inside the
 * handlers, and responses use the standard Web `Response` API, so importing
 * this file from a client component never pulls server-only code into the
 * browser bundle.
 */

// ---------------------------------------------------------------------------
// Client-side helpers
// ---------------------------------------------------------------------------

async function parseResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      result.error ||
      result.message ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    if (result.fieldErrors) {
      err.fieldErrors = result.fieldErrors;
    }
    throw err;
  }
  return result;
}

/** GET all records for an entity. */
export async function fetchEntities(apiPath) {
  const response = await fetch(apiPath);
  return parseResponse(response);
}

/** POST a new record. */
export async function createEntity(apiPath, payload) {
  const response = await fetch(apiPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

/** PUT (update) an existing record. */
export async function updateEntity(apiPath, payload) {
  const response = await fetch(apiPath, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

/** DELETE a record by id. */
export async function deleteEntity(apiPath, id) {
  const response = await fetch(apiPath, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ _id: id }),
  });
  return parseResponse(response);
}

// ---------------------------------------------------------------------------
// Server-side handlers
// ---------------------------------------------------------------------------

async function connectToDBSafe() {
  const { connectToDB } = await import("@/app/lib/mongodb");
  await connectToDB();
}

/**
 * Returns a user-friendly error message from a Mongoose error, or null when
 * the error is not a validation/cast failure. Used to map known input
 * problems to HTTP 400 instead of leaking them as 500s.
 *
 * For Mongoose ValidationError, returns an object with `fieldErrors` (keyed
 * by field path) so the frontend can display inline messages per field.
 * For other errors, returns a plain string.
 *
 * @param {unknown} error - Thrown error from a Mongoose operation.
 * @returns {string|object|null} Message or { fieldErrors } for ValidationError, or null.
 */
function extractValidationMessage(error) {
  if (!error || typeof error !== "object") return null;
  const name = /** @type {{ name?: string }} */ (error).name;
  if (name === "ValidationError") {
    const errors = /** @type {{ errors?: Record<string, { message: string }> }} */ (error).errors || {};
    const fieldErrors = {};
    for (const [path, e] of Object.entries(errors)) {
      fieldErrors[path] = e.message;
    }
    return Object.keys(fieldErrors).length ? { fieldErrors } : null;
  }
  if (name === "CastError") {
    const path = /** @type {{ path?: string, value?: unknown }} */ (error).path;
    const value = /** @type {{ path?: string, value?: unknown }} */ (error).value;
    const target = path || "field";
    return `Invalid value for ${target}: ${value}`;
  }
  // MongoDB duplicate-key errors (legacy unique indexes, race conditions).
  // Translate to a friendly, non-leaking message instead of exposing the
  // raw E11000 message containing collection / index / db details.
  if (/** @type {{ code?: number }} */ (error).code === 11000) {
    return "A record with these values already exists.";
  }
  return null;
}

/**
 * Builds a response body from a validation result returned by
 * extractValidationMessage. ValidationError objects produce a
 * `{ fieldErrors }` body (keyed by field path) so the frontend can
 * display inline messages; plain strings produce `{ error }`.
 *
 * @param {string|object} validationMessage - Result from extractValidationMessage.
 * @returns {{ error?: string, fieldErrors?: Record<string, string> }}
 */
function buildValidationBody(validationMessage) {
  if (typeof validationMessage === "string") {
    return { error: validationMessage };
  }
  if (validationMessage && typeof validationMessage === "object" && "fieldErrors" in validationMessage) {
    return { fieldErrors: /** @type {{ fieldErrors: Record<string, string> }} */ (validationMessage).fieldErrors };
  }
  return { error: "Invalid input data." };
}

/**
 * were actually provided with a non-empty value. When none of the fields
 * are present we skip the lookup entirely — the model will reject the
 * record before it ever reaches the database.
 *
 * @param {object} data - Normalized request body.
 * @param {string[]} duplicateFields - Field keys considered duplicates.
 * @returns {object|undefined} Mongoose query object or undefined to skip.
 */
function buildDuplicateQuery(data, duplicateFields) {
  const query = {};
  let count = 0;
  for (const field of duplicateFields) {
    const value = data[field];
    if (value === undefined || value === null || value === "") continue;
    query[field] = value;
    count += 1;
  }
  return count > 0 ? query : undefined;
}

/**
 * Creates a handler for GET (read all) operations.
 * @param {import("mongoose").Model} Model - Mongoose model
 * @param {string} entityName - Human-readable entity name for error messages
 */
export function createGetHandler(Model, entityName) {
  return async function GET() {
    try {
      await connectToDBSafe();
      const docs = await Model.find({});
      return Response.json(docs, { status: 200 });
    } catch (error) {
      console.error(`GET ${entityName} failed:`, error);
      return Response.json(
        {
          error: `Failed to fetch ${entityName.toLowerCase()}s. Please try again.`,
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Creates a handler for POST (create) operations with duplicate checking.
 * @param {import("mongoose").Model} Model - Mongoose model
 * @param {string[]} requiredFields - Field keys used for duplicate detection
 * @param {string} entityName - Human-readable entity name for error messages
 * @param {(body: object) => object} [normalize] - Optional function to normalize body before save
 */
export function createPostHandler(
  Model,
  requiredFields,
  entityName,
  normalize,
) {
  return async function POST(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const data = normalize ? await normalize(body) : body;

      // Special-case duplicate detection for Doctor to implement the
      // "phone may be reused only for the same person with different
      // specialization" rule. This moves the behaviour into application
      // logic instead of relying on a DB-level unique index.
      if (entityName === "Doctor") {
        const first_name = data.first_name;
        const last_name = data.last_name;
        const specialization = data.specialization;
        const phone = data.phone;

        // If phone provided, inspect existing docs with that phone.
        if (phone) {
          const docsWithPhone = await Model.find({ phone });
          if (docsWithPhone.length > 0) {
            // If phone belongs to a different person -> reject
            const differentPerson = docsWithPhone.some(
              (d) => d.first_name !== first_name || d.last_name !== last_name,
            );
            if (differentPerson) {
              return Response.json(
                { error: `Phone number is already used by another ${entityName.toLowerCase()}.` },
                { status: 409 },
              );
            }

            // It's the same person(s) — reject only if same specialization exists
            const sameSpec = docsWithPhone.some((d) => d.specialization === specialization);
            if (sameSpec) {
              return Response.json(
                { error: `${entityName} already exists with the same first name, last name, phone and specialization.` },
                { status: 409 },
              );
            }
            // Otherwise: same person but different specialization -> allow
          }
        }
      } else {
        // Default duplicate detection: build query from required fields that are actually present.
        // Skipping missing/empty values avoids false-positive collisions.
        const duplicateQuery = buildDuplicateQuery(data, requiredFields);
        if (duplicateQuery) {
          const existing = await Model.findOne(duplicateQuery);
          if (existing) {
            return Response.json(
              {
                error: `${entityName} already exists with the same ${requiredFields.join(", ")}.`,
              },
              { status: 409 },
            );
          }
        }
      }

      const doc = await Model.create(data);
      return Response.json(doc, { status: 201 });
    } catch (error) {
      const validationMessage = extractValidationMessage(error);
      if (validationMessage) {
        return Response.json(
          buildValidationBody(validationMessage),
          { status: 400 },
        );
      }
      console.error(`POST ${entityName} failed:`, error);
      return Response.json(
        {
          error: `Error while creating ${entityName.toLowerCase()}. Please try again.`,
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Creates a handler for PUT (update) operations.
 * Expects `_id` in the body to identify the document.
 * @param {import("mongoose").Model} Model - Mongoose model
 * @param {string[]} requiredFields - Field keys used for duplicate detection
 * @param {string} entityName - Human-readable entity name for error messages
 * @param {(body: object) => object} [normalize] - Optional function to normalize body before update
 */
export function createPutHandler(Model, requiredFields, entityName, normalize) {
  return async function PUT(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const data = normalize ? normalize(body) : body;
      const { _id } = data;

      if (!_id) {
        return Response.json(
          { error: `${entityName} ID is required for update.` },
          { status: 400 },
        );
      }

      let existing;
      try {
        existing = await Model.findById(_id);
      } catch (lookupError) {
        // Malformed ObjectId reaches here as a CastError.
        const validationMessage = extractValidationMessage(lookupError);
        if (validationMessage) {
          return Response.json(
            buildValidationBody(validationMessage),
            { status: 400 },
          );
        }
        throw lookupError;
      }

      if (!existing) {
        return Response.json(
          { error: `${entityName} not found.` },
          { status: 404 },
        );
      }

      // Check for duplicates. Doctors need a special rule: a phone
      // number can be reused only when it belongs to the same person and
      // the specialization is different. Move that logic into app code.
      if (entityName === "Doctor") {
        const first_name = data.first_name;
        const last_name = data.last_name;
        const specialization = data.specialization;
        const phone = data.phone;

        if (phone) {
          // Find other docs with this phone (exclude the doc being updated)
          const others = await Model.find({ phone, _id: { $ne: _id } });
          if (others.length > 0) {
            // If any other doc has different name -> reject
            const differentPerson = others.some(
              (d) => d.first_name !== first_name || d.last_name !== last_name,
            );
            if (differentPerson) {
              return Response.json(
                { error: `Phone number is already used by another ${entityName.toLowerCase()}.` },
                { status: 409 },
              );
            }

            // Same person(s) — reject only if same specialization exists
            const sameSpec = others.some((d) => d.specialization === specialization);
            if (sameSpec) {
              return Response.json(
                { error: `Another ${entityName.toLowerCase()} already exists with the same first name, last name, phone and specialization.` },
                { status: 409 },
              );
            }
            // Otherwise: same person but different specialization -> allow
          }
        }
      } else {
        const duplicateQuery = buildDuplicateQuery(data, requiredFields);
        if (duplicateQuery) {
          duplicateQuery._id = { $ne: _id };
          const duplicate = await Model.findOne(duplicateQuery);
          if (duplicate) {
            return Response.json(
              {
                error: `Another ${entityName.toLowerCase()} already exists with the same ${requiredFields.join(", ")}.`,
              },
              { status: 409 },
            );
          }
        }
      }

      // Remove _id from update data
      const { _id: omitted, ...updateData } = data;
      const updated = await Model.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      });

      return Response.json(updated, { status: 200 });
    } catch (error) {
      const validationMessage = extractValidationMessage(error);
      if (validationMessage) {
        return Response.json(
          buildValidationBody(validationMessage),
          { status: 400 },
        );
      }
      console.error(`PUT ${entityName} failed:`, error);
      return Response.json(
        {
          error: `Error while updating ${entityName.toLowerCase()}. Please try again.`,
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Creates a handler for DELETE operations.
 * Expects `_id` in the body to identify the document.
 * @param {import("mongoose").Model} Model - Mongoose model
 * @param {string} entityName - Human-readable entity name for error messages
 */
export function createDeleteHandler(Model, entityName) {
  return async function DELETE(req) {
    try {
      await connectToDBSafe();
      const body = await req.json();
      const { _id } = body;

      if (!_id) {
        return Response.json(
          { error: `${entityName} ID is required for deletion.` },
          { status: 400 },
        );
      }

      let existing;
      try {
        existing = await Model.findById(_id);
      } catch (lookupError) {
        const validationMessage = extractValidationMessage(lookupError);
        if (validationMessage) {
          return Response.json(
            buildValidationBody(validationMessage),
            { status: 400 },
          );
        }
        throw lookupError;
      }

      if (!existing) {
        return Response.json(
          { error: `${entityName} not found.` },
          { status: 404 },
        );
      }

      await Model.findByIdAndDelete(_id);
      return Response.json(
        { message: `${entityName} deleted successfully.` },
        { status: 200 },
      );
    } catch (error) {
      const validationMessage = extractValidationMessage(error);
      if (validationMessage) {
        return Response.json(
          buildValidationBody(validationMessage),
          { status: 400 },
        );
      }
      console.error(`DELETE ${entityName} failed:`, error);
      return Response.json(
        {
          error: `Error while deleting ${entityName.toLowerCase()}. Please try again.`,
        },
        { status: 500 },
      );
    }
  };
}
