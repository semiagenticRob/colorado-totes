import { createCompanyAction } from "../_actions";

export default function NewCompanyPage() {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New company</h1>
      <form action={createCompanyAction} className="space-y-3">
        <label className="block">
          <span className="text-sm">Name</span>
          <input name="name" className="w-full border rounded px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Slug</span>
          <input name="slug" className="w-full border rounded px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Overdue threshold (days)</span>
          <input
            name="overdue_days"
            type="number"
            defaultValue={14}
            className="w-full border rounded px-3 py-2"
          />
        </label>
        <button className="bg-black text-white rounded px-3 py-2">Create</button>
      </form>
    </div>
  );
}
