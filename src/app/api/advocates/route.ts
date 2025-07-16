import { NextResponse } from "next/server";
import getDb from "../../../db";
import { advocates } from "../../../db/schema";
import { advocateData } from "../../../db/seed/advocates";

export async function GET() {
  try {
    // Try to use database first, fallback to seed data if database is not available
    let data;
    try {
      const db = getDb();
      data = await db.select().from(advocates);
      // If database is empty, use seed data
      if (data.length === 0) {
        data = advocateData;
      }
    } catch (dbError) {
      console.warn("Database not available, using seed data:", dbError);
      data = advocateData;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching advocates:", error);
    return NextResponse.json(
      { error: "Failed to fetch advocates" },
      { status: 500 }
    );
  }
}
