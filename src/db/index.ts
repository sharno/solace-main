import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let db: ReturnType<typeof drizzle> | null = null;

const getDb = () => {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    // for query purposes
    const queryClient = postgres(process.env.DATABASE_URL);
    db = drizzle(queryClient);
  }
  return db;
};

export default getDb;
