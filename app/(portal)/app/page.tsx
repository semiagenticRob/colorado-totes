import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { supabaseAdmin } from "@/lib/db/client";
import { getPoolsForBuilding } from "@/lib/db/repos/inventory";

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");

  if (!user.buildingId) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold">Company rollup</h1>
        <p className="text-neutral-600 mt-2">Company-wide rollup dashboard coming soon.</p>
      </div>
    );
  }

  const db = supabaseAdmin();
  const { data: building } = await db
    .from("buildings")
    .select("*")
    .eq("id", user.buildingId)
    .single();
  const pools = await getPoolsForBuilding(user.buildingId);
  const totalOwned = pools.in_building + pools.at_3pl + pools.out_with_tenant;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {building?.billing_status === "setup_pending" && (
        <div className="bg-yellow-100 border border-yellow-400 p-3 rounded text-sm">
          Add a payment method to activate billing.
          <a href="/app/billing" className="underline ml-2">
            Set it up →
          </a>
        </div>
      )}
      {building?.billing_status === "delinquent" && (
        <div className="bg-red-100 border border-red-400 p-3 rounded text-sm">
          Your most recent invoice failed to charge. Please update your payment method.
          <a href="/app/billing" className="underline ml-2">
            Fix it →
          </a>
        </div>
      )}
      <div className="grid grid-cols-4 gap-4">
        <Stat label="In building" value={pools.in_building} />
        <Stat label="At 3PL" value={pools.at_3pl} />
        <Stat label="Out" value={pools.out_with_tenant} />
        <Stat label="Total owned" value={totalOwned} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
