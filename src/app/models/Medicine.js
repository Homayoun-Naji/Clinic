const { default: mongoose } = require("mongoose");

const MedicineSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    stock: Number,
  },
  { timestamps: true }
);

export default mongoose.models.Medicine ||
  mongoose.model("Medicine", MedicineSchema);
