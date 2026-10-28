"use client";

import { useEffect, useState } from "react";
import { MessageSquareHeart, Send, CheckCircle2, Sparkles, X } from "lucide-react";

interface CheckinModalProps {
  studentName?: string;
  onCompleted?: (result: { mood_score: number; tags: string[] }) => void;
}

export function CheckinModal({ studentName, onCompleted }: CheckinModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [successResult, setSuccessResult] = useState<{
    mood_score: number;
    tags: string[];
    message: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      try {
        const res = await fetch("/api/checkin/status");
        if (!res.ok) {
          setOpen(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "already_completed") {
          setOpen(false);
        } else if (data.status === "pending") {
          setQuestion(
            data.question ||
              `Hey ${studentName || "there"}, how are you holding up with your classes and energy today?`
          );
          setOpen(true);
        }
      } catch {
        console.warn("Could not fetch check-in status:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [studentName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkin/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: reply }),
      });

      if (!res.ok) throw new Error("Check-in submission failed.");

      const result = await res.json();
      setSuccessResult(result);
      if (onCompleted) {
        onCompleted(result);
      }

      setTimeout(() => {
        setOpen(false);
      }, 2200);
    } catch {
      alert("Failed to save check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg overflow-hidden bg-white/95 text-stone-900 border border-emerald-500/30 shadow-2xl rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-950 text-emerald-100 border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400">
              <MessageSquareHeart size={18} />
            </span>
            <div>
              <h2 id="checkin-title" className="text-sm font-semibold tracking-tight text-white">
                1-Minute AI Daily Check-in
              </h2>
              <span className="text-[11px] text-emerald-300/80 font-mono">
                ASIS Student Support Network
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="p-1 rounded-lg hover:bg-emerald-800/50 text-emerald-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-gradient-to-b from-stone-50/80 to-white">
          {successResult ? (
            <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <CheckCircle2 size={44} className="mx-auto text-emerald-600 animate-bounce" />
              <h3 className="text-lg font-semibold text-stone-900">
                Check-in Recorded!
              </h3>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                {successResult.message || "Your reflection has been safely logged."}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Mood Score: {successResult.mood_score}/5
                </span>
                {successResult.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-stone-100 text-stone-700 border border-stone-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  AI
                </div>
                <div className="relative max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 bg-emerald-50/90 border border-emerald-200/80 shadow-sm text-stone-800 text-sm leading-relaxed">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-emerald-800 font-semibold mb-1">
                    <Sparkles size={12} className="text-emerald-600" />
                    ASIS Assistant
                  </div>
                  <p className="font-medium text-stone-900">{question}</p>
                  <span className="block text-[10px] text-stone-500 text-right mt-1 font-mono">
                    Just now
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <label htmlFor="student-response" className="block text-xs font-medium text-stone-600">
                  Your reply (say as much or as little as you like):
                </label>
                <textarea
                  id="student-response"
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="e.g., I'm so tired of math and feeling a bit overwhelmed..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-stone-400 resize-none transition-shadow"
                  required
                  disabled={submitting}
                  autoFocus
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-600 font-mono">
                    Private to you &amp; your support team
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !reply.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow transition-colors"
                  >
                    {submitting ? (
                      "Analyzing..."
                    ) : (
                      <>
                        <span>Send check-in</span>
                        <Send size={13} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
