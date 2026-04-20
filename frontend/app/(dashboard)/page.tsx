  "use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { EnvironmentSwitcher } from "@/components/EnvironmentSwitcher";
import { SecretTable, type Secret } from "@/components/SecretTable";
import { AddSecretModal } from "@/components/AddSecretModal";

// Mock Data
const MOCK_SECRETS: Record<string, Secret[]> = {
  Development: [
    { id: "1", key: "DATABASE_URL", value: "postgresql://dev:dev@localhost:5432/envoy_dev", updatedAt: "2 mins ago" },
    { id: "2", key: "JWT_SECRET", value: "dev_secret_key_9921", updatedAt: "1 hr ago" },
  ],
  Staging: [
    { id: "3", key: "DATABASE_URL", value: "postgresql://staging:p@ssword@staging-db.aws.com/envoy_staging", updatedAt: "1 day ago" },
  ],
  Production: [
    { id: "4", key: "DATABASE_URL", value: "postgresql://prod:supersecure@prod-db.aws.com/envoy_prod", updatedAt: "1 week ago" },
    { id: "5", key: "STRIPE_API_KEY", value: "sk_live_51Hxxxxx", updatedAt: "1 month ago" },
  ]
};

export default function DashboardPage() {
  const [activeEnv, setActiveEnv] = useState<"Development" | "Staging" | "Production">("Development");
  const [secrets, setSecrets] = useState<Record<string, Secret[]>>(MOCK_SECRETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Simulated Loading State
  const [isLoading, setIsLoading] = useState(false);

  const handleEnvChange = (env: "Development" | "Staging" | "Production") => {
    setIsLoading(true);
    setActiveEnv(env);
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const handleAddSecret = (key: string, value: string) => {
    const newSecret: Secret = {
      id: Math.random().toString(36).substring(7),
      key,
      value,
      updatedAt: "Just now",
    };
    
    setSecrets(prev => ({
      ...prev,
      [activeEnv]: [newSecret, ...(prev[activeEnv] || [])]
    }));
    toast.success(`Secret ${key} created successfully in ${activeEnv}!`);
  };

  const handleDeleteSecret = (id: string) => {
    setSecrets(prev => ({
      ...prev,
      [activeEnv]: prev[activeEnv].filter(s => s.id !== id)
    }));
    toast.success("Secret deleted successfully!");
  };

  const currentSecrets = secrets[activeEnv] || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Environment Variables</h1>
          <p className="text-muted-foreground">Manage your secure environment variables and secrets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        >
          <Plus className="w-5 h-5" />
          Add Secret
        </button>
      </header>

      <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl backdrop-blur-sm border border-white/5">
        <EnvironmentSwitcher activeEnv={activeEnv} onEnvChange={handleEnvChange} />
        
        {/* Mock Project selector */}
        <div className="text-sm text-muted-foreground px-4">
          Project: <span className="text-white font-medium">Envoy Core</span>
        </div>
      </div>

      <SecretTable 
        secrets={currentSecrets} 
        isLoading={isLoading} 
        onDelete={handleDeleteSecret}
        onEdit={(secret) => toast.info(`Edit mode for ${secret.key} not implemented in MVP.`)}
      />

      <AddSecretModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeEnv={activeEnv}
        onAdd={handleAddSecret}
      />
    </div>
  );
}
