import { listBuildingsForCompany } from "@/lib/db/repos/buildings";
import { listUsersForCompany } from "@/lib/db/repos/users";
import { inviteUserAction } from "../../_actions";

export default async function CompanyUsers({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const users = await listUsersForCompany(id);
  const buildings = await listBuildingsForCompany(id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <section className="bg-white rounded shadow p-4 max-w-md">
        <h2 className="font-semibold">Invite user</h2>
        <form action={inviteUserAction.bind(null, id)} className="space-y-3 mt-2">
          <label className="block">
            <span className="text-sm">Email</span>
            <input name="email" type="email" className="w-full border rounded px-3 py-2" required />
          </label>
          <label className="block">
            <span className="text-sm">Role</span>
            <select name="role" className="w-full border rounded px-3 py-2">
              <option value="company_admin">Company Admin</option>
              <option value="pm_billing_admin">PM / Billing Admin</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm">Building (PMs only)</span>
            <select name="building_id" className="w-full border rounded px-3 py-2">
              <option value="">—</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <button className="bg-black text-white rounded px-3 py-2">Send invite</button>
        </form>
      </section>

      <section>
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Building</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.building_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
