"use client";
import { useState } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrgModal({ isOpen, onClose }: CreateOrgModalProps) {
  const { createOrg, refreshOrgs } = useAuth();
  
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !projName.trim()) return;
    
    setIsActionLoading(true);
    try {
      // 1. Create Organization
      const org = await createOrg(orgName);
      
      // 2. Create Initial Project for this Organization
      await apiFetch(`/api/organizations/${org.id}/projects`, {
        method: "POST",
        body: JSON.stringify({
          name: projName,
          description: projDesc,
        }),
      });
      
      toast.success(`Organization '${orgName}' and project '${projName}' created successfully!`);
      
      // Reset form
      setOrgName("");
      setOrgDesc("");
      setProjName("");
      setProjDesc("");
      
      onClose();
      
      // Refresh context state if needed (createOrg already handles some of this)
      await refreshOrgs();
      
    } catch (err: any) {
      console.error(err);
      // Toast error is handled inside createOrg if it fails there
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg p-6 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200 bg-[#0c0c0c] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Create Organization
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set up a new workspace for your team.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Organization Details</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Organization Name</label>
              <input 
                type="text" 
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                Description
                <span className="text-[10px] text-primary/70 italic normal-case">(Optional)</span>
              </label>
              <textarea 
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="Brief description of your organization"
                rows={2}
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Initial Project</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Project Name</label>
              <input 
                type="text" 
                required
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                placeholder="e.g. Backend API"
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                Description
                <span className="text-[10px] text-primary/70 italic normal-case">(Optional)</span>
              </label>
              <textarea 
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="Describe your project"
                rows={2}
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm resize-none"
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl font-medium text-white hover:bg-white/5 border border-white/5 transition-all text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!orgName.trim() || !projName.trim() || isActionLoading}
              className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground flex items-center justify-center min-w-[120px] hover:bg-primary/90 transition-all text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
