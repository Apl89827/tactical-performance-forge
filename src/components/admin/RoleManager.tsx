import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export default function RoleManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter((p) =>
      [p.first_name, p.last_name, p.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [profiles, search]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .order("created_at", { ascending: false });
        if (pErr) throw pErr;

        const ids = (profs || []).map((p) => p.id);
        let roleMap: Record<string, string[]> = {};
        if (ids.length) {
          const { data: rdata, error: rErr } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", ids);
          if (rErr) throw rErr;
          roleMap = (rdata || []).reduce<Record<string, string[]>>((acc, r: any) => {
            acc[r.user_id] = acc[r.user_id] || [];
            acc[r.user_id].push(r.role);
            return acc;
          }, {});
        }

        setProfiles((profs as Profile[]) || []);
        setRoles(roleMap);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load users/roles");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const isAdmin = (userId: string) => (roles[userId] || []).includes("admin");

  const grantAdmin = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) {
      console.error(error);
      toast.error("Could not grant admin");
      return;
    }
    toast.success("Granted admin role");
    setRoles((prev) => ({ ...prev, [userId]: [...(prev[userId] || []), "admin"] }));
  };

  const revokeAdmin = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) {
      console.error(error);
      toast.error("Could not revoke admin");
      return;
    }
    toast.success("Revoked admin role");
    setRoles((prev) => ({ ...prev, [userId]: (prev[userId] || []).filter((r) => r !== "admin") }));
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Role Management</h2>
      </header>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name or id"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary/60 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={`${p.first_name || ''} ${p.last_name || ''} avatar`} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted" />
                )}
                <div>
                  <div className="font-medium">
                    {(p.first_name || "").trim()} {(p.last_name || "").trim()} {(!p.first_name && !p.last_name) && <span className="text-muted-foreground">(no name)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.id}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin(p.id) ? (
                  <Badge variant="secondary">admin</Badge>
                ) : (
                  <Badge variant="outline">user</Badge>
                )}
                {isAdmin(p.id) ? (
                  <Button variant="destructive" size="sm" onClick={() => revokeAdmin(p.id)}>
                    Revoke
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={() => grantAdmin(p.id)}>
                    Grant admin
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
