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
  // ── OTP Auth (primary flow) ──
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  // ── Legacy password auth (kept for compat) ──
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
  createOrg: (name: string) => Promise<Organization>;
  selectOrg: (orgId: string) => Promise<void>;
  refreshOrgs: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider — What this file does:
 * ──────────────────────────────────────
 * This is the global authentication state manager for the entire frontend application.
 * It wraps the whole app (in layout.tsx) and provides every component with:
 *   - The current logged-in user and their JWT token
 *   - The user's organizations and active workspace
 *   - The user's role (ADMIN or MEMBER) in the active workspace
 *   - Functions to request OTPs, verify OTPs, and log out
 *
 * Why is it needed?
 * Without this, every page and component would need to independently read from
 * localStorage, manage token state, and handle redirects. This context centralizes
 * ALL of that into one place — the "single source of truth" for auth state.
 *
 * What happens if this file is missing?
 * Every page would break — nothing would know if the user is logged in.
 *
 * Industry Comparison:
 * This is equivalent to Supabase's `useSession()` hook, Auth0's `useAuth0()` hook,
 * or Next-Auth's `SessionProvider`. The pattern is universal in modern React apps.
 */


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
          
          await loadUserEnvironment(storedToken, parsedUser);
        } else {
          setIsLoading(false);
          // Only redirect to login if we are in a protected page (dashboard)
          const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/verify");
          if (!isAuthPage) {
            router.replace("/login");
          }
        }
      } catch (err) {
        clearAuthData();
        setIsLoading(false);
        router.replace("/login");
      }
    }
    recoverSession();
  }, []);

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

  const loadUserEnvironment = async (authToken: string, currentUser: User) => {
    try {
      const orgs = await apiFetch<Organization[]>("/api/organizations/mine");
      setOrganizations(orgs);
      if (orgs.length > 0) {
      
        const savedOrgId = localStorage.getItem("envoy_active_org_id");
        const active = orgs.find((o) => o.id === savedOrgId) || orgs[0];
        setActiveOrg(active);
        localStorage.setItem("envoy_active_org_id", active.id);
        await fetchAndComputeRole(active.id, currentUser.email);
      } else {
        // User has no organizations yet (needs onboarding)
        setActiveOrg(null);
        setUserRole(null);
        
        // Redirect to onboarding (we will handle onboarding on dashboard root)
        const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/verify");
        if (!isAuthPage) {
          router.replace("/");
        }
      }
    } catch (err) {
      console.error("Failed to load user environment:", err);
    } finally {
      setIsLoading(false);
    }
  };
 
  const fetchAndComputeRole = async (orgId: string, email: string) => {
    try {
      const members = await apiFetch<Member[]>(`/api/organizations/${orgId}/members`);
      const me = members.find((m) => m.userEmail.toLowerCase() === email.toLowerCase());
      setUserRole(me ? me.role : "MEMBER");
    } catch {
      setUserRole("MEMBER");
    }
  };
// ── OTP Auth Flow (Primary) ───────────────────────────────────────────────
  /**
   * requestOtp — Step 1 of the passwordless flow.
   *
   * What it does:
   * Sends the user's email to the backend. The backend generates a 6-digit code,
   * hashes it, saves it to the DB, and emails it to the user.
   *
   * What happens after?
   * The Login page transitions from "Enter email" to "Enter OTP" step.
   *
   * @param email The email address to send the OTP to
   */
  const requestOtp = async (email: string): Promise<void> => {
    const response = await apiFetch<{ message: string }>("/api/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    // Success is handled by the calling component (shows toast, moves to OTP step)
  };
  /**
   * verifyOtp — Step 2 of the passwordless flow.
   *
   * What it does:
   * Sends the email + 6-digit OTP to the backend for verification.
   * If valid, the backend auto-creates the user (if new) and returns a JWT token.
   * This context then saves the token, loads the user's organizations, and redirects
   * to the dashboard.
   *
   * @param email The user's email
   * @param otp   The 6-digit code from their inbox
   */
  const verifyOtp = async (email: string, otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{ token: string; user: User }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      localStorage.setItem("envoy_token", response.token);
      localStorage.setItem("envoy_user", JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      toast.success("Welcome to Envoy Vault! 🎉");
      await loadUserEnvironment(response.token, response.user);
      router.push("/");
    } catch (error: any) {
      setIsLoading(false);
      const apiErr = error as ApiError;
      toast.error(apiErr.message || "Verification failed. Please check your code.");
      throw error;
    }
  };
 

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
      toast.error(apiErr.message || "Signup failed.");
      throw error;
    }
  };
  
  const logout = () => {
    clearAuthData();
    toast.info("Logged out successfully.");
    router.replace("/login");
  };
  
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
      
      if (user) await fetchAndComputeRole(org.id, user.email);
      
      toast.success(`Organization '${name}' created!`);
      return org;
    } catch (error: any) {
      const apiErr = error as ApiError;
      toast.error(apiErr.message || "Failed to create organization.");
      throw error;
    }
  };

  const selectOrg = async (orgId: string) => {
    const selected = organizations.find((o) => o.id === orgId);
    if (selected) {
      setIsLoading(true);
      setActiveOrg(selected);
      localStorage.setItem("envoy_active_org_id", orgId);
      if (user) await fetchAndComputeRole(orgId, user.email);
      setIsLoading(false);
      toast.success(`Switched workspace to '${selected.name}'`);
    }
  };
  const refreshOrgs = async () => {
    if (token && user) await loadUserEnvironment(token, user);
  };
  return (
    <AuthContext.Provider
      value={{
        user, token, organizations, activeOrg, userRole, isLoading,
        requestOtp, verifyOtp,
        login, signup,
        logout, createOrg, selectOrg, refreshOrgs,
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
