import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@tower-guard/api-client";
import { type AppRole, isAppRole } from "@tower-guard/data";
import { safeStorage } from "./safeStorage";

// Re-export AppRole so consumers can keep importing it from @tower-guard/hooks
export type { AppRole };

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  app_role: AppRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  "admin@towerguard.ng": {
    password: "TowerAdmin2025!",
    user: {
      id: "a0000000-0000-0000-0000-000000000001",
      email: "admin@towerguard.ng",
      full_name: "John Adebayo",
      role: "National Admin",
      app_role: "telecom_admin",
    },
  },
  "operator@towerguard.ng": {
    password: "Operator2025!",
    user: {
      id: "a0000000-0000-0000-0000-000000000002",
      email: "operator@towerguard.ng",
      full_name: "Amina Bello",
      role: "Zone Operator",
      app_role: "telecom_admin",
    },
  },
  // NSCDC Station Dashboard — login is a station entity, NOT an individual.
  "nscdc.station@towerguard.ng": {
    password: "NSCDCStation2025!",
    user: {
      id: "a0000000-0000-0000-0000-000000000003",
      email: "nscdc.station@towerguard.ng",
      full_name: "AMAC NSCDC Station",
      role: "NSCDC Station",
      app_role: "nscdc_command",
    },
  },
  // Field App — individual field officer
  "nscdc.responder@towerguard.ng": {
    password: "NSCDCField2025!",
    user: {
      id: "a0000000-0000-0000-0000-000000000004",
      email: "nscdc.responder@towerguard.ng",
      full_name: "Sgt. Chinedu Okafor",
      role: "Field Officer",
      app_role: "nscdc_responder",
    },
  },
  // NCC Monitoring Dashboard
  "ncc.monitoring@towerguard.ng": {
    password: "NCCMonitoring2025!",
    user: {
      id: "a0000000-0000-0000-0000-000000000005",
      email: "ncc.monitoring@towerguard.ng",
      full_name: "NCC Monitoring Office",
      role: "NCC Monitoring",
      app_role: "ncc_regulator",
    },
  },
};

// AppRole + isAppRole come from @tower-guard/data — no local copy.

const normalizeUser = (value: unknown): User | null => {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<User>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.full_name !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email,
    full_name: candidate.full_name,
    role: typeof candidate.role === "string" ? candidate.role : "Operator",
    app_role: isAppRole(candidate.app_role) ? candidate.app_role : "telecom_admin",
  };
};

const clearStoredAuth = () => {
  safeStorage.removeItem(AUTH_TOKEN_KEY);
  safeStorage.removeItem(AUTH_USER_KEY);
};

const persistAuth = (token: string, nextUser: User) => {
  safeStorage.setItem(AUTH_TOKEN_KEY, token);
  safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = safeStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = safeStorage.getItem(AUTH_USER_KEY);

    if (token && savedUser) {
      try {
        const parsedUser = normalizeUser(JSON.parse(savedUser));
        if (parsedUser) {
          setUser(parsedUser);
        } else {
          clearStoredAuth();
        }
      } catch {
        clearStoredAuth();
      }
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      const normalizedUser = normalizeUser({ ...res.user, app_role: res.user.app_role || "telecom_admin" });

      if (!normalizedUser) {
        throw new Error("Invalid user profile received");
      }

      persistAuth(res.access_token, normalizedUser);
      setUser(normalizedUser);
      return;
    } catch {
      // Backend unavailable — use demo credentials
    }

    const demo = DEMO_USERS[email.toLowerCase()];
    if (!demo || demo.password !== password) {
      throw new Error("Invalid email or password");
    }

    const fakeToken = btoa(JSON.stringify({ email, role: demo.user.role, exp: Date.now() + 86400000 }));
    persistAuth(fakeToken, demo.user);
    setUser(demo.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const res = await api.register(email, password, fullName);
      const normalizedUser = normalizeUser({ ...res.user, app_role: res.user.app_role || "telecom_admin" });

      if (!normalizedUser) {
        throw new Error("Invalid user profile received");
      }

      persistAuth(res.access_token, normalizedUser);
      setUser(normalizedUser);
      return;
    } catch {
      // fallback
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email,
      full_name: fullName,
      role: "Operator",
      app_role: "telecom_admin",
    };
    const fakeToken = btoa(JSON.stringify({ email, role: "Operator", exp: Date.now() + 86400000 }));
    persistAuth(fakeToken, newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
