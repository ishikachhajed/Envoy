"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { Plus, Loader2, FolderPlus, Building2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { EnvironmentSwitcher } from "@/components/EnvironmentSwitcher";
import { SecretTable, type Secret } from "@/components/SecretTable";
import { AddSecretModal } from "@/components/AddSecretModal";
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
export default function DashboardPage() {
  const { user, activeOrg, userRole, isLoading: authLoading, createOrg } = useAuth();
  
  // Projects and Environments states
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnv, setActiveEnv] = useState<Environment | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  
  // Loaders
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  // 1. Fetch projects when organization changes
  useEffect(() => {
    if (activeOrg) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
      setEnvironments([]);
      setActiveEnv(null);
      setSecrets([]);
    }
  }, [activeOrg]);
  // 2. Fetch environments when active project changes
  useEffect(() => {
    if (activeProject) {
      fetchEnvironments(activeProject.id);
    } else {
      setEnvironments([]);
      setActiveEnv(null);
      setSecrets([]);
    }
  }, [activeProject]);
  // 3. Fetch secrets when active environment changes
  useEffect(() => {
    if (activeEnv) {
      fetchSecrets(activeEnv.id);
    } else {
      setSecrets([]);
    }
  }, [activeEnv]);
  // Network Fetchers
  const fetchProjects = async () => {
    if (!activeOrg) return;
    setIsDataLoading(true);
    try {
      const data = await apiFetch<Project[]>(`/api/organizations/${activeOrg.id}/projects`);
      setProjects(data);
      if (data.length > 0) {
        setActiveProject(data[0]); // Pick first project by default
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
        // Default to 'Development' environment if it exists, otherwise pick first
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
  const fetchSecrets = async (envId: string) => {
    setIsDataLoading(true);
    try {
      // Fetch secrets. Note that MEMBER roles get masked values ("••••••••••••")
      const data = await apiFetch<Secret[]>(`/api/environments/${envId}/secrets`);
      setSecrets(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load environment secrets.");
    } finally {
      setIsDataLoading(false);
    }
  };
  // Actions
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsActionLoading(true);
    try {
      await createOrg(newOrgName);
      setNewOrgName("");
    } catch (err) {
     
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newProjName.trim()) return;
    setIsActionLoading(true);
    try {
      const proj = await apiFetch<Project>(`/api/organizations/${activeOrg.id}/projects`, {
        method: "POST",
        body: JSON.stringify({
          name: newProjName,
          description: newProjDesc,
        }),
      });
      setProjects((prev) => [...prev, proj]);
      setActiveProject(proj);
      setNewProjName("");
      setNewProjDesc("");
      toast.success(`Project '${proj.name}' created! Environments auto-provisioned.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create project.");
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleAddSecret = async (key: string, value: string, reason?: string) => {
    if (!activeEnv) return;
    
    try {
      if (userRole === "ADMIN") {
        // Admins insert directly into active vault
        await apiFetch<Secret>(`/api/environments/${activeEnv.id}/secrets`, {
          method: "POST",
          body: JSON.stringify({ key, value }),
        });
        toast.success(`Secret '${key}' created successfully in ${activeEnv.name}!`);
        fetchSecrets(activeEnv.id);
      } else {
        // Members must submit a Change Request
        await apiFetch<any>(`/api/environments/${activeEnv.id}/change-requests`, {
          method: "POST",
          body: JSON.stringify({ key, value, reason }), // Included optional change reason!
        });
        toast.success(`Change request for secret '${key}' submitted to Admins!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Operation failed.");
    }
  };
  const handleDeleteSecret = async (id: string) => {
    if (!activeEnv) return;
    try {
      await apiFetch<void>(`/api/secrets/${id}`, {
        method: "DELETE",
      });
      toast.success("Secret deleted successfully!");
      fetchSecrets(activeEnv.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete secret.");
    }
  };
  // Switch Active Environment
  const handleEnvChange = (envName: "Development" | "Staging" | "Production") => {
    const env = environments.find((e) => e.name.toLowerCase() === envName.toLowerCase());
    if (env) {
      setActiveEnv(env);
    }
  };
  // Loading Screens
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Initializing secure connection...</p>
        </div>
      </div>
    );
  }
  // 1. Onboarding: Create Organization Workspace
  if (!activeOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass-panel p-8 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Create Organization</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your multi-tenant workspace to begin managing secrets.
              </p>
            </div>
            
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Enterprise"
                  className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-white transition-all outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isActionLoading || !newOrgName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Organization"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  // 2. Onboarding: Create Project
  if (!isDataLoading && projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass-panel p-8 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Create First Project</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Projects hold environment variables. Creating a project auto-provisions Development, Staging, and Production.
              </p>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Backend API Service"
                  className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-white transition-all outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description (Optional)</label>
                <textarea
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Describe your microservice variables scope..."
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-white transition-all outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isActionLoading || !newProjName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  // Active elements
  const currentEnvName = (activeEnv?.name || "Development") as "Development" | "Staging" | "Production";
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Environment Variables</h1>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-xs text-muted-foreground whitespace-nowrap">
              <span className={`w-2 h-2 rounded-full ${userRole === "ADMIN" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-blue-400"}`} />
              {userRole}
            </div>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your secure environment variables and secrets.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg font-medium transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        >
          <Plus className="w-5 h-5" />
          {userRole === "ADMIN" ? "Add Secret" : "Request Secret"}
        </button>
      </header>
      {/* Workspace Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-black/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/5 gap-3 w-full">
        <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <EnvironmentSwitcher activeEnv={currentEnvName} onEnvChange={handleEnvChange} />
        </div>
        
        {/* Project Selector dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-sm text-muted-foreground px-2 sm:px-4 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
          <span>Project:</span>
          <select 
            value={activeProject?.id || ""} 
            onChange={(e) => {
              const selected = projects.find((p) => p.id === e.target.value);
              if (selected) setActiveProject(selected);
            }}
            className="bg-black/60 border border-white/10 text-white rounded-lg px-3 py-1.5 font-medium outline-none focus:border-primary/50 transition-all cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <SecretTable
        secrets={secrets}
        isLoading={isDataLoading}
        onDelete={handleDeleteSecret}
        onEdit={(secret) => toast.info(`Direct editing not permitted. Delete and re-add secret.`)}
      />
      <AddSecretModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeEnv={currentEnvName}
        onAdd={handleAddSecret}
      />
    </div>
  );
}