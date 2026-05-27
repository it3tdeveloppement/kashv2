import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callBackofficeCreateUser, supabase } from "@kash/supabase";
import { Badge, Button, Card, CardContent, Input } from "@kash/ui";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useModulePermissions } from "../contexts/ModulePermissionsContext";
import { AccessDeniedPanel } from "../components/AccessDeniedPanel";

type StaffRole = "admin" | "manager" | "staff" | "cashier";

interface CreateUserForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: StaffRole;
  establishment_id: string;
  pos_pin: string;
}

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: StaffRole;
  establishment_id: string | null;
  pos_pin: string | null;
}

interface EstablishmentRow {
  id: string;
  name: string;
}

function emptyForm(): CreateUserForm {
  return {
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "staff",
    establishment_id: "",
    pos_pin: "",
  };
}

export function UsersPage() {
  const { currentTenantId } = useAuth();
  const { canReadModule, canWriteModule } = useModulePermissions();
  const canRead = canReadModule("settings");
  const canWrite = canWriteModule("settings");
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateUserForm>(emptyForm());
  const [search, setSearch] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["tenant-users", currentTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role, establishment_id, pos_pin")
        .eq("tenant_id", currentTenantId)
        .order("email");
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
    enabled: !!currentTenantId && canRead,
  });

  const { data: establishments = [] } = useQuery({
    queryKey: ["tenant-establishments-for-users", currentTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("id, name")
        .eq("tenant_id", currentTenantId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as EstablishmentRow[];
    },
    enabled: !!currentTenantId && canRead,
  });

  const createUser = useMutation({
    mutationFn: async () => {
      if (!currentTenantId) throw new Error("Selectionnez un tenant");
      if (!canWrite) throw new Error("Permission d'ecriture requise");
      if (!form.email || !form.password) throw new Error("Email et mot de passe requis");

      return await callBackofficeCreateUser({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        role: form.role,
        tenant_id: currentTenantId,
        establishment_id: form.establishment_id || null,
        pos_pin: form.pos_pin || null,
      });
    },
    onSuccess: () => {
      toast.success("Utilisateur cree");
      setForm(emptyForm());
      qc.invalidateQueries({ queryKey: ["tenant-users", currentTenantId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Creation impossible");
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({
      id,
      role,
      establishment_id,
      pos_pin,
    }: {
      id: string;
      role: StaffRole;
      establishment_id: string | null;
      pos_pin: string | null;
    }) => {
      if (!canWrite) throw new Error("Permission d'ecriture requise");
      const { error } = await supabase
        .from("profiles")
        .update({ role, establishment_id, pos_pin })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Utilisateur mis a jour");
      qc.invalidateQueries({ queryKey: ["tenant-users", currentTenantId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Mise a jour impossible");
    },
  });

  const filteredProfiles = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return profiles;
    return profiles.filter((profile) => {
      const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.toLowerCase();
      return profile.email.toLowerCase().includes(term) || fullName.includes(term);
    });
  }, [profiles, search]);

  if (!canRead) {
    return (
      <AccessDeniedPanel
        title="Acces utilisateurs indisponible"
        message="Votre compte n'a pas la permission de lecture sur la gestion des utilisateurs."
      />
    );
  }

  if (!currentTenantId) {
    return (
      <AccessDeniedPanel
        title="Selection tenant requise"
        message="Selectionnez un tenant actif pour gerer les utilisateurs."
      />
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Creez les comptes Backoffice/POS et assignez role, point de vente et PIN.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Creer un utilisateur
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              placeholder="Mot de passe"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
            <Input
              placeholder="Prenom"
              value={form.first_name}
              onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
            />
            <Input
              placeholder="Nom"
              value={form.last_name}
              onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
            />
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as StaffRole }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="cashier">Cashier</option>
            </select>
            <select
              value={form.establishment_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, establishment_id: event.target.value }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sans etablissement</option>
              {establishments.map((establishment) => (
                <option key={establishment.id} value={establishment.id}>
                  {establishment.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="PIN POS (ex: 123456)"
              value={form.pos_pin}
              onChange={(event) =>
                setForm((current) => ({ ...current, pos_pin: event.target.value.replace(/\D/g, "").slice(0, 6) }))
              }
            />
          </div>
          <Button onClick={() => createUser.mutate()} disabled={!canWrite || createUser.isPending}>
            Creer le compte
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Utilisateurs du tenant
            </h2>
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:w-72"
            />
          </div>

          <div className="space-y-3">
            {filteredProfiles.map((profile) => (
              <UserRowCard
                key={profile.id}
                profile={profile}
                establishments={establishments}
                onSave={(payload) => updateProfile.mutate(payload)}
                canWrite={canWrite}
              />
            ))}
            {filteredProfiles.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Aucun utilisateur trouve
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserRowCard({
  profile,
  establishments,
  onSave,
  canWrite,
}: {
  profile: ProfileRow;
  establishments: EstablishmentRow[];
  onSave: (payload: {
    id: string;
    role: StaffRole;
    establishment_id: string | null;
    pos_pin: string | null;
  }) => void;
  canWrite: boolean;
}) {
  const [role, setRole] = useState<StaffRole>(profile.role);
  const [establishmentId, setEstablishmentId] = useState<string>(profile.establishment_id ?? "");
  const [posPin, setPosPin] = useState<string>(profile.pos_pin ?? "");

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {(profile.first_name || profile.last_name)
            ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
            : profile.email}
        </p>
        <Badge variant="outline">{profile.email}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <select
          value={role}
          disabled={!canWrite}
          onChange={(event) => setRole(event.target.value as StaffRole)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
          <option value="cashier">Cashier</option>
        </select>
        <select
          value={establishmentId}
          disabled={!canWrite}
          onChange={(event) => setEstablishmentId(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Sans etablissement</option>
          {establishments.map((establishment) => (
            <option key={establishment.id} value={establishment.id}>
              {establishment.name}
            </option>
          ))}
        </select>
        <Input
          value={posPin}
          disabled={!canWrite}
          placeholder="PIN POS"
          onChange={(event) => setPosPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <Button
          disabled={!canWrite}
          onClick={() =>
            onSave({
              id: profile.id,
              role,
              establishment_id: establishmentId || null,
              pos_pin: posPin || null,
            })
          }
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

