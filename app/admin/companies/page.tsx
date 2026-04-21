import Link from "next/link";
import { supabaseAdmin } from "@/lib/db/client";

export default async function CompaniesPage() {
  const db = supabaseAdmin();
  const { data: companies } = await db
    .from("companies")
    .select("id,name,slug,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <Link
          href="/admin/companies/new"
          className="bg-black text-white rounded px-3 py-1.5 text-sm"
        >
          + New company
        </Link>
      </div>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Name</th>
            <th className="p-3">Slug</th>
          </tr>
        </thead>
        <tbody>
          {(companies ?? []).map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="p-3">
                <Link className="underline" href={`/admin/companies/${c.id}`}>
                  {c.name}
                </Link>
              </td>
              <td className="p-3 text-neutral-600">{c.slug}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
