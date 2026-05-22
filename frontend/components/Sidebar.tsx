"use client";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { FolderGit2, Users, Shield, Settings, LogOut, CheckSquare, ScrollText } from "lucide-react";
import { usePathname } from "next/navigation";
export function Sidebar() {
  const { organizations, activeOrg, selectOrg, logout, userRole, user } = useAuth();
  const pathname = usePathname();
  return (
    <aside className="w-64 border-r border-white/5 glass-panel flex flex-col h-screen fixed left-0 top-0 rounded-none border-t-0 border-l-0 border-b-0 bg-[#070707] z-30">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <Shield className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
        <div>
          <span className="font-bold text-xl tracking-tight text-white block">Envoy</span>
          {user && (
            <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">{user.email}</span>
          )}
        </div>
      </div>
      {/* Organization Switcher Dropdown (Multi-tenancy) */}
      {organizations.length > 0 && activeOrg && (
        <div className="p-4 border-b border-white/5 bg-black/10">
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">Active Workspace</label>
          <select
            value={activeOrg.id}
            onChange={(e) => selectOrg(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary/50 transition-all cursor-pointer"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Navigation Menu */}
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Main</div>
        
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === "/" 
              ? "bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-primary/20" 
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          Secrets Vault
        </Link>
        {/* Admin Gated Views */}
        {userRole === "ADMIN" && (
          <>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2 px-3">Management</div>
            <Link 
              href="/approvals" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/approvals" 
                  ? "bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Approvals Queue
            </Link>
            <Link 
              href="/audit-logs" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === "/audit-logs" 
                  ? "bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              }`}
            >
              <ScrollText className="w-4 h-4" />
              Compliance Logs
            </Link>
          </>
        )}
      </nav>
      {/* Logout Action */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/5 border border-transparent hover:border-red-500/10 transition-all font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}