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

export default mongoose.model.Medicine ||
  mongoose.model("Medicine", MedicineSchema);
