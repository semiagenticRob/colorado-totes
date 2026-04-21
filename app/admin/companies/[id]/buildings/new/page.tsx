import { createBuildingAction } from "../../../_actions";

export default async function NewBuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New building</h1>
      <form action={createBuildingAction.bind(null, id)} className="space-y-3">
        <label className="block">
          <span className="text-sm">Name</span>
          <input name="name" className="w-full border rounded px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Address</span>
          <input name="address" className="w-full border rounded px-3 py-2" required />
        </label>
        <button className="bg-black text-white rounded px-3 py-2">Create</button>
      </form>
    </div>
  );
}
