import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) {
    redirect(user.role === "totes_admin" ? "/admin" : "/app");
  }

  return (
    <Suspense fallback={<main className="min-h-screen grid place-items-center">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
