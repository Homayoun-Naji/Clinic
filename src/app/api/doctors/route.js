import { connectToDB } from "@/app/lib/mongodb";
import Doctor from "@/app/models/Doctor";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();
    const doctors = await Doctor.find({});
    return NextResponse.json(doctors, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error while fetching doctors" },
      { status: 500 }
    );
  }
}
