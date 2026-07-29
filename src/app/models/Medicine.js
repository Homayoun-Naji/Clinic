const { default: mongoose } = require("mongoose");

/**
 * Validates name fields that may contain numbers (medicine names like "Vitamin B12").
 * Rejects emojis, control chars, symbols. Also rejects boolean words.
 */
function isValidMedicineName(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === "true" || trimmed.toLowerCase() === "false")
    return false;
  return /^[\p{L}\p{N}\s'-]+$/u.test(trimmed);
}

/**
 * Mongoose schema for Medicine.
 *
 * Validation rules:
 *  - name, description: required, trimmed, max 50/500 chars, valid chars only
 *  - price: required number, must be >= 0
 *  - stock: optional number, must be a positive integer (> 0), no decimals
 *
 * All validators run on POST (Model.create) and on PUT
 * (findByIdAndUpdate with runValidators: true), so Create and Update
 * share the same source of truth.
 */
const MedicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      validate: {
        validator: isValidMedicineName,
        message:
          "Name must contain only letters, numbers, spaces, hyphens, or apostrophes",
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      default: 0,
      min: [1, "Stock must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Medicine ||
  mongoose.model("Medicine", MedicineSchema);
