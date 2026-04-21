import { createClient } from "@supabase/supabase-js";

export function anonClientWithJwt(jwt: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
}

export async function signInAs(email: string, password: string): Promise<string> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session!.access_token;
}
