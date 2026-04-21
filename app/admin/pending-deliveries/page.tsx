import { supabaseAdmin } from "@/lib/db/client";
import { markDeliveredAction } from "./_actions";

type Row = {
  id: string;
  tenant_name: string;
  unit_label: string;
  move_in_date: string;
  batch_count: number;
  buildings: { name: string } | null;
};

export default async function PendingDeliveries() {
  const db = supabaseAdmin();
  const { data } = await db
    .from("move_ins")
    .select("id,tenant_name,unit_label,move_in_date,batch_count,buildings(name)")
    .eq("state", "pending_delivery")
    .order("move_in_date", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Pending deliveries</h1>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Building</th>
            <th className="p-3">Tenant</th>
            <th className="p-3">Unit</th>
            <th className="p-3">Date</th>
            <th className="p-3">Batches</th>
            <th className="p-3">Mark delivered + cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="border-b last:border-0">
              <td className="p-3">{m.buildings?.name}</td>
              <td className="p-3">{m.tenant_name}</td>
              <td className="p-3">{m.unit_label}</td>
              <td className="p-3">{m.move_in_date}</td>
              <td className="p-3">{m.batch_count}</td>
              <td className="p-3">
                <form
                  action={markDeliveredAction.bind(null, m.id)}
                  className="flex items-center gap-2"
                >
                  <input
                    name="passthrough"
                    type="number"
                    step="0.01"
                    placeholder="Passthrough $"
                    className="border rounded px-2 py-1 w-28"
                    required
                  />
                  <input
                    name="markup"
                    type="number"
                    step="0.01"
                    placeholder="Markup $"
                    className="border rounded px-2 py-1 w-24"
                    defaultValue="0"
                  />
                  <button className="bg-black text-white rounded px-3 py-1">Mark delivered</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
