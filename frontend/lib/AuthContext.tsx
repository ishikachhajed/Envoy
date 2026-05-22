"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch, ApiError } from "./api";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}
export interface Member {
  membershipId: string;
  userName: string;
  userEmail: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
}
interface AuthContextType {
  user: User | null;
  token: string | null;
  organizations: Organization[];
  activeOrg: Organization | null;
  userRole: "ADMIN" | "MEMBER" | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
  createOrg: (name: string) => Promise<Organization>;
  selectOrg: (orgId: string) => Promise<void>;
  refreshOrgs: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();
  // 1. Recover auth state on mount
  useEffect(() => {
    async function recoverSession() {
      try {
        const storedToken = localStorage.getItem("envoy_token");
        const storedUser = localStorage.getItem("envoy_user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          
          // Load organizations and roles
          await loadUserEnvironment(storedToken, parsedUser);
        } else {
          setIsLoading(false);
          // Only redirect to login if we are in a protected page (dashboard)
          if (!pathname.startsWith("/login") && !pathname.startsWith("/signup")) {
            router.replace("/login");
          }
        }
      } catch (err) {
        console.error("Session recovery failed:", err);
        clearAuthData();
        setIsLoading(false);
        router.replace("/login");
      }
    }
    recoverSession();
  }, []);
  // Helpers to clear data
  const clearAuthData = () => {
    localStorage.removeItem("envoy_token");
    localStorage.removeItem("envoy_user");
    localStorage.removeItem("envoy_active_org_id");
    setUser(null);
    setToken(null);
    setOrganizations([]);
    setActiveOrg(null);
    setUserRole(null);
  };
  // Helper to load orgs and compute roles
  const loadUserEnvironment = async (authToken: string, currentUser: User) => {
    try {
      const orgs = await apiFetch<Organization[]>("/api/organizations/mine");
      setOrganizations(orgs);
      if (orgs.length > 0) {
        // Recover active organization ID or pick first
        const savedOrgId = localStorage.getItem("envoy_active_org_id");
        let active = orgs.find((o) => o.id === savedOrgId) || orgs[0];
        setActiveOrg(active);
        localStorage.setItem("envoy_active_org_id", active.id);
        // Fetch role inside active organization
        await fetchAndComputeRole(active.id, currentUser.email);
      } else {
        // User has no organizations yet (needs onboarding)
        setActiveOrg(null);
        setUserRole(null);
        
        // Redirect to onboarding (we will handle onboarding on dashboard root)
        if (!pathname.startsWith("/login") && !pathname.startsWith("/signup")) {
          router.replace("/");
        }
      }
    } catch (err) {
      console.error("Failed to load user environment:", err);
    } finally {
      setIsLoading(false);
    }
  };
  // Helper to fetch members and set userRole
  const fetchAndComputeRole = async (orgId: string, email: string) => {
    try {
      const members = await apiFetch<Member[]>(`/api/organizations/${orgId}/members`);
      const me = members.find((m) => m.userEmail.toLowerCase() === email.toLowerCase());
      if (me) {
        setUserRole(me.role);
      } else {
        setUserRole("MEMBER"); // Fallback
      }
    } catch (err) {
      console.error("Failed to compute membership role:", err);
      setUserRole("MEMBER");
    }
  };
  // 2. Login Flow
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("envoy_token", response.token);
      localStorage.setItem("envoy_user", JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      toast.success("Welcome back to Envoy Vault!");
      await loadUserEnvironment(response.token, response.user);
      router.push("/");
    } catch (error: any) {
      setIsLoading(false);
      const apiErr = error as ApiError;
      toast.error(apiErr.message || "Authentication failed. Check your credentials.");
      throw error;
    }
  };
  // 3. Signup Flow
  const signup = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    try {
      const signupPassword = password || "password123";
      
      const response = await apiFetch<{ token: string; user: User }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password: signupPassword }),
      });
      localStorage.setItem("envoy_token", response.token);
      localStorage.setItem("envoy_user", JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      toast.success("Account created successfully!");
      await loadUserEnvironment(response.token, response.user);
      router.push("/");
    } catch (error: any) {
      setIsLoading(false);
      const apiErr = error as ApiError;
      toast.error(apiErr.message || "Signup failed. Account may already exist.");
      throw error;
    }
  };
  // 4. Logout Flow
  const logout = () => {
    clearAuthData();
    toast.info("Logged out successfully.");
    router.replace("/login");
  };
  // 5. Create Organization
  const createOrg = async (name: string): Promise<Organization> => {
    try {
      const org = await apiFetch<Organization>("/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const updatedOrgs = [...organizations, org];
      setOrganizations(updatedOrgs);
      setActiveOrg(org);
      localStorage.setItem("envoy_active_org_id", org.id);
      
      if (user) {
        await fetchAndComputeRole(org.id, user.email);
      }
      toast.success(`Organization '${name}' created!`);
      return org;
    } catch (error: any) {
      const apiErr = error as ApiError;
      toast.error(apiErr.message || "Failed to create organization.");
      throw error;
    }
  };
  // 6. Select Organization Workspace
  const selectOrg = async (orgId: string) => {
    const selected = organizations.find((o) => o.id === orgId);
    if (selected) {
      setIsLoading(true);
      setActiveOrg(selected);
      localStorage.setItem("envoy_active_org_id", orgId);
      if (user) {
        await fetchAndComputeRole(orgId, user.email);
      }
      setIsLoading(false);
      toast.success(`Switched workspace to '${selected.name}'`);
    }
  };
  const refreshOrgs = async () => {
    if (token && user) {
      await loadUserEnvironment(token, user);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        organizations,
        activeOrg,
        userRole,
        isLoading,
        login,
        signup,
        logout,
        createOrg,
        selectOrg,
        refreshOrgs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}