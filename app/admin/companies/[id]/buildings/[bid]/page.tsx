import { notFound } from "next/navigation";
import { getBuildingById } from "@/lib/db/repos/buildings";
import { getPoolsForBuilding, listAcquisitions, listLosses } from "@/lib/db/repos/inventory";
import { recordAcquisitionAction } from "../../../_actions";

export default async function BuildingDetail({
  params,
}: {
  params: Promise<{ id: string; bid: string }>;
}) {
  const { id, bid } = await params;
  const building = await getBuildingById(bid);
  if (!building) notFound();
  const pools = await getPoolsForBuilding(bid);
  const acqs = await listAcquisitions(bid);
  const losses = await listLosses(bid);

  const lostTotal = losses.reduce((s, l) => s + l.count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{building.name}</h1>
      <p className="text-neutral-600">{building.address}</p>

      <section className="grid grid-cols-4 gap-4">
        <Stat label="In building" value={pools.in_building} />
        <Stat label="At 3PL" value={pools.at_3pl} />
        <Stat label="Out with tenants" value={pools.out_with_tenant} />
        <Stat label="Lost / damaged" value={lostTotal} />
      </section>

      <section className="bg-white rounded shadow p-4 max-w-md">
        <h2 className="font-semibold mb-2">Record acquisition</h2>
        <form action={recordAcquisitionAction.bind(null, id, bid)} className="space-y-3">
          <label className="block">
            <span className="text-sm">Count</span>
            <input
              name="count"
              type="number"
              className="w-full border rounded px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm">Type</span>
            <select name="type" className="w-full border rounded px-3 py-2">
              <option value="initial">Initial</option>
              <option value="reorder">Reorder</option>
            </select>
          </label>
          <button className="bg-black text-white rounded px-3 py-2">Record</button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold">Acquisition history</h2>
        <ul className="mt-2 text-sm bg-white rounded shadow divide-y">
          {acqs.map((a) => (
            <li key={a.id} className="p-3 flex justify-between">
              <span>
                {a.acquisition_type}: {a.count}
              </span>
              <span className="text-neutral-500">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
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
