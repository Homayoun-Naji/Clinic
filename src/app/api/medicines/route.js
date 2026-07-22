import { connectToDB } from "@/app/lib/mongodb";
import Medicine from "@/app/models/Medicine";
import { NextResponse } from "next/server";
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/app/lib/api";

export const GET = createGetHandler(Medicine, "Medicine");

// export async function GET() {
//   try {
//     await connectToDB();
//     const medicines = await Medicine.find({});
//     return NextResponse.json(medicines, { status: 200 });
//   } catch (error) {
//     return NextResponse.json(
//       { error: `Failed to fetch medicines: ${error.message}` },
//       { status: 500 }
//     );
//   }
// }

export const POST = createPostHandler(
  Medicine,
  ["name", "description", "price"],
  "Medicine"
);

export const PUT = createPutHandler(
  Medicine,
  ["name", "description", "price"],
  "Medicine"
);

export const DELETE = createDeleteHandler(Medicine, "Medicine");
