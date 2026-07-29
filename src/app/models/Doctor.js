const { default: mongoose } = require("mongoose");

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
 * Validates phone: exactly 11 digits, starts with 09.
 */
function isValidPhone(value) {
  if (typeof value !== "string") return false;
  return /^09\d{9}$/.test(value.trim());
}

/**
 * Validates email: basic RFC-ish pattern.
 */
function isValidEmail(value) {
  if (typeof value !== "string") return false;
  if (value.trim() === "") return true; // empty allowed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Mongoose schema for Doctor.
 *
 * Validation rules:
 *  - first_name, last_name, specialization: required, trimmed, max 50/100 chars, valid name chars only
 *  - phone: required, exactly 11 digits starting with 09
 *  - email: optional, trimmed, lowercased, valid format when provided
 *
 * All validators run on POST (Model.create) and on PUT
 * (findByIdAndUpdate with runValidators: true), so Create and Update
 * share the same source of truth.
 */
const DoctorSchema = new mongoose.Schema(
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
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
      maxlength: [100, "Specialization cannot exceed 100 characters"],
      validate: {
        validator: isValidName,
        message:
          "Specialization must contain only letters, spaces, hyphens, or apostrophes",
      },
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      maxlength: [11, "Phone must be exactly 11 digits"],
      validate: {
        validator: isValidPhone,
        message: "Phone must be exactly 11 digits starting with 09",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: [254, "Email cannot exceed 254 characters"],
      validate: {
        validator: isValidEmail,
        message: "Invalid email format",
      },
    },
  },
  { timestamps: true },
);

// Unique index on phone removed — duplicate detection now handled in
// application logic (api.js) to allow the same doctor with different
// specializations to share a phone number.

const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);

// When the DB connection opens, drop any legacy indexes that are no longer
// declared in the schema (such as the old unique index on phone). This keeps
// the actual database indexes in sync with the schema definition.
mongoose.connection.once("open", () => {
  Doctor.syncIndexes().catch(() => {});
});

export default Doctor;
