import { connectToDB } from "@/app/lib/mongodb";
import Patient from "@/app/models/Patient";
import { NextResponse } from "next/server";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";

export const GET = createGetHandler(Patient, "Patient");

// export async function GET() {
//   try {
//     await connectToDB();
//     const patients = await Patient.find({});
//     return NextResponse.json(patients, { status: 200 });
//   } catch (error) {
//     return NextResponse.json(
//       { error: `Failed to fetch patients: ${error.message}` },
//       { status: 500 }
//     );
//   }
// }

export const POST = createPostHandler(
  Patient,
  ["first_name", "last_name", "birth_date"],
  "Patient"
);

export const PUT = createPutHandler(
  Patient,
  ["first_name", "last_name", "birth_date"],
  "Patient"
);

export const DELETE = createDeleteHandler(Patient, "Patient");
