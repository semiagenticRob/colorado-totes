import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "totes_admin") redirect("/app");
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
