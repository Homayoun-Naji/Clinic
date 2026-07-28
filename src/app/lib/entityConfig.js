/**
 * Centralized entity configuration.
 * Maps form field names (kebab-case) to model field names (snake_case)
 * and defines required fields for duplicate detection.
 */

/**
 * Per-entity configuration.
 *  - apiPath: base path of the CRUD API.
 *  - entityName: human-readable singular name used in toasts and errors.
 *  - fieldMapping: form field key (kebab) -> model field key (snake).
 *  - requiredFields: model keys that must be non-empty before submit.
 *  - duplicateFields: model keys used for duplicate detection (backend).
 *  - requiredFieldTitles: human title for each required model key, used
 *    by inline edit validation to show a friendly message instead of
 *    the raw snake_case key.
 */
export const ENTITY_CONFIG = {
  doctors: {
    apiPath: "/api/doctors",
    entityName: "Doctor",
    fieldMapping: {
      "first-name": "first_name",
      "last-name": "last_name",
      specialization: "specialization",
      phone: "phone",
      email: "email",
    },
    requiredFields: ["first_name", "last_name", "specialization", "phone"],
    duplicateFields: ["first_name", "last_name", "specialization"],
    requiredFieldTitles: {
      first_name: "First Name",
      last_name: "Last Name",
      specialization: "Specialization",
      phone: "Phone",
    },
  },
  medicines: {
    apiPath: "/api/medicines",
    entityName: "Medicine",
    fieldMapping: {
      name: "name",
      description: "description",
      price: "price",
      stock: "stock",
    },
    requiredFields: ["name", "description", "price"],
    duplicateFields: ["name", "description"],
    requiredFieldTitles: {
      name: "Name",
      description: "Description",
      price: "Price",
    },
  },
  patients: {
    apiPath: "/api/patients",
    entityName: "Patient",
    fieldMapping: {
      "first-name": "first_name",
      "last-name": "last_name",
      "birth-date": "birth_date",
      disease: "disease",
    },
    requiredFields: ["first_name", "last_name", "birth_date", "disease"],
    duplicateFields: ["first_name", "last_name", "birth_date", "disease"],
    requiredFieldTitles: {
      first_name: "First Name",
      last_name: "Last Name",
      birth_date: "Birth Date",
      disease: "Disease",
    },
  },
};

/**
 * Converts form data (kebab-case keys) to model data (snake_case keys).
 * @param {Object} formData - Raw form data with kebab-case keys
 * @param {Object} mapping - Field mapping from form key to model key
 * @returns {Object} Mapped data with model field names
 */
import { normalizeWhitespace } from "./validation";

export function mapFormDataToModel(formData, mapping) {
  const mapped = {};
  for (const [formKey, modelKey] of Object.entries(mapping)) {
    if (formData[formKey] === undefined) continue;
    // Normalize strings: trim + collapse internal spaces
    const raw = formData[formKey];
    const normalized = typeof raw === "string" ? normalizeWhitespace(raw) : raw;
    // Skip empty strings after normalization
    if (normalized === "") continue;
    mapped[modelKey] = normalized;
  }
  return mapped;
}

/**
 * Gets the entity key from a URL pathname.
 * @param {string} pathname - URL pathname (e.g., "/doctors")
 * @returns {string|null} Entity key or null if not found
 */
export function getEntityKeyFromPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const key = segments[0];
  return ENTITY_CONFIG[key] ? key : null;
}

/**
 * Resolves the human title for a model field key for a given entity.
 * Falls back to a snake_case → "Title Case" conversion when no explicit
 * title is registered.
 *
 * @param {string} entityKey - Entity key (e.g., "doctors")
 * @param {string} modelKey - Model field key (e.g., "first_name")
 * @returns {string} Human-readable title
 */
export function getFieldTitle(entityKey, modelKey) {
  const config = ENTITY_CONFIG[entityKey];
  if (config?.requiredFieldTitles?.[modelKey]) {
    return config.requiredFieldTitles[modelKey];
  }
  return modelKey.replace(/_/g, " ");
}