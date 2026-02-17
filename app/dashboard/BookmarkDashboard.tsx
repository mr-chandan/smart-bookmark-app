"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
}

interface BookmarkDashboardProps {
  user: User;
  initialBookmarks: Bookmark[];
}


const CHANNEL_NAME = "bookmarks-sync";

function broadcastInsert(bookmark: Bookmark) {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "INSERT", bookmark });
    bc.close();
  } catch {
    //fallback
  }
}

function broadcastDelete(bookmarkId: string) {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "DELETE", bookmarkId });
    bc.close();
  } catch {
    //fallback
  }
}

function getFaviconUrl(url: string): string | null {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}


export default function BookmarkDashboard({
  user,
  initialBookmarks,
}: BookmarkDashboardProps) {

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rtStatus, setRtStatus] = useState<string>("CONNECTING");


  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;


  const filteredBookmarks = useMemo(() => {
    if (!search.trim()) return bookmarks;
    const q = search.toLowerCase();
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
    );
  }, [bookmarks, search]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);


  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const bm = payload.new as Bookmark;
            setBookmarks((prev) =>
              prev.some((b) => b.id === bm.id) ? prev : [bm, ...prev]
            );
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
          }
        }
      )
      .subscribe((s) => setRtStatus(s));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);


  useEffect(() => {
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (event) => {
        const { type, bookmark, bookmarkId } = event.data;
        if (type === "INSERT" && bookmark) {
          setBookmarks((prev) =>
            prev.some((b) => b.id === bookmark.id) ? prev : [bookmark, ...prev]
          );
        } else if (type === "DELETE" && bookmarkId) {
          setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        }
      };
    } catch {

    }
    return () => {
      try { bc?.close(); } catch { }
    };
  }, []);


  const addBookmark = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const t = title.trim();
      const u = url.trim();
      if (!t || !u) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from("bookmarks")
          .insert({ title: t, url: normalizeUrl(u), user_id: user.id })
          .select()
          .single();

        if (dbError) throw dbError;
        if (!data) throw new Error("No data returned");

        setBookmarks((prev) =>
          prev.some((b) => b.id === data.id) ? prev : [data, ...prev]
        );
        broadcastInsert(data);
        setTitle("");
        setUrl("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add bookmark");
      } finally {
        setLoading(false);
      }
    },
    [title, url, supabase, user.id]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      setDeleting(id);
      setError(null);

      try {
        const { error: dbError } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", id);

        if (dbError) throw dbError;

        setBookmarks((prev) => prev.filter((b) => b.id !== id));
        broadcastDelete(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete bookmark");
      } finally {
        setDeleting(null);
      }
    },
    [supabase]
  );


  const BookmarkIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const LinkIcon = () => (
    <svg className="w-5 h-5 text-[#F7931A]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );

  const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const Spinner = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const statusColor = rtStatus === "SUBSCRIBED" ? "bg-[#F7931A]" : "bg-red-500";


  return (
    <div className="min-h-screen bg-[#030304] text-white relative">

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#F7931A] opacity-[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#EA580C] opacity-[0.03] rounded-full blur-[120px]" />
      </div>


      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl bg-red-500/90 text-white text-sm font-mono backdrop-blur-lg border border-red-400/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-[slideDown_0.3s_ease-out]">
          {error}
        </div>
      )}


      <header className="border-b border-white/10 bg-[#0F1115]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#FFD600] opacity-30 blur-sm" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_25px_-5px_rgba(247,147,26,0.6)]">
                <BookmarkIcon />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-tight bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">
                Smart Bookmarks
              </span>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#94A3B8]/50">
                Real-time · Secure
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border-2 border-[#F7931A]/40"
                />
              )}
              <span className="text-sm text-[#94A3B8] hidden sm:inline font-mono tracking-wide">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm rounded-full font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-[#F7931A]/50 hover:shadow-[0_0_15px_-5px_rgba(247,147,26,0.3)] transition-all duration-300 cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>


      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">


        <section className="mb-12 p-8 rounded-2xl bg-[#0F1115] border border-white/10 shadow-[0_0_50px_-20px_rgba(247,147,26,0.08)]">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#EA580C]/20 border border-[#EA580C]/40 flex items-center justify-center text-[#F7931A]">
              <PlusIcon />
            </span>
            Add a{" "}
            <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">
              Bookmark
            </span>
          </h2>

          <form onSubmit={addBookmark} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Bookmark title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="flex-1 h-12 px-4 bg-black/50 border-b-2 border-white/20 text-white text-sm placeholder:text-white/30 font-body focus-visible:outline-none focus-visible:border-[#F7931A] focus-visible:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200"
            />
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-1 h-12 px-4 bg-black/50 border-b-2 border-white/20 text-white text-sm placeholder:text-white/30 font-mono focus-visible:outline-none focus-visible:border-[#F7931A] focus-visible:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-bold uppercase tracking-wider shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.6)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Adding…
                </span>
              ) : (
                "Add Bookmark"
              )}
            </button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-white whitespace-nowrap">
              Your{" "}
              <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">
                Bookmarks
              </span>
            </h2>
            <span className="text-xs font-mono tracking-widest uppercase text-[#94A3B8] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 flex-shrink-0">
              <span className="relative flex h-2 w-2" title={`Realtime: ${rtStatus}`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`} />
              </span>
              {search.trim()
                ? `${filteredBookmarks.length} / ${bookmarks.length}`
                : bookmarks.length}{" "}
              bookmark{bookmarks.length !== 1 ? "s" : ""}
            </span>
          </div>


          {bookmarks.length > 0 && (
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]/50">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search bookmarks by title or URL…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus-visible:outline-none focus-visible:border-[#F7931A]/50 focus-visible:shadow-[0_0_20px_-8px_rgba(247,147,26,0.25)] transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]/40 hover:text-white transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}


          {bookmarks.length === 0 && (
            <div className="text-center py-24 rounded-2xl border border-dashed border-white/10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/30 flex items-center justify-center">
                <BookmarkIcon className="w-10 h-10 text-[#F7931A]/40" />
              </div>
              <p className="font-heading text-xl text-white/60 mb-2">No bookmarks yet</p>
              <p className="text-sm text-[#94A3B8]/50 font-mono tracking-wide">
                Add your first bookmark above to get started
              </p>
            </div>
          )}

          {bookmarks.length > 0 && filteredBookmarks.length === 0 && search.trim() && (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
              <p className="font-heading text-lg text-white/40 mb-1">No matches found</p>
              <p className="text-sm text-[#94A3B8]/40 font-mono">Try a different search term</p>
            </div>
          )}


          {filteredBookmarks.length > 0 && (
            <div className="grid gap-3">
              {filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="group relative flex items-center gap-4 p-5 rounded-2xl bg-[#0F1115] border border-white/10 hover:border-[#F7931A]/50 hover:-translate-y-0.5 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.15)] transition-all duration-300 overflow-hidden"
                >

                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/30 flex items-center justify-center overflow-hidden group-hover:shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-all duration-300">
                    {getFaviconUrl(bookmark.url) ? (
                      <img
                        src={getFaviconUrl(bookmark.url)!}
                        alt=""
                        className="w-5 h-5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <LinkIcon />
                    )}
                  </div>


                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-heading font-semibold text-white truncate group-hover:text-[#F7931A] transition-colors duration-200">
                      {bookmark.title}
                    </h3>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-[#F7931A]/70 hover:text-[#F7931A] truncate block overflow-hidden text-ellipsis whitespace-nowrap transition-colors"
                    >
                      {bookmark.url}
                    </a>
                  </div>


                  <span className="text-xs font-mono tracking-wider text-[#94A3B8]/40 hidden md:block whitespace-nowrap uppercase">
                    {formatDate(bookmark.created_at)}
                  </span>

                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    disabled={deleting === bookmark.id}
                    className="flex-shrink-0 p-2.5 rounded-lg text-[#94A3B8]/40 hover:text-[#EA580C] hover:bg-[#EA580C]/10 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer disabled:opacity-50"
                    title="Delete bookmark"
                    aria-label={`Delete ${bookmark.title}`}
                  >
                    {deleting === bookmark.id ? <Spinner className="h-5 w-5" /> : <TrashIcon />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
