"use client";
import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Mail, ArrowRight, RotateCcw, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * LoginPage — What this file does:
 * ──────────────────────────────────
 * This is the unified authentication page for Envoy Vault.
 * It implements a two-step passwordless login flow:
 *
 * Step 1 — Email Entry:
 *   User types their email address and clicks "Send Verification Code".
 *   The frontend calls POST /api/auth/request-otp.
 *   The backend generates a 6-digit OTP, hashes it, and emails it to the user.
 *
 * Step 2 — OTP Verification:
 *   User sees 6 individual digit input boxes (like Supabase, Linear, Vercel).
 *   They type or paste their code.
 *   A 5-minute countdown timer is shown.
 *   A "Resend Code" button appears after the timer expires.
 *   The frontend calls POST /api/auth/verify-otp.
 *   On success, the JWT is stored in localStorage and user is redirected to dashboard.
 *
 * Why a two-step flow?
 * This is the modern "Magic Link" / "Passwordless" pattern.
 * Users don't need to remember passwords. The email inbox itself proves identity.
 * Used by: Linear, Notion, Supabase, Vercel, Loom, and many others.
 *
 * Why 6 individual boxes instead of a single text input?
 * - Enterprise-grade UX (matches Stripe, GitHub 2FA, Apple ID)
 * - Auto-advance between boxes feels native and fast
 * - Paste support means users can paste all 6 digits at once
 * - Makes the auth moment feel intentional and secure
 */


export default function LoginPage() {
  const { requestOtp, verifyOtp, isLoading } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  
  // ── OTP State ──
  // 6 individual digit boxes
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // ── Loading & Error States ──
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ── Countdown Timer ──
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  // Start countdown when we enter OTP step
  useEffect(() => {
    if (step !== "otp") return;
    setSecondsLeft(300);
    setCanResend(false);
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  // ── Step 1: Request OTP ────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email.trim()) return;

  setError(null);
  setIsSending(true);

  try {
    await requestOtp(email.trim());

    setStep("otp");
    setOtpDigits(["", "", "", "", "", ""]);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

  } catch (err: any) {
    setError(
      err.message ||
      "Failed to send verification code. Please try again."
    );

  } finally {
    setIsSending(false);
  }
};
  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) return;
    setError(null);
    setIsVerifying(true);
    try {
      await verifyOtp(email, otp);
      // AuthContext handles redirect after success
    } catch (err: any) {
      setError(err.message || "Invalid or expired code. Please try again.");
      // Clear OTP boxes on error so user can re-type
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsVerifying(false);
    }
  };
  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (step === "otp" && otpDigits.every((d) => d !== "") && !isVerifying) {
      handleVerifyOtp();
    }
  }, [otpDigits]);
  // ── OTP Box Input Handlers ────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // take only last character
    setOtpDigits(newDigits);
    setError(null);
    // Auto-advance to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current box and move back
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Arrow keys for navigation
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };
  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setOtpDigits(newDigits);
    // Focus last filled box
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };
  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    setError(null);
    setIsSending(true);
    setOtpDigits(["", "", "", "", "", ""]);
    try {
      await requestOtp(email);
      setStep("otp"); // re-triggers the useEffect countdown
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsSending(false);
    }
  };
  const otpFilled = otpDigits.every((d) => d !== "");
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden px-4">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <Shield className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {step === "email" ? "Sign in to Envoy" : "Check your inbox"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === "email"
              ? "Enter your email to receive a secure verification code"
              : <>We sent a 6-digit code to <span className="text-white font-medium">{email}</span></>
            }
          </p>
        </div>
        {/* Card */}
        <div className="glass-panel p-8 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {/* ── STEP 1: Email Form ─────────────────────────────────────── */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              
              <div>
  <label className="block text-sm font-medium text-muted-foreground mb-2">
    Email Address
  </label>

  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
      <Mail className="w-4.5 h-4.5" />
    </div>

    <input
      type="email"
      required
      autoFocus
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        setError(null);
      }}
      placeholder="name@company.com"
      id="email-input"
      className="w-full bg-black/40 border border-white/10 focus:border-primary/60 focus:ring-1 focus:ring-primary/40 rounded-xl pl-10 pr-4 py-3.5 text-white transition-all outline-none placeholder:text-white/20 text-sm"
    />
  </div>
</div>

{error && (
  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
    {error}
  </div>
)}

<button
  type="submit"
  disabled={isSending || !email.trim()}
  id="send-otp-btn"
  className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.45)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
>
  {isSending ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Sending Code...
    </>
  ) : (
    <>
      <span>Send Verification Code</span>
      <ArrowRight className="w-4 h-4" />
    </>
  )}
</button>

<div className="text-center text-sm text-muted-foreground pt-1">
  Don't have an account?{" "}
  <span className="text-primary font-medium">
    Just enter your email — we'll create one automatically.
  </span>
</div>
              </form>
          )}
          {/* ── STEP 2: OTP Entry ──────────────────────────────────────── */}
          {step === "otp" && (
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => { setStep("email"); setError(null); setOtpDigits(["","","","","",""]); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Use different email
              </button>
              {/* 6-digit OTP boxes */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-4 text-center">
                  Enter your 6-digit code
                </label>
                <div className="flex justify-center gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      id={`otp-digit-${index}`}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all outline-none font-mono
                        ${digit
                          ? "bg-primary/10 border-primary/60 text-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                          : "bg-black/40 border-white/10 text-white focus:border-primary/50 focus:bg-primary/5"
                        }
                        ${isVerifying ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                      disabled={isVerifying}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                
              </div>
            {/* Inline error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
                  {error}
                </div>
              )}
            {/* Verify button — also shown for manual submit */}
              <button
                onClick={handleVerifyOtp}
                disabled={!otpFilled || isVerifying || isLoading}
                id="verify-otp-btn"
                className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.45)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isVerifying || isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : otpFilled ? (
                  <><CheckCircle2 className="w-4 h-4" /> Verify & Sign In</>
                ) : (
                  "Enter all 6 digits to continue"
                )}
              </button>
              {/* Timer and Resend */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {!canResend ? (
                  <span className="text-muted-foreground">
                    Code expires in{" "}
                    <span className={`font-mono font-semibold ${secondsLeft < 60 ? "text-red-400" : "text-primary"}`}>
                      {formatTime(secondsLeft)}
                    </span>
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isSending}
                    className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSending ? "animate-spin" : ""}`} />
                    {isSending ? "Sending..." : "Resend Code"}
                  </button>
                )}
              </div>
              {/* Security note */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  🔒 Envoy Vault will never ask for this code via phone or chat.
                  <br />If you didn't request this, ignore the email safely.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
