"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Check, X, Loader2, ClipboardList, Clock, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}
interface Environment {
  id: string;
  name: string;
}
interface ChangeRequest {
  id: string;
  secretKey: string;
  maskedValue: string;
  requesterEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  resolverEmail: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reason: string | null;
}
export default function ApprovalsPage() {
  const { activeOrg, userRole, isLoading: authLoading } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnv, setActiveEnv] = useState<Environment | null>(null);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  // 1. Fetch projects on load or active organization switch
  useEffect(() => {
    if (activeOrg) {
      fetchProjects();
    }
  }, [activeOrg]);
  // 2. Fetch environments when active project changes
  useEffect(() => {
    if (activeProject) {
      fetchEnvironments(activeProject.id);
    } else {
      setEnvironments([]);
      setActiveEnv(null);
      setRequests([]);
    }
  }, [activeProject]);
  // 3. Fetch requests when environment changes
  useEffect(() => {
    if (activeEnv) {
      fetchRequests(activeEnv.id);
    } else {
      setRequests([]);
    }
  }, [activeEnv]);
  const fetchProjects = async () => {
    if (!activeOrg) return;
    setIsDataLoading(true);
    try {
      const data = await apiFetch<Project[]>(`/api/organizations/${activeOrg.id}/projects`);
      setProjects(data);
      if (data.length > 0) {
        setActiveProject(data[0]);
      } else {
        setActiveProject(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load projects.");
    } finally {
      setIsDataLoading(false);
    }
  };
  const fetchEnvironments = async (projectId: string) => {
    setIsDataLoading(true);
    try {
      const data = await apiFetch<Environment[]>(`/api/projects/${projectId}/environments`);
      setEnvironments(data);
      if (data.length > 0) {
        // Prefer Development by default, otherwise pick first
        const devEnv = data.find((e) => e.name.toLowerCase() === "development");
        setActiveEnv(devEnv || data[0]);
      } else {
        setActiveEnv(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load environments.");
    } finally {
      setIsDataLoading(false);
    }
  };
  const fetchRequests = async (envId: string) => {
    setIsDataLoading(true);
    try {
      const data = await apiFetch<ChangeRequest[]>(`/api/environments/${envId}/change-requests`);
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load change requests.");
    } finally {
      setIsDataLoading(false);
    }
  };
  const handleResolve = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActioningId(requestId);
    try {
      await apiFetch<ChangeRequest>(`/api/change-requests/${requestId}/resolve?action=${action}`, {
        method: "POST",
      });
      
      toast.success(`Request ${action === "APPROVE" ? "approved" : "rejected"} successfully!`);
      
      // Reload current list
      if (activeEnv) {
        await fetchRequests(activeEnv.id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Failed to resolve request.`);
    } finally {
      setActioningId(null);
    }
  };
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  // Security barrier in client-side routing
  if (userRole !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass-panel max-w-md p-8 border border-red-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            Only administrators are authorized to access the approvals queue.
          </p>
        </div>
      </div>
    );
  }
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Change Approvals Queue
            {pendingCount > 0 && (
              <span className="bg-emerald-500/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">Review, approve, and audit production secret change requests.</p>
        </div>
      </header>
      {/* Scope Switcher Panel */}
      <div className="flex flex-wrap items-center gap-4 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Project:</span>
          <select
            value={activeProject?.id || ""}
            onChange={(e) => {
              const selected = projects.find((p) => p.id === e.target.value);
              if (selected) setActiveProject(selected);
            }}
            className="bg-black/60 border border-white/10 text-white rounded-lg px-3 py-1.5 font-medium outline-none focus:border-primary/50 transition-all cursor-pointer text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Environment:</span>
          <select
            value={activeEnv?.id || ""}
            onChange={(e) => {
              const selected = environments.find((env) => env.id === e.target.value);
              if (selected) setActiveEnv(selected);
            }}
            className="bg-black/60 border border-white/10 text-white rounded-lg px-3 py-1.5 font-medium outline-none focus:border-primary/50 transition-all cursor-pointer text-sm"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>
        </div>
      </div>
      {/* List of requests */}
      {isDataLoading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-panel p-12 border border-white/5 rounded-2xl text-center space-y-4 bg-black/10">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto text-muted-foreground">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Queue is Empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No change requests registered for this scope environment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((req) => {
            const isPending = req.status === "PENDING";
            const dateStr = new Date(req.createdAt).toLocaleString();
            
            return (
              <div 
                key={req.id} 
                className={`glass-panel border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden bg-[#0a0a0a] ${
                  isPending 
                    ? "border-white/10 shadow-[0_4px_30px_rgba(255,255,255,0.02)]" 
                    : req.status === "APPROVED" 
                      ? "border-emerald-500/10 bg-emerald-950/5 shadow-[0_4px_30px_rgba(16,185,129,0.01)]" 
                      : "border-red-500/10 bg-red-950/5"
                }`}
              >
                {/* Visual side highlights */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  isPending 
                    ? "bg-amber-500/40" 
                    : req.status === "APPROVED" 
                      ? "bg-emerald-500/40" 
                      : "bg-red-500/40"
                }`} />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg text-white tracking-tight">{req.secretKey}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${
                        isPending 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                          : req.status === "APPROVED" 
                            ? "bg-emerald-500/10 text-primary border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>Submitted {dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>By:</span>
                        <span className="text-white font-medium">{req.requesterEmail}</span>
                      </div>
                      {!isPending && req.resolverEmail && (
                        <div className="flex items-center gap-2 md:col-span-2 text-primary">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            Resolved by <span className="font-semibold">{req.resolverEmail}</span>
                            {req.resolvedAt && ` on ${new Date(req.resolvedAt).toLocaleString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Change Reason block */}
                    <div className="mt-3 bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white/80">
                      <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Reason for Change
                      </span>
                      <p className="italic font-light">
                        {req.reason || "No explicit context description provided."}
                      </p>
                    </div>
                  </div>
                  {/* Pending actions */}
                  {isPending && (
                    <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                      <button
                        onClick={() => handleResolve(req.id, "REJECT")}
                        disabled={actioningId !== null}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-semibold text-sm disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleResolve(req.id, "APPROVE")}
                        disabled={actioningId !== null}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      >
                        {actioningId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}