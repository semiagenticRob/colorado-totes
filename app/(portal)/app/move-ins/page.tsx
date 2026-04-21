import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { supabaseAdmin } from "@/lib/db/client";

export default async function MoveInsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const user = await currentUser();
  if (!user || !user.buildingId) redirect("/login");
  const { state } = await searchParams;

  let q = supabaseAdmin()
    .from("move_ins")
    .select("id,tenant_name,unit_label,move_in_date,batch_count,state")
    .eq("building_id", user.buildingId)
    .order("move_in_date", { ascending: false });
  if (state) {
    q = q.eq("state", state as "pending_delivery" | "delivered" | "returned" | "cancelled");
  }
  const { data } = await q;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Move-ins</h1>
        <Link className="bg-black text-white rounded px-3 py-1.5 text-sm" href="/app/move-ins/new">
          + New
        </Link>
      </div>
      <div className="flex gap-3 text-sm">
        {["all", "pending_delivery", "delivered", "returned", "cancelled"].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/app/move-ins" : `/app/move-ins?state=${s}`}
            className="underline"
          >
            {s}
          </Link>
        ))}
      </div>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Tenant</th>
            <th className="p-3">Unit</th>
            <th className="p-3">Move-in</th>
            <th className="p-3">Batches</th>
            <th className="p-3">State</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((m) => (
            <tr key={m.id} className="border-b last:border-0">
              <td className="p-3">
                <Link className="underline" href={`/app/move-ins/${m.id}`}>
                  {m.tenant_name}
                </Link>
              </td>
              <td className="p-3">{m.unit_label}</td>
              <td className="p-3">{m.move_in_date}</td>
              <td className="p-3">{m.batch_count}</td>
              <td className="p-3">{m.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
