"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  KeyRound,
  ArrowRight,
  GraduationCap,
  Users,
  MessageCircle,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

interface LoginFormProps {
  initialRedirect?: string;
}

export function LoginForm({ initialRedirect }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const presets = [
    {
      role: "Student",
      email: "aarav@student.edu",
      password: "password123",
      label: "Aarav Shah (Student)",
      desc: "Daily Check-in & Self-Tracking",
      icon: GraduationCap,
    },
    {
      role: "Teacher",
      email: "anika@school.edu",
      password: "password123",
      label: "Anika Rao (Teacher)",
      desc: "Class Roster & Behavioral Logs",
      icon: Users,
    },
    {
      role: "Mentor",
      email: "riya@school.edu",
      password: "password123",
      label: "Riya Sen (Mentor)",
      desc: "Holistic Overview & Wellbeing",
      icon: MessageCircle,
    },
  ];

  async function handleLogin(e?: React.FormEvent, directEmail?: string, directPassword?: string) {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const submitEmail = (directEmail ?? email).trim().toLowerCase();
    const submitPassword = directPassword ?? password;

    if (!submitEmail || !submitPassword) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submitEmail, password: submitPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      setSuccess(`Authenticated as ${data.user.name}. Redirecting...`);
      const target = initialRedirect || data.redirect || (data.user.role === "student" ? "/student" : "/workspace");

      setTimeout(() => {
        router.push(target);
        router.refresh();
      }, 400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(p: typeof presets[0]) {
    setEmail(p.email);
    setPassword(p.password);
    setError(null);
    handleLogin(undefined, p.email, p.password);
  }

  return (
    <div className="space-y-6">
      {/* Interactive Form */}
      <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in"
          >
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#121a16]" htmlFor="login-email">
            Institutional Email
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526258] pointer-events-none"
            />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aarav@student.edu"
              required
              disabled={loading}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[#bdc8c1] bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#08872b] transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#121a16]" htmlFor="login-password">
            Password
          </label>
          <div className="relative">
            <KeyRound
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526258] pointer-events-none"
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-[#bdc8c1] bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#08872b] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#526258] hover:text-[#121a16] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#08872b] hover:bg-[#076e23] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <span>Verifying credentials...</span>
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Fill Presets */}
      <div className="pt-2 border-t border-[#bdc8c1]/60">
        <span className="block text-xs font-mono uppercase tracking-wider text-[#526258] mb-2.5">
          Or Quick Sign-in with Seed Persona:
        </span>
        <div className="space-y-2">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => applyPreset(p)}
                disabled={loading}
                className="w-full p-2.5 text-left border border-[#bdc8c1] hover:border-[#08872b] bg-white/60 hover:bg-[#cce7d3]/40 rounded-lg flex items-center justify-between gap-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-md bg-[#d6e7da] text-[#08872b] group-hover:bg-[#08872b] group-hover:text-white transition-colors">
                    <Icon size={16} />
                  </span>
                  <div>
                    <strong className="block text-xs font-semibold text-[#121a16]">
                      {p.label}
                    </strong>
                    <span className="block text-[11px] text-[#526258]">{p.desc}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#08872b] opacity-80 group-hover:opacity-100 flex items-center gap-1">
                  1-Click <ArrowRight size={12} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
