"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "../../lib/supabase";

export default function Desk() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [notes, setNotes] = useState([]);
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [err, setErr] = useState("");

  async function load(sb, uid) {
    const { data } = await sb
      .from("fielddesk_notes")
      .select("*")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  }

  useEffect(() => {
    const sb = getBrowserClient();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setUser(null);
        router.replace("/login");
        return;
      }
      setUser(data.user);
      const handle =
        (data.user.email?.split("@")[0] || "guest") + "-" + data.user.id.slice(0, 4);
      await sb.from("fielddesk_profiles").upsert({
        id: data.user.id,
        handle,
        display_name: data.user.email?.split("@")[0] || "guest",
      });
      load(sb, data.user.id);
    });
  }, [router]);

  async function save(e) {
    e.preventDefault();
    setErr("");
    const sb = getBrowserClient();
    const { error } = await sb.from("fielddesk_notes").insert({
      author_id: user.id,
      body: body.trim(),
      is_public: isPublic,
    });
    if (error) return setErr(error.message);
    setBody("");
    setIsPublic(false);
    load(sb, user.id);
  }

  async function toggle(n) {
    const sb = getBrowserClient();
    await sb.from("fielddesk_notes").update({ is_public: !n.is_public }).eq("id", n.id);
    load(sb, user.id);
  }

  async function remove(n) {
    const sb = getBrowserClient();
    await sb.from("fielddesk_notes").delete().eq("id", n.id);
    load(sb, user.id);
  }

  if (user === undefined || user === null) return null;

  return (
    <div className="wrap">
      <header className="top">
        <div className="mark">Field Desk</div>
        <nav>
          <Link href="/">Wall</Link>
          <Link href="/login">Account</Link>
        </nav>
      </header>
      <h1>Your drawer.</h1>
      <p className="lede">Write it down. Public notes walk to the wall immediately.</p>

      <div className="grid two">
        <form className="card" onSubmit={save}>
          <h2>New slip</h2>
          <textarea
            required
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Something you noticed, or just want kept."
          />
          <label className="check">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Mark public — show on the wall
          </label>
          {err && <p className="err">{err}</p>}
          <button type="submit">Keep this</button>
        </form>

        <section className="card">
          <h2>Kept</h2>
          {notes.length === 0 && <p className="meta">Empty drawer.</p>}
          {notes.map((n) => (
            <article className="note" key={n.id}>
              <p>{n.body}</p>
              <div className="meta">
                {n.is_public ? "public" : "private"} · {new Date(n.created_at).toLocaleString()}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" className="ghost" onClick={() => toggle(n)}>
                  {n.is_public ? "Make private" : "Make public"}
                </button>
                <button type="button" className="ghost" onClick={() => remove(n)}>
                  Burn
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
