"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Loader2, CheckCircle2, XCircle } from "lucide-react";
function InviteHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshOrgs, isLoading } = useAuth();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  useEffect(() => {
    if (isLoading) {
    return;
  }
    
    if (token === null && typeof window !== 'undefined' && window.location.search.includes('token=')) {
      return;
    }
    if (!token) {
      setStatus("error");
      setErrorMessage("No invitation token provided.");
      return;
    }
    // If not logged in, redirect to login with the return URL
    if (!user) {
      let redirectUrl = `/login?returnUrl=/invite?token=${token}`;
      if (email) {
        redirectUrl += `&email=${encodeURIComponent(email)}`;
      }
      router.push(redirectUrl);
      return;
    }
    
    acceptInvitation(token);
  }, [user, token, router]);
  const acceptInvitation = async (inviteToken: string) => {
    try {
      await apiFetch(`/api/organizations/invitations/accept?token=${inviteToken}`, {
        method: "POST"
      });
      
      await refreshOrgs();
      
      setStatus("success");
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to accept invitation. It may have expired.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel border border-white/10 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0"></div>
        
        <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] mb-6 mx-auto">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Envoy Vault</h1>
        {status === "loading" && (
          <div className="py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground text-sm font-medium">Accepting invitation...</p>
          </div>
        )}
        {status === "success" && (
          <div className="py-8">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-white font-medium mb-1">Invitation Accepted!</p>
            <p className="text-muted-foreground text-sm">Redirecting to your new workspace...</p>
          </div>
        )}
        {status === "error" && (
          <div className="py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Invitation Failed</p>
            <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{errorMessage}</p>
            <button 
              onClick={() => router.push("/")}
              className="mt-6 bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all w-full"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <InviteHandler />
    </Suspense>
  );
}