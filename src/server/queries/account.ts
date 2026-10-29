import "server-only";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { userAddresses, businessApplications } from "@/server/db/schema";

export async function getUserAddresses(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));
}

export async function getUserBusinessApplication(userId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(businessApplications)
    .where(eq(businessApplications.userId, userId))
    .orderBy(desc(businessApplications.createdAt))
    .limit(1);

  return rows[0] ?? null;
}
