const { default: mongoose } = require("mongoose");

const PatientSchema = new mongoose.Schema(
  {
    first_name: String,
    last_name: String,
    birth_date: String,
    disease: String,
  },
  { timestamps: true }
);

export default mongoose.model.Patient ||
  mongoose.model("Patient", PatientSchema);
