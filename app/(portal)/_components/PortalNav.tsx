import Link from "next/link";

export function PortalNav({ buildingName }: { buildingName: string }) {
  return (
    <nav className="bg-white border-b px-4 py-3 flex gap-6 text-sm">
      <Link href="/app" className="font-semibold">
        {buildingName}
      </Link>
      <Link href="/app/move-ins">Move-ins</Link>
      <Link href="/app/inventory">Inventory</Link>
      <Link href="/app/costs">Costs</Link>
      <Link href="/app/invoices">Invoices</Link>
      <Link href="/app/billing">Billing</Link>
    </nav>
  );
}
