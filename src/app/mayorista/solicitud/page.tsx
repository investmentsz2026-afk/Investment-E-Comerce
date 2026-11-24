import type { Metadata } from "next";
import { requireAuth } from "@/server/auth/session";
import { getUserBusinessApplication } from "@/server/queries/account";
import { WholesaleStatusView } from "@/components/wholesale/wholesale-status-view";

export const metadata: Metadata = {
  title: "Estado de Solicitud Mayorista | American Colt JEANS™ B2B",
  description: "Consulta el estado de tu solicitud de cuenta comercial mayorista en American Colt JEANS™.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function WholesaleStatusPage() {
  const { user } = await requireAuth("/mayorista/solicitud");
  const app = await getUserBusinessApplication(user.id);

  return (
    <div className="bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 pt-[7rem] pb-16 sm:pt-[7.25rem] lg:pt-[10.75rem] lg:pb-24">
      <div className="shell max-w-4xl">
        <WholesaleStatusView userRole={user.role} app={app} />
      </div>
    </div>
  );
}
