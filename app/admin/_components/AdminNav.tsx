import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="bg-white border-b px-4 py-3 flex gap-6 text-sm">
      <Link href="/admin" className="font-semibold">
        Colorado Totes Admin
      </Link>
      <Link href="/admin/pending-deliveries">Deliveries</Link>
      <Link href="/admin/palletization">Palletization</Link>
      <Link href="/admin/companies">Companies</Link>
      <Link href="/admin/invoices">Invoices</Link>
      <Link href="/admin/warehousing">Warehousing</Link>
    </nav>
  );
}
