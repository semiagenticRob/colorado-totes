import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { supabaseAdmin } from "@/lib/db/client";
import { PortalNav } from "./_components/PortalNav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "totes_admin") redirect("/admin");

  const db = supabaseAdmin();
  let label = "Colorado Totes";
  if (user.buildingId) {
    const { data: building } = await db
      .from("buildings")
      .select("name")
      .eq("id", user.buildingId)
      .maybeSingle();
    if (building?.name) label = building.name;
  } else if (user.companyId) {
    const { data: company } = await db
      .from("companies")
      .select("name")
      .eq("id", user.companyId)
      .maybeSingle();
    if (company?.name) label = company.name;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PortalNav buildingName={label} />
      {children}
    </div>
  );
}
