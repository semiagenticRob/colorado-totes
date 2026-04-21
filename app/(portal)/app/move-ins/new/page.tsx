"use client";

import { useState } from "react";
import { createMoveInAction } from "../_actions";

const DEFAULTS: Record<string, number> = {
  studio: 1,
  "1br": 2,
  "2br": 2,
  "3br_plus": 3,
  other: 1,
};

export default function NewMoveIn() {
  const [unitType, setUnitType] = useState("2br");
  const [batchCount, setBatchCount] = useState(DEFAULTS["2br"]);

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">New move-in</h1>
      <form action={createMoveInAction} className="space-y-3">
        <Input name="tenant_name" label="Tenant name" required />
        <Input name="tenant_email" label="Tenant email" type="email" required />
        <Input name="tenant_phone" label="Tenant phone (optional)" />
        <Input name="unit_label" label="Unit label" required />
        <label className="block">
          <span className="text-sm">Unit type</span>
          <select
            name="unit_type"
            value={unitType}
            onChange={(e) => {
              setUnitType(e.target.value);
              setBatchCount(DEFAULTS[e.target.value]);
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="studio">Studio</option>
            <option value="1br">1 bedroom</option>
            <option value="2br">2 bedroom</option>
            <option value="3br_plus">3+ bedroom</option>
            <option value="other">Other</option>
          </select>
        </label>
        <Input name="move_in_date" label="Move-in date" type="date" required />
        <label className="block">
          <span className="text-sm">Batches (20 totes each)</span>
          <input
            name="batch_count"
            type="number"
            min={1}
            value={batchCount}
            onChange={(e) => setBatchCount(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Recommended: {DEFAULTS[unitType]} batch(es) for this unit type.
          </p>
        </label>
        <button className="bg-black text-white rounded px-3 py-2">Create</button>
      </form>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input className="w-full border rounded px-3 py-2" {...rest} />
    </label>
  );
}
