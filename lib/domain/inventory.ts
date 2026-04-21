export type Pools = {
  in_building: number;
  at_3pl: number;
  out_with_tenant: number;
};

export type Delta =
  | { kind: "delivery"; totes: number }
  | { kind: "return"; totes: number }
  | { kind: "pickup"; totes: number }
  | { kind: "acquisition"; into: keyof Pools; totes: number };

export function applyDelta(p: Pools, d: Delta): Pools {
  switch (d.kind) {
    case "delivery":
      if (p.at_3pl < d.totes) throw new Error("Insufficient at_3pl stock");
      return {
        ...p,
        at_3pl: p.at_3pl - d.totes,
        out_with_tenant: p.out_with_tenant + d.totes,
      };
    case "return":
      if (p.out_with_tenant < d.totes) throw new Error("Insufficient out_with_tenant");
      return {
        ...p,
        out_with_tenant: p.out_with_tenant - d.totes,
        in_building: p.in_building + d.totes,
      };
    case "pickup":
      if (p.in_building < d.totes) throw new Error("Insufficient in_building");
      return {
        ...p,
        in_building: p.in_building - d.totes,
        at_3pl: p.at_3pl + d.totes,
      };
    case "acquisition":
      return { ...p, [d.into]: p[d.into] + d.totes };
  }
}
