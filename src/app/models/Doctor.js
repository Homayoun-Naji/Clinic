const { default: mongoose } = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    first_name: String,
    last_name: String,
    specialization: String,
    phone: String,
    email: String,
  },
  { timestamps: true },
);

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
