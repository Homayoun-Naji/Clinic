const { default: mongoose } = require("mongoose");

/**
 * Checks that a birth-date string is a real calendar date in DD/MM/YYYY format.
 * Rejects malformed strings and impossible dates such as 31/02/2008 or 29/02/2007.
 *
 * @param {unknown} value - Value to validate.
 * @returns {boolean} True when value is a valid DD/MM/YYYY calendar date.
 */
function isValidBirthDate(value) {
  if (typeof value !== "string") return false;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const yyyy = Number(match[3]);
  const date = new Date(yyyy, mm - 1, dd);
  return (
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd
  );
}

/**
 * Validates name fields: letters, spaces, hyphens, apostrophes only.
 * Rejects emojis, control chars, symbols. Also rejects boolean words.
 */
function isValidName(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === "true" || trimmed.toLowerCase() === "false")
    return false;
  return /^[\p{L}\s'-]+$/u.test(trimmed);
}

/**
 * Mongoose schema for Patient.
 *
 * Validation rules:
 *  - first_name, last_name: required, trimmed, max 50 chars, valid name chars only
 *  - birth_date: required, must be a real DD/MM/YYYY calendar date, not in future
 *  - disease: required, trimmed, max 200 chars, valid name chars only
 *
 * All validators run on POST (Model.create) and on PUT
 * (findByIdAndUpdate with runValidators: true), so Create and Update
 * share the same source of truth.
 */
const PatientSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
      validate: {
        validator: isValidName,
        message:
          "First name must contain only letters, spaces, hyphens, or apostrophes",
      },
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
      validate: {
        validator: isValidName,
        message:
          "Last name must contain only letters, spaces, hyphens, or apostrophes",
      },
    },
    birth_date: {
      type: String,
      required: [true, "Birth date is required"],
      trim: true,
      maxlength: [10, "Birth date must be in DD/MM/YYYY format"],
      validate: {
        validator: isValidBirthDate,
        message:
          "Birth date must be a valid date in DD/MM/YYYY format (e.g. 11/03/2008)",
      },
    },
    disease: {
      type: String,
      required: [true, "Disease is required"],
      trim: true,
      maxlength: [200, "Disease cannot exceed 200 characters"],
      validate: {
        validator: isValidName,
        message:
          "Disease must contain only letters, spaces, hyphens, or apostrophes",
      },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Patient ||
  mongoose.model("Patient", PatientSchema);
