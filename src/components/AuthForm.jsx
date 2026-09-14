"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      router.push("/schedule");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-6 sm:px-5 sm:py-10">
      <div className="grid w-full overflow-hidden rounded-[1.5rem] border border-line bg-cream shadow-[0_24px_80px_rgba(20,36,34,0.12)] sm:rounded-[2rem] lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-pine px-10 py-12 text-cream lg:block">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-night/40" />
          <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full border border-cream/20" />
          <p className="text-sm uppercase tracking-[0.28em] text-cream/70">Personal shift scheduler</p>
          <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-5xl leading-tight">
            NurseShift
          </h1>
          <p className="mt-5 max-w-sm text-lg leading-8 text-cream/80">
            Keep day, evening, and overnight shifts on one calendar. Swap with a coworker
            and still see the original date.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-cream/75">
            <li>Monthly calendar with night-shift carryover</li>
            <li>Agenda list for upcoming work</li>
            <li>Swap history you can check later</li>
          </ul>
        </section>

        <section className="px-5 py-8 sm:px-10 sm:py-10">
          <p className="text-xs uppercase tracking-[0.24em] text-moss">NurseShift</p>
          <h2 className="mt-2 font-[family-name:var(--font-fraunces)] text-[1.75rem] leading-tight text-ink sm:text-3xl">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-moss sm:text-base">
            {isRegister
              ? "A username, email, and password is all you need."
              : "Sign in to open your shift calendar."}
          </p>

          <form className="mt-6 space-y-4 sm:mt-8" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none ring-gold/40 focus:ring-2"
              />
            </label>

            {isRegister && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none ring-gold/40 focus:ring-2"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                minLength={6}
                className="w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none ring-gold/40 focus:ring-2"
              />
            </label>

            {error && (
              <p className="rounded-2xl bg-evening/10 px-4 py-3 text-sm text-evening">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-2xl bg-pine px-4 py-3.5 font-medium text-cream transition hover:bg-ink disabled:opacity-60"
            >
              {pending ? "Please wait…" : isRegister ? "Register" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-moss">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={isRegister ? "/" : "/register"}
              className="font-medium text-pine underline decoration-line underline-offset-4"
            >
              {isRegister ? "Sign in" : "Register"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
