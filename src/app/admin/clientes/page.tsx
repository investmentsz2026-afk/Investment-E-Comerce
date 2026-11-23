import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCustomersCatalog } from "@/server/queries/admin-commerce";
import {
  AdminCustomersManager,
  type AdminCustomerItem,
} from "@/components/admin/admin-customers-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Clientes y Empresas Mayoristas — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

interface AdminCustomersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function AdminCustomersListPage({
  searchParams,
}: AdminCustomersPageProps) {
  await requireAdmin();
  const [params, rawCustomers] = await Promise.all([
    searchParams,
    getAdminCustomersCatalog(),
  ]);

  const customers: AdminCustomerItem[] = rawCustomers.map((c) => ({
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    role: c.role,
    isActive: c.isActive,
    emailVerifiedAtIso: c.emailVerifiedAt
      ? new Date(c.emailVerifiedAt).toISOString()
      : null,
    createdAtIso: new Date(c.createdAt).toISOString(),
    company: c.company,
    ordersCount: c.ordersCount,
    confirmedOrdersCount: c.confirmedOrdersCount,
    totalSpentAmount: c.totalSpentAmount,
    quotesCount: c.quotesCount,
  }));

  return (
    <div className="shell py-6 md:py-8">
      <AdminCustomersManager
        customers={customers}
        initialSearch={params.search ?? ""}
        initialRole={params.role ?? "all"}
        initialStatus={params.status ?? "all"}
      />
    </div>
  );
}
