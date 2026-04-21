import { CardSetupForm } from "./_CardSetupForm";

export default function BillingPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Payment method</h1>
      <p className="text-neutral-600">
        Your monthly invoices (subscription + logistics pass-through + management fee) will be
        charged to this card.
      </p>
      <CardSetupForm />
    </div>
  );
}
