import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("Please check the database settings!");

let isConnected = false

export async function connectToDB() {
    if(isConnected) return console.log("Already connected");

    try {
        await mongoose.connect(uri, {dbName: "Clinic_db"})
        isConnected = true
        console.log("Connected successfully!");
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}