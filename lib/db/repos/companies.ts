import { supabaseAdmin } from "@/lib/db/client";
import type { Json } from "@/lib/db/types.generated";

export type NewCompany = {
  name: string;
  slug: string;
  settings?: Record<string, Json | undefined>;
};

export async function createCompany(input: NewCompany) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("companies")
    .insert({ name: input.name, slug: input.slug, settings: (input.settings ?? {}) as Json })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getCompanyBySlug(slug: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCompanyById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("companies").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
