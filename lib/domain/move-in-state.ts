export type MoveInState = "pending_delivery" | "delivered" | "returned" | "cancelled";

const ALLOWED: Record<MoveInState, MoveInState[]> = {
  pending_delivery: ["delivered", "cancelled"],
  delivered: ["returned"],
  returned: [],
  cancelled: [],
};

export function canTransition(from: MoveInState, to: MoveInState): boolean {
  return ALLOWED[from].includes(to);
}

export function nextState(from: MoveInState, to: MoveInState): MoveInState {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal transition: ${from} → ${to}`);
  }
  return to;
}
