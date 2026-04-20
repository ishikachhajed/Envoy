"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface Secret {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-12 bg-white/5 rounded-lg flex-1"></div>
        </div>
      ))}
    </div>
  );
}

export function SecretTable({
  secrets,
  isLoading,
  onDelete,
  onEdit,
}: {
  secrets: Secret[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit: (secret: Secret) => void;
}) {
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const toggleVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) return <SkeletonLoader />;

  if (secrets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-white/20 rounded-xl glass-panel">
        No secrets found for this environment.
      </div>
    );
  }

  return (
    <div className="w-full glass-panel overflow-hidden border border-white/10">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-black/40 text-muted-foreground sticky top-0">
          <tr>
            <th className="px-6 py-4 font-medium">Key</th>
            <th className="px-6 py-4 font-medium">Value</th>
            <th className="px-6 py-4 font-medium">Last Updated</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {secrets.map((secret) => {
            const isVisible = visibleSecrets[secret.id] || false;
            return (
              <tr key={secret.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 font-mono font-medium text-white">{secret.key}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono transition-all duration-200",
                        isVisible ? "text-white" : "text-muted-foreground tracking-widest blur-[2px] select-none"
                      )}
                    >
                      {isVisible ? secret.value : "••••••••••••••••"}
                    </span>
                    <button
                      onClick={() => toggleVisibility(secret.id)}
                      className="p-1.5 text-muted-foreground hover:text-white transition-colors rounded-md hover:bg-white/10 ml-2"
                      title={isVisible ? "Hide value" : "Reveal value"}
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{secret.updatedAt}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => copyToClipboard(secret.value)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                      title="Copy value"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(secret)}
                      className="p-2 text-muted-foreground hover:text-blue-400 transition-colors rounded-md hover:bg-blue-400/10"
                      title="Edit secret"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(secret.id)}
                      className="p-2 text-muted-foreground hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10"
                      title="Delete secret"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
