/**
 * Centralized entity configuration.
 * Maps form field names (kebab-case) to model field names (snake_case)
 * and defines required fields for duplicate detection.
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
    requiredFields: ["first_name", "last_name", "specialization"],
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
    requiredFields: ["first_name", "last_name", "birth_date"],
  },
};

/**
 * Converts form data (kebab-case keys) to model data (snake_case keys).
 * @param {Object} formData - Raw form data with kebab-case keys
 * @param {Object} mapping - Field mapping from form key to model key
 * @returns {Object} Mapped data with model field names
 */
export function mapFormDataToModel(formData, mapping) {
  const mapped = {};
  for (const [formKey, modelKey] of Object.entries(mapping)) {
    if (formData[formKey] !== undefined && formData[formKey] !== "") {
      mapped[modelKey] = formData[formKey];
    }
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