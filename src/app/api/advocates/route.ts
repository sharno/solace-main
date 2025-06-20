import { NextResponse } from "next/server";
import { sql, ilike, or, and, asc, desc } from "drizzle-orm";
import getDb from "../../../db";
import { advocates } from "../../../db/schema";
import { advocateData } from "../../../db/seed/advocates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "firstName";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const city = searchParams.get("city");
    const degree = searchParams.get("degree");
    const minExperience = searchParams.get("minExperience");
    const maxExperience = searchParams.get("maxExperience");

    const offset = (page - 1) * limit;

    let data: Advocate[], total: number;
    try {
      const db = getDb();

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(advocates.firstName, `%${search}%`),
            ilike(advocates.lastName, `%${search}%`),
            ilike(advocates.city, `%${search}%`),
            ilike(advocates.degree, `%${search}%`),
            sql`${advocates.specialties}::text ILIKE ${`%${search}%`}`
          )
        );
      }

      if (city) {
        conditions.push(ilike(advocates.city, `%${city}%`));
      }

      if (degree) {
        conditions.push(ilike(advocates.degree, `%${degree}%`));
      }

      if (minExperience) {
        conditions.push(
          sql`${advocates.yearsOfExperience} >= ${parseInt(minExperience)}`
        );
      }

      if (maxExperience) {
        conditions.push(
          sql`${advocates.yearsOfExperience} <= ${parseInt(maxExperience)}`
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(advocates)
        .where(whereClause);

      total = countResult[0]?.count || 0;

      let orderBy;
      switch (sortBy) {
        case "lastName":
          orderBy =
            sortOrder === "desc"
              ? desc(advocates.lastName)
              : asc(advocates.lastName);
          break;
        case "city":
          orderBy =
            sortOrder === "desc" ? desc(advocates.city) : asc(advocates.city);
          break;
        case "degree":
          orderBy =
            sortOrder === "desc"
              ? desc(advocates.degree)
              : asc(advocates.degree);
          break;
        case "yearsOfExperience":
          orderBy =
            sortOrder === "desc"
              ? desc(advocates.yearsOfExperience)
              : asc(advocates.yearsOfExperience);
          break;
        default:
          orderBy =
            sortOrder === "desc"
              ? desc(advocates.firstName)
              : asc(advocates.firstName);
      }

      data = (await db
        .select()
        .from(advocates)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset)) as Advocate[];

      // If database is empty, use seed data (for development)
      if (
        total === 0 &&
        !search &&
        !city &&
        !degree &&
        !minExperience &&
        !maxExperience
      ) {
        data = advocateData.slice(offset, offset + limit);
        total = advocateData.length;
      }
    } catch (dbError) {
      console.warn("Database not available, using seed data:", dbError);
      let filteredData = advocateData;

      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = advocateData.filter(
          (advocate) =>
            advocate.firstName.toLowerCase().includes(searchLower) ||
            advocate.lastName.toLowerCase().includes(searchLower) ||
            advocate.city.toLowerCase().includes(searchLower) ||
            advocate.degree.toLowerCase().includes(searchLower) ||
            advocate.specialties.some((specialty) =>
              specialty.toLowerCase().includes(searchLower)
            )
        );
      }

      total = filteredData.length;
      data = filteredData.slice(offset, offset + limit);
    }

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching advocates:", error);
    return NextResponse.json(
      { error: "Failed to fetch advocates" },
      { status: 500 }
    );
  }
}
