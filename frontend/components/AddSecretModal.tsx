"use client";
import { useState } from "react";
import { X, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
interface AddSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEnv: string;
  onAdd: (key: string, value: string, reason?: string) => void;
}
export function AddSecretModal({ isOpen, onClose, activeEnv, onAdd }: AddSecretModalProps) {
  const { userRole } = useAuth();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    
    // Pass key, value, and optional reason context
    onAdd(key, value, reason);
    setKey("");
    setValue("");
    setReason("");
    onClose();
  };
  const isMember = userRole !== "ADMIN";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md p-6 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200 bg-[#0c0c0c]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {isMember ? "Request Secret Change" : "Add New Secret"}
            </h2>
            {isMember && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Your request will be submitted to the Admin approval queue.
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Environment</label>
            <input 
              type="text" 
              value={activeEnv} 
              disabled 
              className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-white/40 cursor-not-allowed text-sm font-semibold"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Secret Key</label>
            <input 
              type="text" 
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. STRIPE_SECRET_KEY"
              className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-white transition-all outline-none font-mono text-sm"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Secret Value</label>
            <textarea 
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter sensitive value..."
              rows={3}
              className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-white transition-all outline-none font-mono text-sm resize-none"
            />
          </div>
          {/* Change request description / reason field */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Reason for Change
              </label>
              {isMember && <span className="text-[10px] text-primary/70 italic">(Optional)</span>}
            </div>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Rotating keys for security audit"
              rows={2}
              className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm resize-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-white hover:bg-white/5 border border-white/5 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!key.trim() || !value.trim()}
              className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMember ? "Submit Request" : "Save Secret"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}