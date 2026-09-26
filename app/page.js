"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "../lib/supabase";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [pulse, setPulse] = useState(null);
  const [now, setNow] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleString(undefined, {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const sb = getBrowserClient();
    sb.auth.getUser().then(({ data }) => setUser(data.user || null));
    sb.from("fielddesk_notes")
      .select("id, body, created_at, fielddesk_profiles(handle, display_name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => setNotes(data || []));
    sb.from("fielddesk_hours")
      .select("*")
      .order("hour_stamp", { ascending: false })
      .limit(1)
      .then(({ data }) => setPulse(data?.[0] || null));
  }, []);

  return (
    <div className="wrap">
      <header className="top">
        <div className="mark">Field Desk</div>
        <nav>
          <Link href="/">Wall</Link>
          <Link href="/desk">Desk</Link>
          <Link href="/login">{user ? "Account" : "Sign in"}</Link>
        </nav>
      </header>

      <h1>Leave a scrap on the wall,<br />or keep it in the drawer.</h1>
      <p className="lede">
        Public notes sit here for anyone passing through. Private ones stay
        only on your desk. Every hour the room gets a new pulse.
      </p>
      <div className="clock">
        <span className="dot" />
        {now}
      </div>

      <div className="grid two">
        <section className="card">
          <h2>The wall</h2>
          {notes.length === 0 && <p className="meta">Quiet for now.</p>}
          {notes.map((n, i) => (
            <article className="note" key={n.id} style={{ animationDelay: `${i * 40}ms` }}>
              <p>{n.body}</p>
              <div className="meta">
                {(n.fielddesk_profiles?.display_name || n.fielddesk_profiles?.handle || "anon")}
                {" · "}
                {new Date(n.created_at).toLocaleString()}
              </div>
            </article>
          ))}
        </section>

        <aside className="card" style={{ animationDelay: "80ms" }}>
          <h2>This hour</h2>
          {pulse ? (
            <>
              <p style={{ fontSize: "1.25rem", marginBottom: 8 }}>{pulse.title}</p>
              <p>{pulse.body}</p>
              <div className="meta">{new Date(pulse.hour_stamp).toLocaleString()}</div>
            </>
          ) : (
            <p>Waiting on the first pulse.</p>
          )}
          <p className="meta" style={{ marginTop: 22 }}>
            Signed-in writers keep a private drawer and can pin anything public.
          </p>
        </aside>
      </div>

      <footer>Paper, ink, one copper thread. Not a feed.</footer>
    </div>
  );
}
