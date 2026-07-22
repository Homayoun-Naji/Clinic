import { connectToDB } from "@/app/lib/mongodb";
import Doctor from "@/app/models/Doctor";
import { NextResponse } from "next/server";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";

export const GET = createGetHandler(Doctor, "Doctor");

// export async function GET() {
//   try {
//     await connectToDB();
//     const doctors = await Doctor.find({});
//     return NextResponse.json(doctors, { status: 200 });
//   } catch (error) {
//     return NextResponse.json(
//       { error: `Failed to fetch doctors: ${error.message}` },
//       { status: 500 }
//     );
//   }
// }

export const POST = createPostHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor"
);

export const PUT = createPutHandler(
  Doctor,
  ["first_name", "last_name", "specialization"],
  "Doctor"
);

export const DELETE = createDeleteHandler(Doctor, "Doctor");
