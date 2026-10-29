import "server-only";
import { and, desc, eq, ilike, or, sql, count } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  businessApplications,
  users,
  auditLogs,
  type businessApplicationStatusEnum,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { escapeLike } from "@/lib/catalog-params";

export interface AdminApplicationsFilter {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getAdminApplications({
  status,
  search,
  page = 1,
  pageSize = 15,
}: AdminApplicationsFilter = {}) {
  await requireAdmin();
  const db = getDb();
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  const conditions = [];

  if (
    status &&
    ["pending", "under_review", "approved", "rejected", "suspended"].includes(status)
  ) {
    conditions.push(
      eq(
        businessApplications.status,
        status as (typeof businessApplicationStatusEnum.enumValues)[number],
      ),
    );
  }

  if (search && search.trim()) {
    const s = `%${escapeLike(search.trim())}%`;
    conditions.push(
      or(
        ilike(businessApplications.legalName, s),
        ilike(businessApplications.tradeName, s),
        ilike(businessApplications.taxId, s),
        ilike(businessApplications.contactEmail, s),
        ilike(businessApplications.contactName, s),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes, items] = await Promise.all([
    db
      .select({ count: count() })
      .from(businessApplications)
      .where(whereClause),
    db
      .select({
        id: businessApplications.id,
        legalName: businessApplications.legalName,
        tradeName: businessApplications.tradeName,
        taxId: businessApplications.taxId,
        contactName: businessApplications.contactName,
        contactEmail: businessApplications.contactEmail,
        contactPhone: businessApplications.contactPhone,
        businessType: businessApplications.businessType,
        department: businessApplications.department,
        district: businessApplications.district,
        estimatedVolume: businessApplications.estimatedVolume,
        status: businessApplications.status,
        createdAt: businessApplications.createdAt,
        reviewedAt: businessApplications.reviewedAt,
        userId: businessApplications.userId,
        applicantName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        applicantEmail: users.email,
        applicantRole: users.role,
      })
      .from(businessApplications)
      .innerJoin(users, eq(businessApplications.userId, users.id))
      .where(whereClause)
      .orderBy(desc(businessApplications.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRes[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    totalPages,
    page: safePage,
    pageSize,
  };
}

export async function getAdminApplicationById(id: number) {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select({
      app: businessApplications,
      applicant: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
      },
    })
    .from(businessApplications)
    .innerJoin(users, eq(businessApplications.userId, users.id))
    .where(eq(businessApplications.id, id))
    .limit(1);

  if (rows.length === 0) return null;

  const { app, applicant } = rows[0];

  let reviewer = null;
  if (app.reviewedBy) {
    const revRows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, app.reviewedBy))
      .limit(1);
    reviewer = revRows[0] ?? null;
  }

  return {
    ...app,
    applicant,
    reviewer,
  };
}

export async function getAdminAuditLogs(limit = 25) {
  await requireAdmin();
  const db = getDb();
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      actorName: sql<string | null>`${users.firstName} || ' ' || ${users.lastName}`,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
