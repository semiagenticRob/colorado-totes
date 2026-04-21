import { notFound } from "next/navigation";
import { getMoveInById, listMoveInEvents } from "@/lib/db/repos/move-ins";
import { markReturnedAction } from "../_actions";

export default async function MoveInDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mi = await getMoveInById(id);
  if (!mi) notFound();
  const events = await listMoveInEvents(id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">{mi.tenant_name}</h1>
      <dl className="bg-white rounded shadow p-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-neutral-500">Unit</dt>
        <dd>
          {mi.unit_label} ({mi.unit_type})
        </dd>
        <dt className="text-neutral-500">Email</dt>
        <dd>{mi.tenant_email}</dd>
        <dt className="text-neutral-500">Move-in date</dt>
        <dd>{mi.move_in_date}</dd>
        <dt className="text-neutral-500">Batches</dt>
        <dd>
          {mi.batch_count} ({mi.batch_count * 20} totes)
        </dd>
        <dt className="text-neutral-500">State</dt>
        <dd>{mi.state}</dd>
      </dl>

      {mi.state === "delivered" && (
        <form action={markReturnedAction.bind(null, id)}>
          <button className="bg-black text-white rounded px-3 py-2">Mark returned</button>
        </form>
      )}

      <section>
        <h2 className="font-semibold">Activity</h2>
        <ul className="mt-2 bg-white rounded shadow divide-y text-sm">
          {events.map((e) => (
            <li key={e.id} className="p-3 flex justify-between">
              <span>{e.event_type}</span>
              <span className="text-neutral-500">{new Date(e.occurred_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
