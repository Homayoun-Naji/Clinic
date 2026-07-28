/**
 * Shared validation utilities — single source of truth for client & server.
 */

export const MAX_LENGTH = {
  name: 50,
  specialization: 100,
  phone: 11,
  email: 254,
  disease: 200,
  description: 500,
  birth_date: 10,
};

export const NAME_REGEX = /^[\p{L}\s'-]+$/u;
export const NAME_WITH_NUMBERS_REGEX = /^[\p{L}\p{N}\s'-]+$/u;
export const PHONE_REGEX = /^09\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PRICE_REGEX = /^\d+(\.\d+)?$/;
export const STOCK_REGEX = /^[1-9]\d*$/;
export const BIRTH_DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

export function normalizeWhitespace(v) {
  return v.trim().replace(/\s+/g, " ");
}

export function validateField(key, value, opts = {}) {
  const { required = false, entity = undefined } = opts;

  if (value === null || value === undefined) {
    if (required) return { ok: false, error: `${key} is required` };
    return { ok: true };
  }
  if (typeof value !== "string" && typeof value !== "number") {
    return { ok: false, error: `${key} must be a string or number` };
  }

  const str = String(value);
  if (str === "") {
    if (required) return { ok: false, error: `${key} is required` };
    return { ok: true };
  }

  const normalized = normalizeWhitespace(str);

  // reject boolean words anywhere
  if (normalized.toLowerCase() === "true" || normalized.toLowerCase() === "false") {
    return { ok: false, error: `${key} must not be a boolean value` };
  }

  const maxLen = MAX_LENGTH[key] || 255;
  if (normalized.length > maxLen) {
    return { ok: false, error: `${key} must be at most ${maxLen} characters` };
  }

  switch (key) {
    case "first_name":
    case "last_name":
    case "specialization":
    case "disease": {
      if (!NAME_REGEX.test(normalized)) {
        return {
          ok: false,
          error: `${key} must contain only letters, spaces, hyphens, or apostrophes`,
        };
      }
      break;
    }
    case "phone": {
      if (!PHONE_REGEX.test(normalized)) {
        return { ok: false, error: "Phone must be exactly 11 digits starting with 09" };
      }
      break;
    }
    case "email": {
      if (normalized && !EMAIL_REGEX.test(normalized)) {
        return { ok: false, error: "Invalid email format" };
      }
      break;
    }
    case "price": {
      if (!PRICE_REGEX.test(normalized)) {
        return { ok: false, error: "Price must be a non-negative number" };
      }
      if (Number(normalized) < 0) return { ok: false, error: "Price cannot be negative" };
      break;
    }
    case "stock": {
      if (normalized === "") {
        // optional when empty
        break;
      }
      if (!STOCK_REGEX.test(normalized)) {
        return { ok: false, error: "Stock must be a positive integer (1 or greater)" };
      }
      break;
    }
    case "birth_date": {
      if (!BIRTH_DATE_REGEX.test(normalized)) {
        return { ok: false, error: "Birth date must be in DD/MM/YYYY format" };
      }
      const [dd, mm, yyyy] = normalized.split("/").map(Number);
      const date = new Date(yyyy, mm - 1, dd);
      const isValid = date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd;
      if (!isValid) return { ok: false, error: "Birth date is not a valid calendar date" };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) return { ok: false, error: "Birth date cannot be in the future" };
      break;
    }
    case "name": {
      // Allow numbers only for medicines
      if (entity === "medicines") {
        if (!NAME_WITH_NUMBERS_REGEX.test(normalized)) {
          return { ok: false, error: `${key} must contain only letters, numbers, spaces, hyphens, or apostrophes` };
        }
      } else {
        if (!NAME_REGEX.test(normalized)) {
          return { ok: false, error: `${key} must contain only letters, spaces, hyphens, or apostrophes` };
        }
      }
      break;
    }
    case "description": {
      if (/[\p{Cc}\p{Cf}]/u.test(normalized)) {
        return { ok: false, error: `${key} contains invalid control characters` };
      }
      break;
    }
  }

  return { ok: true };
}

/**
 * Validates a request body against the required fields, normalizes whitespace
 * on string values, and returns the cleaned data. Throws a Mongoose-style
 * ValidationError when any field fails validation so the API handlers can
 * map it to a 400 response with field-level errors.
 *
 * @param {object} body - Raw request body.
 * @param {string[]} requiredKeys - Model field keys that must be non-empty.
 * @param {string} [entity] - Entity key for entity-specific rules (e.g. "medicines").
 * @returns {object} Normalized data ready to save.
 * @throws {{ name: string, errors: Record<string, { message: string }> }}
 */
export function normalizeAndValidate(body, requiredKeys, entity = undefined) {
  const errors = {};
  const data = {};

  for (const [key, value] of Object.entries(body)) {
    const required = requiredKeys.includes(key);
    const result = validateField(key, value, { required, entity });
    if (!result.ok) {
      errors[key] = { message: result.error };
    } else {
      data[key] = typeof value === "string" ? normalizeWhitespace(value) : value;
    }
  }

  for (const key of requiredKeys) {
    if (!(key in body) || body[key] === "" || body[key] === null || body[key] === undefined) {
      errors[key] = { message: `${key} is required` };
    }
  }

  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed");
    err.name = "ValidationError";
    err.errors = errors;
    throw err;
  }

  return data;
}
