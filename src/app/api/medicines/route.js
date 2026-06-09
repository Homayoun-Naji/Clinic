import { connectToDB } from "@/app/lib/mongodb";
import Medicine from "@/app/models/Medicine";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();
    const medicines = await Medicine.find({});
    return NextResponse.json(medicines, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error while fetching medicines" },
      { status: 500 }
    );
  }
}
