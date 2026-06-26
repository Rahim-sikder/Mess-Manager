import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface ProfileUpdate {
  fullName?:    string;
  phoneNumber?: string;
  avatarUrl?:   string;
}

interface AuthContextValue {
  user:          User | null;
  loading:       boolean;
  signIn:        (email: string, password: string) => Promise<void>;
  signUp:        (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut:       () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  refreshUser:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(
    email: string,
    password: string
  ): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user && data.user.identities?.length === 0) {
      throw new Error("An account with this email already exists.");
    }
    return { needsConfirmation: !data.session };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async function updateProfile(data: ProfileUpdate): Promise<void> {
    const meta: Record<string, unknown> = {};
    if (data.fullName    !== undefined) meta.full_name    = data.fullName;
    if (data.phoneNumber !== undefined) meta.phone_number = data.phoneNumber;
    if (data.avatarUrl   !== undefined) meta.avatar_url   = data.avatarUrl;
    const { data: updated, error } = await supabase.auth.updateUser({ data: meta });
    if (error) throw error;
    if (updated.user) setUser(updated.user);
  }

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
