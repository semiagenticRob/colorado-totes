import { supabaseAdmin } from "@/lib/db/client";
import { totesFromBatches } from "@/lib/domain/batches";
import { nextState, type MoveInState } from "@/lib/domain/move-in-state";

export type NewMoveIn = {
  building_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone?: string | null;
  unit_label: string;
  unit_type: "studio" | "1br" | "2br" | "3br_plus" | "other";
  move_in_date: string;
  batch_count: number;
  created_by_user_id?: string | null;
};

export async function createMoveIn(input: NewMoveIn) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("move_ins").insert(input).select("*").single();
  if (error) throw error;
  await db.from("move_in_events").insert({
    move_in_id: data.id,
    event_type: "created",
    actor_user_id: input.created_by_user_id ?? null,
  });
  return data;
}

export async function getMoveInById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("move_ins").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function markDelivered(id: string, opts: { actor_user_id?: string | null } = {}) {
  const db = supabaseAdmin();
  const mi = await getMoveInById(id);
  if (!mi) throw new Error("move_in not found");
  nextState(mi.state as MoveInState, "delivered");

  const totes = totesFromBatches(mi.batch_count);

  const { error: e1 } = await db.rpc("decrement_pool", {
    p_building_id: mi.building_id,
    p_location: "at_3pl",
    p_amount: totes,
  });
  if (e1) throw e1;
  const { error: e2 } = await db.rpc("increment_pool", {
    p_building_id: mi.building_id,
    p_location: "out_with_tenant",
    p_amount: totes,
  });
  if (e2) throw e2;

  const { error } = await db
    .from("move_ins")
    .update({ state: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await db.from("move_in_events").insert({
    move_in_id: id,
    event_type: "delivered",
    actor_user_id: opts.actor_user_id ?? null,
  });
}

export async function markReturned(id: string, opts: { actor_user_id?: string | null } = {}) {
  const db = supabaseAdmin();
  const mi = await getMoveInById(id);
  if (!mi) throw new Error("move_in not found");
  nextState(mi.state as MoveInState, "returned");

  const totes = totesFromBatches(mi.batch_count);
  await db.rpc("decrement_pool", {
    p_building_id: mi.building_id,
    p_location: "out_with_tenant",
    p_amount: totes,
  });
  await db.rpc("increment_pool", {
    p_building_id: mi.building_id,
    p_location: "in_building",
    p_amount: totes,
  });
  await db
    .from("move_ins")
    .update({ state: "returned", returned_at: new Date().toISOString() })
    .eq("id", id);
  await db.from("move_in_events").insert({
    move_in_id: id,
    event_type: "returned",
    actor_user_id: opts.actor_user_id ?? null,
  });
}

export async function listMoveInEvents(moveInId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("move_in_events")
    .select("*")
    .eq("move_in_id", moveInId)
    .order("occurred_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
