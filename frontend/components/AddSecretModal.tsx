"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AddSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEnv: string;
  onAdd: (key: string, value: string) => void;
}

export function AddSecretModal({ isOpen, onClose, activeEnv, onAdd }: AddSecretModalProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    onAdd(key, value);
    setKey("");
    setValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white">Add New Secret</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Environment</label>
            <input 
              type="text" 
              value={activeEnv} 
              disabled 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/50 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Key</label>
            <input 
              type="text" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. DATABASE_URL"
              className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg px-4 py-2 text-white transition-all outline-none font-mono"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Value</label>
            <textarea 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter secret value..."
              rows={3}
              className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg px-4 py-2 text-white transition-all outline-none font-mono resize-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!key.trim() || !value.trim()}
              className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Secret
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
