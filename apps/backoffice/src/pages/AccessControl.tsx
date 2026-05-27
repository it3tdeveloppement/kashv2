import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@kash/supabase";
import { Badge, Button, Card, CardContent, Input } from "@kash/ui";
import { toast } from "sonner";
import type { Module } from "@kash/types";
import { useAuth } from "../contexts/AuthContext";
import { useModulePermissions } from "../contexts/ModulePermissionsContext";
import { AccessDeniedPanel } from "../components/AccessDeniedPanel";

interface UserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface UserModulePermissionRow {
  id: string;
  user_id: string;
  module_id: string;
  can_read: boolean;
  can_write: boolean;
}

export function AccessControlPage() {
  const { currentTenantId, isSuperAdmin } = useAuth();
  const { canReadModule, canWriteModule } = useModulePermissions();
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const canRead = canReadModule("settings") || isSuperAdmin;
  const canWrite = canWriteModule("settings") || isSuperAdmin;

  const { data: users = [] } = useQuery({
    queryKey: ["access-control-users", currentTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role")
        .eq("tenant_id", currentTenantId)
        .order("email");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
    enabled: !!currentTenantId && canRead,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["access-control-modules", currentTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Module[];
    },
    enabled: !!currentTenantId && canRead,
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["access-control-permissions", currentTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_module_permissions")
        .select("id, user_id, module_id, can_read, can_write")
        .eq("tenant_id", currentTenantId);
      if (error) throw error;
      return (data ?? []) as UserModulePermissionRow[];
    },
    enabled: !!currentTenantId && canRead,
  });

  const permissionMap = useMemo(() => {
    const out = new Map<string, UserModulePermissionRow>();
    for (const row of permissions) {
      out.set(`${row.user_id}:${row.module_id}`, row);
    }
    return out;
  }, [permissions]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter((user) => {
      const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.toLowerCase();
      return user.email.toLowerCase().includes(term) || fullName.includes(term);
    });
  }, [search, users]);

  const upsertPermission = useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      canReadNext,
      canWriteNext,
    }: {
      userId: string;
      moduleId: string;
      canReadNext: boolean;
      canWriteNext: boolean;
    }) => {
      if (!canWrite) throw new Error("Aucune permission d'ecriture");
      const { error } = await supabase.from("user_module_permissions").upsert(
        {
          user_id: userId,
          tenant_id: currentTenantId,
          module_id: moduleId,
          can_read: canReadNext,
          can_write: canWriteNext,
        },
        { onConflict: "user_id,tenant_id,module_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["access-control-permissions", currentTenantId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Permission non modifiee");
    },
  });

  if (!canRead) {
    return (
      <AccessDeniedPanel
        title="Acces permissions indisponible"
        message="Votre compte n'a pas les droits pour consulter les permissions utilisateurs."
      />
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle d'acces</h1>
          <p className="text-sm text-muted-foreground">
            Definissez les droits lecture/ecriture par utilisateur et par module.
          </p>
        </div>
        <div className="w-full md:w-80">
          <Input
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Aucun utilisateur trouve.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {user.first_name || user.last_name
                      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                      : user.email}
                  </p>
                  <Badge variant="outline">{user.role}</Badge>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>

                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {modules.map((module) => {
                    const key = `${user.id}:${module.id}`;
                    const existing = permissionMap.get(key);
                    const canReadValue = existing?.can_read ?? true;
                    const canWriteValue = existing?.can_write ?? false;

                    return (
                      <div key={key} className="rounded-lg border p-3">
                        <p className="text-sm font-medium">{module.display_name}</p>
                        <p className="text-xs text-muted-foreground">{module.code}</p>

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={canReadValue ? "default" : "outline"}
                            disabled={!canWrite || upsertPermission.isPending}
                            onClick={() =>
                              upsertPermission.mutate({
                                userId: user.id,
                                moduleId: module.id,
                                canReadNext: !canReadValue,
                                canWriteNext: !canReadValue ? canWriteValue : false,
                              })
                            }
                          >
                            Lecture {canReadValue ? "ON" : "OFF"}
                          </Button>
                          <Button
                            size="sm"
                            variant={canWriteValue ? "default" : "outline"}
                            disabled={!canWrite || !canReadValue || upsertPermission.isPending}
                            onClick={() =>
                              upsertPermission.mutate({
                                userId: user.id,
                                moduleId: module.id,
                                canReadNext: true,
                                canWriteNext: !canWriteValue,
                              })
                            }
                          >
                            Ecriture {canWriteValue ? "ON" : "OFF"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

