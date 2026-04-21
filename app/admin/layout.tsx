import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { AdminNav } from "./_components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "totes_admin") redirect("/app");
  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminNav />
      <div className="p-6 max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
