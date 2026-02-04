import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

/* ---------------- TYPES ---------------- */

interface AuthContextType {
  user: User | null;
  session: Session | null;

  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;

  // 🔥 GLOBAL ACCOUNT DRAWER
  isAccountDrawerOpen: boolean;
  setIsAccountDrawerOpen: (open: boolean) => void;
}

/* ---------------- CONTEXT ---------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // 🔥 GLOBAL ACCOUNT DRAWER STATE
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  /* ---------------- ADMIN ROLE CHECK ---------------- */

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Admin role check failed:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch (err) {
      console.error("Admin role error:", err);
      setIsAdmin(false);
    }
  }, []);

  /* ---------------- SESSION HANDLING ---------------- */

  useEffect(() => {
    // 🔁 Auth Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const user = session?.user || null;
      setUser(user);

      if (user) {
        // Avoid blocking UI thread
        setTimeout(() => checkAdminRole(user.id), 0);
      } else {
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    // 🔍 Initial Session Fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const user = session?.user || null;
      setUser(user);

      if (user) {
        checkAdminRole(user.id);
      } else {
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  /* ---------------- AUTH ACTIONS ---------------- */

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        setIsAuthModalOpen(false);
        return { success: true };
      } catch {
        return { success: false, error: "An unexpected error occurred" };
      }
    },
    []
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        setIsAuthModalOpen(false);
        return { success: true };
      } catch {
        return { success: false, error: "An unexpected error occurred" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
    setIsAdmin(false);

    setIsAccountDrawerOpen(false);
  }, []);

  /* ---------------- PROVIDER ---------------- */

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isAdmin,
        isLoading,

        login,
        signup,
        logout,

        isAuthModalOpen,
        setIsAuthModalOpen,

        authMode,
        setAuthMode,

        isAccountDrawerOpen,
        setIsAccountDrawerOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
