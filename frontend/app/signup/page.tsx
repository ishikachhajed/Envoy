"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

/**
 * SignupPage — What this file does:
 * ──────────────────────────────────
 * With our new passwordless OTP flow, there is NO separate "signup" page.
 * Login and signup are unified into a single flow on the login page:
 *   - If the email doesn't exist → account is auto-created after OTP verification
 *   - If the email exists → user is logged in after OTP verification
 *
 * This page simply redirects any user who navigates to /signup → /login
 * to keep the UX clean and avoid confusion.
 *
 * Why is this better?
 * Traditional signup forms create friction. Users have to:
 *   1. Think of a password
 *   2. Confirm the password
 *   3. Remember it later
 * With OTP-based auth, all of that disappears. Just enter your email.
 *
 * Industry Comparison:
 * Notion, Linear, Loom, and Vercel all use this unified "enter email" pattern
 * where new users are onboarded seamlessly without a separate signup step.
 */

export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect immediately to the unified login/OTP page
    router.replace("/login");
  }, [router]);
    
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Redirecting to secure login...
        </div>
      </div>
    </div>
  );
}
