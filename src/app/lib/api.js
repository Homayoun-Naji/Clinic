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
    throw new Error(message);
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
      return Response.json(
        {
          error: `Failed to fetch ${entityName.toLowerCase()}s: ${error.message}`,
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
      const data = normalize ? normalize(body) : body;

      // Build duplicate query from required fields only
      const duplicateQuery = {};
      for (const field of requiredFields) {
        duplicateQuery[field] = data[field];
      }

      const existing = await Model.findOne(duplicateQuery);
      if (existing) {
        return Response.json(
          {
            error: `${entityName} already exists with the same ${requiredFields.join(", ")}.`,
          },
          { status: 409 },
        );
      }

      const doc = await Model.create(data);
      return Response.json(doc, { status: 201 });
    } catch (error) {
      return Response.json(
        {
          error: `Error while creating ${entityName.toLowerCase()}: ${error.message}`,
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

      const existing = await Model.findById(_id);
      if (!existing) {
        return Response.json(
          { error: `${entityName} not found.` },
          { status: 404 },
        );
      }

      // Check for duplicate among other documents
      const duplicateQuery = { _id: { $ne: _id } };
      for (const field of requiredFields) {
        duplicateQuery[field] = data[field];
      }

      const duplicate = await Model.findOne(duplicateQuery);
      if (duplicate) {
        return Response.json(
          {
            error: `Another ${entityName.toLowerCase()} already exists with the same ${requiredFields.join(", ")}.`,
          },
          { status: 409 },
        );
      }

      // Remove _id from update data
      const { _id: omitted, ...updateData } = data;
      const updated = await Model.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      });

      return Response.json(updated, { status: 200 });
    } catch (error) {
      return Response.json(
        {
          error: `Error while updating ${entityName.toLowerCase()}: ${error.message}`,
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

      const existing = await Model.findById(_id);
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
      return Response.json(
        {
          error: `Error while deleting ${entityName.toLowerCase()}: ${error.message}`,
        },
        { status: 500 },
      );
    }
  };
}
