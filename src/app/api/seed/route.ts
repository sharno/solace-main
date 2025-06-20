import { NextResponse } from "next/server";
import getDb from "../../../db";
import { advocates } from "../../../db/schema";
import { advocateData } from "../../../db/seed/advocates";

export async function POST() {
  try {
    const db = getDb();
    const records = await db.insert(advocates).values(advocateData).returning();
    return NextResponse.json({ advocates: records });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
