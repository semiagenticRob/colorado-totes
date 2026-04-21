import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/db/repos/companies";
import { listBuildingsForCompany } from "@/lib/db/repos/buildings";

export default async function CompanyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();
  const buildings = await listBuildingsForCompany(id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{company.name}</h1>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Buildings</h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/companies/${id}/users`}
              className="border rounded px-3 py-1.5 text-sm"
            >
              Users
            </Link>
            <Link
              href={`/admin/companies/${id}/buildings/new`}
              className="bg-black text-white rounded px-3 py-1.5 text-sm"
            >
              + Add building
            </Link>
          </div>
        </div>
        <table className="w-full bg-white rounded shadow text-sm mt-2">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Address</th>
              <th className="p-3">Billing</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3">
                  <Link className="underline" href={`/admin/companies/${id}/buildings/${b.id}`}>
                    {b.name}
                  </Link>
                </td>
                <td className="p-3 text-neutral-600">{b.address}</td>
                <td className="p-3">{b.billing_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
