"use client";
import { useState, useEffect } from "react";
import { useAuth, Member, Organization } from "@/lib/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Mail, Shield, User, Trash2, ChevronDown, Check, Loader2, UserPlus, Clock, Users } from "lucide-react";
interface Invitation {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  expiresAt: string;
  createdAt: string;
}
export function TeamManagement() {
  const { activeOrg, userRole, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [isInviting, setIsInviting] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  // Load Data
  useEffect(() => {
    if (activeOrg) {
      loadTeamData();
    }
  }, [activeOrg]);
  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        apiFetch<Member[]>(`/api/organizations/${activeOrg!.id}/members`),
        apiFetch<Invitation[]>(`/api/organizations/${activeOrg!.id}/invitations`).catch(() => [])
      ]);
      setMembers(membersData);
      setInvitations(invitesData);
    } catch (err) {
      toast.error("Failed to load team data.");
    } finally {
      setIsLoading(false);
    }
  };
  // Actions
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeOrg) return;
    
    setIsInviting(true);
    try {
      await apiFetch(`/api/organizations/${activeOrg.id}/members`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteOpen(false);
      setInviteEmail("");
      loadTeamData();
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user.");
    } finally {
      setIsInviting(false);
    }
  };
  const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    if (!activeOrg) return;
    
    try {
      // Optimistic update
      setMembers(members.map(m => m.membershipId === memberId ? { ...m, role: newRole } : m));
      
      await apiFetch(`/api/organizations/${activeOrg.id}/members/${memberId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success("Role updated successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role.");
      loadTeamData(); // Revert on failure
    }
  };
  const handleRemoveMember = async () => {
    if (!activeOrg || !memberToRemove) return;
    
    setIsRemoving(true);
    try {
      await apiFetch(`/api/organizations/${activeOrg.id}/members/${memberToRemove.membershipId}`, {
        method: "DELETE",
      });
      toast.success("Member removed successfully.");
      setMemberToRemove(null);
      loadTeamData();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member.");
    } finally {
      setIsRemoving(false);
    }
  };
  const isAdmin = userRole === "ADMIN";
  if (isLoading) {
    return (
      <div className="glass-panel p-6 border border-white/5 rounded-xl space-y-4 animate-pulse">
        <div className="h-6 w-1/4 bg-white/5 rounded"></div>
        <div className="space-y-2">
          <div className="h-12 w-full bg-white/5 rounded-lg"></div>
          <div className="h-12 w-full bg-white/5 rounded-lg"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Pending Invitations Section (Only visible to Admin if there are invites) */}
      {isAdmin && invitations.length > 0 && (
        <div className="glass-panel border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Pending Invitations
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {invitations.map(inv => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {inv.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">Invited as {inv.role}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground px-3 py-1 bg-white/5 rounded-md border border-white/10 self-start sm:self-auto w-fit">
                  Pending
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Active Members Section */}
      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden shadow-lg relative">
        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Active Members
          </h2>
          {isAdmin && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Member
            </button>
          )}
        </div>
        <div className="divide-y divide-white/5">
          {members.map(member => (
            <div key={member.membershipId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full flex-shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
                  {member.userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white flex items-center gap-2 truncate">
                    {member.userName}
                    {member.userEmail === user?.email && (
                      <span className="text-[10px] bg-primary/20 flex-shrink-0 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">You</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 mt-2 sm:mt-0">
                {/* Role Selector (Disabled if not admin, or if it's the user themselves) */}
                <div className="relative group">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.membershipId, e.target.value as "ADMIN" | "MEMBER")}
                    disabled={!isAdmin || member.userEmail === user?.email}
                    className="appearance-none bg-black/40 border border-white/10 text-white rounded-lg pl-8 pr-8 py-1.5 text-xs font-medium outline-none focus:border-primary/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    {member.role === "ADMIN" ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
                {/* Remove Button */}
                {isAdmin && member.userEmail !== user?.email && (
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {(isAdmin && member.userEmail === user?.email) && <div className="w-7 h-7" />}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-2">Invite to {activeOrg?.name}</h3>
            <p className="text-sm text-muted-foreground mb-6">Send an email invitation to join this workspace.</p>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${inviteRole === "MEMBER" ? "bg-primary/10 border-primary/50" : "bg-black/40 border-white/10 hover:border-white/20"}`}>
                    <input type="radio" name="role" className="hidden" checked={inviteRole === "MEMBER"} onChange={() => setInviteRole("MEMBER")} />
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${inviteRole === "MEMBER" ? "text-primary" : "text-white"}`}>Member</span>
                      {inviteRole === "MEMBER" && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">Can view and manage secrets in environments.</span>
                  </label>
                  
                  <label className={`flex-1 flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${inviteRole === "ADMIN" ? "bg-primary/10 border-primary/50" : "bg-black/40 border-white/10 hover:border-white/20"}`}>
                    <input type="radio" name="role" className="hidden" checked={inviteRole === "ADMIN"} onChange={() => setInviteRole("ADMIN")} />
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${inviteRole === "ADMIN" ? "text-primary" : "text-white"}`}>Admin</span>
                      {inviteRole === "ADMIN" && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">Can manage team members, roles, and settings.</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                  {isInviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Remove Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="glass-panel border border-red-500/20 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-2">Remove Member?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to remove <strong className="text-white">{memberToRemove.userEmail}</strong>? They will immediately lose access to all secrets in this workspace.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={isRemoving}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50"
              >
                {isRemoving ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing...</> : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}