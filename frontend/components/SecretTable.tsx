"use client";
import { useState } from "react";
import { Eye, EyeOff, Copy, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch } from "@/lib/api";
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
  const { userRole } = useAuth();
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [isRevealing, setIsRevealing] = useState<Record<string, boolean>>({});
  const toggleVisibility = async (secretId: string, secretKey: string) => {
    // 1. If currently visible, simply hide it
    if (visibleSecrets[secretId]) {
      setVisibleSecrets((prev) => ({ ...prev, [secretId]: false }));
      return;
    }
    // 2. If already decrypted in cache, just make it visible
    if (decryptedValues[secretId]) {
      setVisibleSecrets((prev) => ({ ...prev, [secretId]: true }));
      return;
    }
    // 3. If role is MEMBER, block decryption attempt
    if (userRole !== "ADMIN") {
      toast.error("Access Denied: Only Admins can reveal decrypted values.", {
        icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      });
      return;
    }
    // 4. Request decrypted value from the backend
    setIsRevealing((prev) => ({ ...prev, [secretId]: true }));
    try {
      const response = await apiFetch<{ value: string }>(`/api/secrets/${secretId}/reveal`);
      setDecryptedValues((prev) => ({ ...prev, [secretId]: response.value }));
      setVisibleSecrets((prev) => ({ ...prev, [secretId]: true }));
      toast.success(`Secret '${secretKey}' decrypted and revealed (logged to SOC2 audit trail).`);
    } catch (err: any) {
      toast.error(err.message || "Could not reveal secret. Please try again.");
    } finally {
      setIsRevealing((prev) => ({ ...prev, [secretId]: false }));
    }
  };
  const copyToClipboard = async (secretId: string, secretKey: string, maskedValue: string) => {
    let textToCopy = maskedValue;
    // Try to get decrypted value from cache first
    if (decryptedValues[secretId]) {
      textToCopy = decryptedValues[secretId];
    } else if (userRole === "ADMIN") {
      // If Admin hasn't revealed it yet, reveal on the fly for copying
      try {
        const response = await apiFetch<{ value: string }>(`/api/secrets/${secretId}/reveal`);
        textToCopy = response.value;
        setDecryptedValues((prev) => ({ ...prev, [secretId]: response.value }));
      } catch (err) {
        console.error("Failed to decrypt for copy:", err);
      }
    }
    if (textToCopy === "••••••••••••") {
      toast.error("Cannot copy masked secret value. Access denied.");
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    toast.success(`Copied secret value for '${secretKey}'!`);
  };
  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };
  if (isLoading) return <SkeletonLoader />;
  if (secrets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl glass-panel">
        No active secrets found for this environment.
      </div>
    );
  }
  return (
    <div className="w-full glass-panel overflow-hidden border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
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
            const loading = isRevealing[secret.id] || false;
            const displayValue = isVisible 
              ? (decryptedValues[secret.id] || secret.value)  
              : "••••••••••••";
            return (
              <tr key={secret.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-6 py-4 font-mono font-medium text-white">{secret.key}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono transition-all duration-200",
                        isVisible ? "text-emerald-400 font-semibold" : "text-muted-foreground tracking-widest blur-[1px] select-none text-[11px]"
                      )}
                    >
                      {displayValue}
                    </span>
                    <button
                      onClick={() => toggleVisibility(secret.id, secret.key)}
                      disabled={loading}
                      className="p-1.5 text-muted-foreground hover:text-white transition-colors rounded-md hover:bg-white/10 ml-2 disabled:opacity-50"
                      title={isVisible ? "Hide value" : "Reveal value"}
                    >
                      {loading ? (
                        <span className="w-4 h-4 block border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : isVisible ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-xs">{formatDate(secret.updatedAt)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => copyToClipboard(secret.id, secret.key, secret.value)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                      title="Copy decrypted value"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => onDelete(secret.id)}
                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10"
                        title="Delete secret"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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