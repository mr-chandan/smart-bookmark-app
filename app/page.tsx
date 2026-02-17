import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#030304]">
      {/* ── Ambient Glow Blobs ──────────────────────── */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#F7931A] opacity-[0.06] rounded-full blur-[150px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#EA580C] opacity-[0.05] rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-[#FFD600] opacity-[0.04] rounded-full blur-[120px]" />

      {/* ── Grid Pattern Overlay ────────────────────── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      {/* ── Content ─────────────────────────────────── */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Spinning Orb */}
        <div className="mb-12 flex items-center justify-center">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            {/* Outer orbital ring */}
            <div className="absolute inset-0 rounded-full border border-[#F7931A]/30 animate-orbit" />
            {/* Inner orbital ring */}
            <div className="absolute inset-3 rounded-full border border-[#FFD600]/20 animate-orbit-reverse" />
            {/* Core orb */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] shadow-[0_0_60px_-10px_rgba(247,147,26,0.6)] flex items-center justify-center animate-float">
              <svg
                className="w-10 h-10 md:w-12 md:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-6 rounded-full border-2 border-[#F7931A]/40 animate-ping" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Smart{" "}
          <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">
            Bookmarks
          </span>
        </h1>

        <p className="font-body text-base md:text-lg text-[#94A3B8] mb-10 leading-relaxed max-w-xl mx-auto">
          Save, organize, and access your favorite links from anywhere.
          <br />
          <span className="text-[#94A3B8]/60">
            Real-time sync across all your devices — secured by design.
          </span>
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {[
            { icon: "🔒", label: "Private & Secure" },
            { icon: "⚡", label: "Real-time Sync" },
            { icon: "🌐", label: "Access Anywhere" },
          ].map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-mono tracking-wider text-[#94A3B8] backdrop-blur-sm uppercase"
            >
              <span>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <form action="/auth/login" method="POST">
          <button
            type="submit"
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-bold text-lg uppercase tracking-wider shadow-[0_0_30px_-5px_rgba(247,147,26,0.5)] hover:shadow-[0_0_40px_-5px_rgba(247,147,26,0.7)] hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="white"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="rgba(255,255,255,0.8)"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="rgba(255,255,255,0.6)"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="rgba(255,255,255,0.9)"
              />
            </svg>
            Sign in with Google
            <svg
              className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </form>

        <p className="mt-6 text-xs font-mono tracking-widest uppercase text-[#94A3B8]/40">
          No passwords — just your Google account
        </p>
      </div>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="absolute bottom-6 text-center text-xs font-mono tracking-wider text-[#94A3B8]/30 uppercase">
        Built with Next.js · Supabase · Tailwind
      </footer>
    </div>
  );
}
