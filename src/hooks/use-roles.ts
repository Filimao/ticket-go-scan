import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";

export type AppRole = "admin" | "organizer" | "customer";

export function useRoles() {
  const { user, loading } = useSession();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (loading) return;
    if (!user) {
      setRoles([]);
      setReady(true);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!mounted) return;
        setRoles(((data ?? []).map((r) => r.role)) as AppRole[]);
        setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [user, loading]);

  return {
    roles,
    ready: ready && !loading,
    isAdmin: roles.includes("admin"),
    isOrganizer: roles.includes("organizer") || roles.includes("admin"),
  };
}