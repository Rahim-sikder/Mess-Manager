import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Member } from "../types/api";
import { fetchMyMember, linkMyMember } from "../lib/api";
import { useAuth } from "./AuthContext";

interface MemberContextValue {
  myMember:  Member | null;
  isAdmin:   boolean;
  isLoaded:  boolean;
  link:      (memberId: string) => Promise<void>;
  refresh:   () => Promise<void>;
}

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [myMember, setMyMember] = useState<Member | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setMyMember(null); setIsLoaded(true); return; }
    try {
      const member = await fetchMyMember(user.id);
      setMyMember(member);
    } catch {
      setMyMember(null);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function link(memberId: string) {
    if (!user) return;
    const member = await linkMyMember(user.id, memberId);
    setMyMember(member);
  }

  return (
    <MemberContext.Provider value={{
      myMember,
      isAdmin:  myMember?.role === "admin",
      isLoaded,
      link,
      refresh:  load,
    }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember(): MemberContextValue {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used inside <MemberProvider>");
  return ctx;
}
