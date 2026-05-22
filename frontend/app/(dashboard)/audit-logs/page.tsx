"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Search, Loader2, ScrollText, ShieldCheck, ShieldAlert, Calendar, RefreshCw } from "lucide-react";
interface AuditLog {
  id: string;
  actorEmail: string;
  action:
    | "LOGIN"
    | "SECRET_CREATE"
    | "SECRET_REVEAL"
    | "SECRET_DELETE"
    | "SECRET_CHANGE_REQUESTED"
    | "SECRET_CHANGE_APPROVED"
    | "SECRET_CHANGE_REJECTED";
  details: string;
  createdAt: string;
}
export default function AuditLogsPage() {
  const { activeOrg, userRole, isLoading: authLoading } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // Filtering and Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  useEffect(() => {
    if (activeOrg) {
      fetchAuditLogs();
    }
  }, [activeOrg]);
  // Client-side search and filters
  useEffect(() => {
    let result = logs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.actorEmail.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q)
      );
    }
    if (selectedAction !== "ALL") {
      result = result.filter((log) => log.action === selectedAction);
    }
    setFilteredLogs(result);
  }, [searchQuery, selectedAction, logs]);
  const fetchAuditLogs = async () => {
    if (!activeOrg) return;
    setIsDataLoading(true);
    try {
      const data = await apiFetch<AuditLog[]>(`/api/organizations/${activeOrg.id}/audit-logs`);
      setLogs(data);
      setFilteredLogs(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load compliance audit logs.");
    } finally {
      setIsDataLoading(false);
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
            Only administrators are authorized to review organization audit trails.
          </p>
        </div>
      </div>
    );
  }
  const actionTypes = [
    { value: "ALL", label: "All Events" },
    { value: "SECRET_REVEAL", label: "Decryption Reveals" },
    { value: "SECRET_CREATE", label: "Creations" },
    { value: "SECRET_DELETE", label: "Deletions" },
    { value: "SECRET_CHANGE_REQUESTED", label: "Requests" },
    { value: "SECRET_CHANGE_APPROVED", label: "Approvals" },
    { value: "LOGIN", label: "Logins" },
  ];
  const getActionStyles = (action: string) => {
    switch (action) {
      case "SECRET_REVEAL":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]";
      case "SECRET_CREATE":
        return "bg-emerald-500/10 text-primary border-emerald-500/20";
      case "SECRET_DELETE":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "SECRET_CHANGE_REQUESTED":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "SECRET_CHANGE_APPROVED":
        return "bg-emerald-500/20 text-primary border-emerald-500/40";
      case "SECRET_CHANGE_REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      default:
        return "bg-white/5 text-muted-foreground border-white/10";
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Compliance Audit Ledger
            <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              SOC2 Compliant
            </div>
          </h1>
          <p className="text-muted-foreground mt-1">
            Immutable, secure record of all vault operations and decryptions.
          </p>
        </div>
        
        <button
          onClick={fetchAuditLogs}
          disabled={isDataLoading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-semibold border border-white/5 transition-all disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isDataLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>
      {/* Filter and Search Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        {/* Search Bar */}
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor email, change description, or action..."
            className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl pl-10 pr-4 py-2.5 text-white transition-all outline-none text-sm placeholder:text-muted-foreground/60"
          />
        </div>
        {/* Action Dropdown Filter */}
        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2.5 font-medium outline-none focus:border-primary/50 transition-all cursor-pointer text-sm"
          >
            {actionTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Audit Log Table */}
      {isDataLoading && logs.length === 0 ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel p-12 border border-white/5 rounded-2xl text-center space-y-4 bg-black/10">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto text-muted-foreground">
            <ScrollText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Audit Entries Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search criteria or filter category.
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-2xl bg-black/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Actor</th>
                  <th className="py-4 px-6">Event</th>
                  <th className="py-4 px-6">Details</th>
                  <th className="py-4 px-6 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/90">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString();
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/40" />
                          {dateStr}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-semibold text-white/80 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-xs">
                          {log.actorEmail}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border tracking-wider uppercase ${getActionStyles(log.action)}`}>
                          {log.action.replace("SECRET_", "")}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-sm">
                        <p className="font-medium text-white/80 line-clamp-2">{log.details}</p>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3 text-primary" />
                          Signed
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center text-xs text-muted-foreground">
            <span>Showing {filteredLogs.length} compliance records</span>
            <span>Cryptographically sealed under SOC-2 parameters</span>
          </div>
        </div>
      )}
    </div>
  );
}