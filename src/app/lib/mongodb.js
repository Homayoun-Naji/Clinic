import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("Please check the database settings!");

let isConnected = false

export async function connectToDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(uri, { dbName: "Clinic_db" });
    isConnected = true;
  } catch (error) {
    // console.error(error);
    process.exit(1);
  }
}