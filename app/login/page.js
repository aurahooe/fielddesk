"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sb = getBrowserClient();
    sb.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, []);

  async function ensureProfile(sb, u) {
    const handle =
      (u.email?.split("@")[0] || "guest") + "-" + u.id.slice(0, 4);
    await sb.from("fielddesk_profiles").upsert({
      id: u.id,
      handle,
      display_name: u.email?.split("@")[0] || "guest",
    });
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const sb = getBrowserClient();
    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return setErr(error.message);
      if (data.user) await ensureProfile(sb, data.user);
      setMsg("Check your email if confirmation is on, then sign in.");
      return;
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setErr(error.message);
    if (data.user) await ensureProfile(sb, data.user);
    router.push("/desk");
  }

  async function signOut() {
    const sb = getBrowserClient();
    await sb.auth.signOut();
    setUser(null);
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="mark">Field Desk</div>
        <nav>
          <Link href="/">Wall</Link>
          <Link href="/desk">Desk</Link>
        </nav>
      </header>
      <h1>{user ? "You are in." : "The door."}</h1>
      <p className="lede">
        Email and a password. Notes persist. Public ones show on the wall;
        private ones never leave your desk.
      </p>

      <div className="card" style={{ marginTop: 28, maxWidth: 420 }}>
        {user ? (
          <>
            <p>{user.email}</p>
            <button style={{ marginTop: 16 }} onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {err && <p className="err">{err}</p>}
            {msg && <p className="meta">{msg}</p>}
            <button type="submit">{mode === "signup" ? "Create desk" : "Open desk"}</button>
            <button
              type="button"
              className="ghost"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Have an account? Sign in" : "New here? Create one"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
