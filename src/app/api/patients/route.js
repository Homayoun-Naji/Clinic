import { connectToDB } from "@/app/lib/mongodb";
import Patient from "@/app/models/Patient";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();
    const patients = await Patient.find({});
    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error while fetching patients" },
      { status: 500 }
    );
  }
}
