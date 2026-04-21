import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "totes_admin") redirect("/admin");
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
