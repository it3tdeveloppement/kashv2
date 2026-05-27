import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Check,
  Layers,
  MoreHorizontal,
  Plus,
  Settings2,
  Store,
} from "lucide-react";
import { supabase } from "@kash/supabase";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  cn,
} from "@kash/ui";
import { useAuth } from "../contexts/AuthContext";
import type { Establishment, Module, Tenant, TenantModuleAccess } from "@kash/types";
import { useModulePermissions } from "../contexts/ModulePermissionsContext";
import { AccessDeniedPanel } from "../components/AccessDeniedPanel";

const DEFAULT_MODULES = [
  { code: "dashboard", display_name: "Tableau de bord", route: "/", icon: "LayoutDashboard" },
  { code: "products", display_name: "Produits", route: "/products", icon: "ShoppingBag" },
  { code: "pos", display_name: "POS caisse", route: "/pos/login", icon: "Monitor" },
  { code: "kiosk", display_name: "Kiosk", route: "/terminal-display", icon: "Tablet" },
  { code: "kitchen", display_name: "Cuisine KDS", route: "/kitchen", icon: "ChefHat" },
  { code: "shop", display_name: "Click & Collect", route: "/shop", icon: "ShoppingCart" },
  { code: "customers", display_name: "Clients", route: "/customers", icon: "Users" },
  { code: "inventory", display_name: "Stock", route: "/inventory-stock", icon: "Package" },
  { code: "billing", display_name: "Facturation", route: "/billing", icon: "FileText" },
  { code: "settings", display_name: "Parametres", route: "/settings", icon: "Settings" },
] as const;

type TenantWithChildren = Tenant & {
  children: Tenant[];
};

interface ParentFormState {
  name: string;
  slug: string;
  plan: "starter" | "pro" | "enterprise";
}

interface ChildFormState {
  parentTenantId: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  pos_enabled: boolean;
  terminal_enabled: boolean;
  kitchen_enabled: boolean;
  display_enabled: boolean;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function seedDefaultModules(tenantId: string) {
  const rows = DEFAULT_MODULES.map((module, index) => ({
    tenant_id: tenantId,
    code: module.code,
    display_name: module.display_name,
    route: module.route,
    icon: module.icon,
    display_order: index,
    is_visible: true,
    show_in_sidebar: true,
    has_write_capability: ["products", "inventory", "billing", "settings"].includes(module.code),
  }));

  const { data: modules, error } = await supabase
    .from("modules")
    .upsert(rows, { onConflict: "tenant_id,code" })
    .select("*");
  if (error) throw error;

  if (modules?.length) {
    const accessRows = modules.map((module) => ({
      tenant_id: tenantId,
      module_id: module.id,
      is_enabled: true,
      propagate_to_children: true,
    }));
    const { error: accessError } = await supabase
      .from("tenant_module_access")
      .upsert(accessRows, { onConflict: "tenant_id,module_id" });
    if (accessError) throw accessError;
  }
}

function emptyParentForm(): ParentFormState {
  return {
    name: "",
    slug: "",
    plan: "starter",
  };
}

function emptyChildForm(parentTenantId = ""): ChildFormState {
  return {
    parentTenantId,
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    pos_enabled: true,
    terminal_enabled: true,
    kitchen_enabled: true,
    display_enabled: false,
  };
}

export function TenantsPage() {
  const { currentTenantId, isSuperAdmin, profile, switchTenant } = useAuth();
  const { canReadModule, canWriteModule } = useModulePermissions();
  const qc = useQueryClient();
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [parentForm, setParentForm] = useState<ParentFormState>(emptyParentForm());
  const [childForm, setChildForm] = useState<ChildFormState>(emptyChildForm());
  const canRead = canReadModule("settings");
  const canWrite = canWriteModule("settings");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants-phase-1", currentTenantId, isSuperAdmin],
    queryFn: async () => {
      let query = supabase.from("tenants").select("*").order("name");
      if (!isSuperAdmin && currentTenantId) {
        query = query.or(`id.eq.${currentTenantId},parent_tenant_id.eq.${currentTenantId}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Tenant[];
    },
  });

  const tenantIds = tenants.map((tenant) => tenant.id);
  const { data: establishments = [] } = useQuery({
    queryKey: ["establishments-phase-1", tenantIds.join(",")],
    queryFn: async () => {
      if (!tenantIds.length) return [];
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .in("tenant_id", tenantIds)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Establishment[];
    },
    enabled: tenantIds.length > 0,
  });

  const hierarchy = useMemo<TenantWithChildren[]>(() => {
    const byParent = new Map<string, Tenant[]>();
    for (const tenant of tenants) {
      if (tenant.parent_tenant_id) {
        byParent.set(tenant.parent_tenant_id, [...(byParent.get(tenant.parent_tenant_id) ?? []), tenant]);
      }
    }

    const parents = tenants.filter((tenant) => tenant.parent_tenant_id === null);
    const selected = currentTenantId
      ? parents.filter((tenant) => tenant.id === currentTenantId || byParent.has(tenant.id))
      : parents;

    return selected.map((tenant) => ({
      ...tenant,
      children: byParent.get(tenant.id) ?? [],
    }));
  }, [currentTenantId, tenants]);

  const parentOptions = useMemo(
    () => tenants.filter((tenant) => tenant.parent_tenant_id === null),
    [tenants]
  );

  const establishmentsByTenant = useMemo(() => {
    const map = new Map<string, Establishment>();
    for (const establishment of establishments) {
      map.set(establishment.tenant_id, establishment);
    }
    return map;
  }, [establishments]);

  const createParent = useMutation({
    mutationFn: async () => {
      if (!canWrite) throw new Error("Aucune permission d'ecriture");
      const name = parentForm.name.trim();
      const slug = (parentForm.slug || slugify(name)).trim();
      if (!name || !slug) throw new Error("Nom et slug requis");

      const { data: tenant, error } = await supabase
        .from("tenants")
        .insert({
          name,
          slug,
          plan: parentForm.plan,
          parent_tenant_id: null,
          is_active: true,
        })
        .select("*")
        .single();
      if (error) throw error;

      const { error: settingsError } = await supabase.from("tenant_settings").insert({
        tenant_id: tenant.id,
        primary_color: "#97f56d",
        default_currency: "MAD",
        timezone: "Africa/Casablanca",
        business_day_start_hour: 4,
      });
      if (settingsError) throw settingsError;

      if (profile?.id) {
        await supabase.from("user_tenant_access").upsert(
          {
            user_id: profile.id,
            tenant_id: tenant.id,
            role: "admin",
            is_active: true,
          },
          { onConflict: "user_id,tenant_id" }
        );
      }

      await seedDefaultModules(tenant.id);
      return tenant as Tenant;
    },
    onSuccess: (tenant) => {
      toast.success("Tenant principal cree");
      setParentForm(emptyParentForm());
      setParentOpen(false);
      switchTenant(tenant.id);
      qc.invalidateQueries({ queryKey: ["tenants-phase-1"] });
      qc.invalidateQueries({ queryKey: ["tenant-context-options"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Creation impossible");
    },
  });

  const createChild = useMutation({
    mutationFn: async () => {
      if (!canWrite) throw new Error("Aucune permission d'ecriture");
      const parentTenantId = childForm.parentTenantId || currentTenantId;
      const name = childForm.name.trim();
      const slug = (childForm.slug || slugify(name)).trim();
      if (!parentTenantId) throw new Error("Selectionnez un tenant principal");
      if (!name || !slug) throw new Error("Nom et slug requis");

      const { data: tenant, error } = await supabase
        .from("tenants")
        .insert({
          name,
          slug,
          parent_tenant_id: parentTenantId,
          plan: null,
          is_active: true,
        })
        .select("*")
        .single();
      if (error) throw error;

      const { error: establishmentError } = await supabase.from("establishments").insert({
        tenant_id: tenant.id,
        name,
        email: childForm.email || null,
        phone: childForm.phone || null,
        address: childForm.address || null,
        city: childForm.city || null,
        zip: childForm.zip || null,
        pos_enabled: childForm.pos_enabled,
        terminal_enabled: childForm.terminal_enabled,
        kitchen_enabled: childForm.kitchen_enabled,
        display_enabled: childForm.display_enabled,
      });
      if (establishmentError) throw establishmentError;

      const { error: settingsError } = await supabase.from("tenant_settings").insert({
        tenant_id: tenant.id,
        default_currency: "MAD",
        timezone: "Africa/Casablanca",
        business_day_start_hour: 4,
      });
      if (settingsError) throw settingsError;

      await seedDefaultModules(tenant.id);
      return tenant as Tenant;
    },
    onSuccess: () => {
      toast.success("Etablissement cree");
      setChildForm(emptyChildForm(currentTenantId ?? parentOptions[0]?.id ?? ""));
      setChildOpen(false);
      qc.invalidateQueries({ queryKey: ["tenants-phase-1"] });
      qc.invalidateQueries({ queryKey: ["establishments-phase-1"] });
      qc.invalidateQueries({ queryKey: ["tenant-context-options"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Creation impossible");
    },
  });

  function openChildDialog(parentTenantId?: string) {
    if (!canWrite) {
      toast.error("Permission d'ecriture requise");
      return;
    }
    setChildForm(emptyChildForm(parentTenantId ?? currentTenantId ?? parentOptions[0]?.id ?? ""));
    setChildOpen(true);
  }

  if (!canRead) {
    return (
      <AccessDeniedPanel
        title="Acces etablissements indisponible"
        message="Votre compte n'a pas la permission de lecture sur la gestion des tenants."
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-otacos">Tenants et etablissements</h1>
          <p className="text-sm text-muted-foreground">
            Superadmin: creez les marques principales, leurs points de vente, et les modules actifs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <Button
              className="gap-2"
              disabled={!canWrite}
              onClick={() => (canWrite ? setParentOpen(true) : toast.error("Permission d'ecriture requise"))}
            >
              <Plus className="w-4 h-4" /> Nouveau tenant principal
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            disabled={!canWrite}
            onClick={() => openChildDialog()}
          >
            <Store className="w-4 h-4" /> Nouvel etablissement
          </Button>
        </div>
      </div>

      {!isSuperAdmin && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            Votre compte peut gerer uniquement son tenant et les etablissements accessibles.
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-52 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : hierarchy.length === 0 ? (
        <EmptyTenantState onCreateParent={() => setParentOpen(true)} canWrite={canWrite} />
      ) : (
        <div className="space-y-5">
          {hierarchy.map((parent) => (
            <ParentTenantCard
              key={parent.id}
              parent={parent}
              childrenTenants={parent.children}
              establishmentsByTenant={establishmentsByTenant}
              currentTenantId={currentTenantId}
              onSwitch={switchTenant}
              onCreateChild={() => openChildDialog(parent.id)}
              onManageModules={(tenant) => {
                setSelectedTenant(tenant);
                setModulesOpen(true);
              }}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}

      <CreateParentDialog
        open={parentOpen}
        onOpenChange={setParentOpen}
        form={parentForm}
        setForm={setParentForm}
        isSubmitting={createParent.isPending}
        onSubmit={() => createParent.mutate()}
        canWrite={canWrite}
      />

      <CreateChildDialog
        open={childOpen}
        onOpenChange={setChildOpen}
        form={childForm}
        setForm={setChildForm}
        parentOptions={parentOptions}
        isSubmitting={createChild.isPending}
        onSubmit={() => createChild.mutate()}
        canWrite={canWrite}
      />

      <ModulesDialog
        open={modulesOpen}
        onOpenChange={setModulesOpen}
        tenant={selectedTenant}
        canWrite={canWrite}
      />
    </div>
  );
}

function EmptyTenantState({
  onCreateParent,
  canWrite,
}: {
  onCreateParent: () => void;
  canWrite: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">Aucun tenant principal</h2>
          <p className="text-sm text-muted-foreground">
            Creez votre premiere marque/chaine avant d'ajouter des etablissements.
          </p>
        </div>
        <Button
          onClick={() => (canWrite ? onCreateParent() : toast.error("Permission d'ecriture requise"))}
          disabled={!canWrite}
        >
          <Plus className="h-4 w-4" /> Creer un tenant principal
        </Button>
      </CardContent>
    </Card>
  );
}

function ParentTenantCard({
  parent,
  childrenTenants,
  establishmentsByTenant,
  currentTenantId,
  onSwitch,
  onCreateChild,
  onManageModules,
  canWrite,
}: {
  parent: Tenant;
  childrenTenants: Tenant[];
  establishmentsByTenant: Map<string, Establishment>;
  currentTenantId: string | null;
  onSwitch: (tenantId: string | null) => void;
  onCreateChild: () => void;
  onManageModules: (tenant: Tenant) => void;
  canWrite: boolean;
}) {
  return (
    <Card className={cn(currentTenantId === parent.id && "border-primary")}>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">{parent.name}</h2>
                <Badge variant={parent.is_active ? "default" : "secondary"}>
                  {parent.is_active ? "Actif" : "Inactif"}
                </Badge>
                <Badge variant="outline">Tenant principal</Badge>
              </div>
              <p className="text-xs text-muted-foreground">/{parent.slug}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {childrenTenants.length} etablissement(s)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onSwitch(parent.id)}>
              <Check className="h-4 w-4" /> Ouvrir contexte
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (canWrite ? onManageModules(parent) : toast.error("Permission d'ecriture requise"))}
              disabled={!canWrite}
            >
              <Layers className="h-4 w-4" /> Modules
            </Button>
            <Button size="sm" onClick={onCreateChild} disabled={!canWrite}>
              <Plus className="h-4 w-4" /> Etablissement
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {childrenTenants.map((child) => (
            <ChildTenantCard
              key={child.id}
              tenant={child}
              establishment={establishmentsByTenant.get(child.id)}
              isCurrent={currentTenantId === child.id}
              onSwitch={() => onSwitch(child.id)}
              onManageModules={() => onManageModules(child)}
              canWrite={canWrite}
            />
          ))}

          <button
            type="button"
            onClick={onCreateChild}
            disabled={!canWrite}
            className="min-h-36 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-40"
          >
            <Plus className="w-8 h-8 text-muted-foreground/40" />
            <span className="text-sm text-muted-foreground">Ajouter un etablissement</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChildTenantCard({
  tenant,
  establishment,
  isCurrent,
  onSwitch,
  onManageModules,
  canWrite,
}: {
  tenant: Tenant;
  establishment?: Establishment;
  isCurrent: boolean;
  onSwitch: () => void;
  onManageModules: () => void;
  canWrite: boolean;
}) {
  return (
    <Card className={cn("hover:border-primary/50 transition-colors", isCurrent && "border-primary")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{tenant.name}</h3>
              <p className="text-xs text-muted-foreground truncate">/{tenant.slug}</p>
            </div>
          </div>
          <Badge variant={tenant.is_active ? "default" : "secondary"}>
            {tenant.is_active ? "Actif" : "Inactif"}
          </Badge>
        </div>

        {establishment && (
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>{establishment.city || "Ville non renseignee"}</span>
            <span>{establishment.phone || "Telephone vide"}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {establishment?.pos_enabled && <span className="text-xs bg-muted px-2 py-0.5 rounded">POS</span>}
          {establishment?.terminal_enabled && <span className="text-xs bg-muted px-2 py-0.5 rounded">Kiosk</span>}
          {establishment?.kitchen_enabled && <span className="text-xs bg-muted px-2 py-0.5 rounded">KDS</span>}
          {establishment?.display_enabled && <span className="text-xs bg-muted px-2 py-0.5 rounded">Display</span>}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSwitch}>
            Ouvrir
          </Button>
          <Button variant="outline" size="sm" onClick={onManageModules} disabled={!canWrite}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateParentDialog({
  open,
  onOpenChange,
  form,
  setForm,
  isSubmitting,
  onSubmit,
  canWrite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ParentFormState;
  setForm: React.Dispatch<React.SetStateAction<ParentFormState>>;
  isSubmitting: boolean;
  onSubmit: () => void;
  canWrite: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau tenant principal</DialogTitle>
          <DialogDescription>
            Creez une marque ou chaine. Les etablissements seront ajoutes comme tenants enfants.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nom">
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: current.slug || slugify(event.target.value),
                }))
              }
              placeholder="O'Tacos Maroc"
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              placeholder="otacos-maroc"
            />
          </Field>
          <Field label="Plan">
            <select
              value={form.plan}
              onChange={(event) =>
                setForm((current) => ({ ...current, plan: event.target.value as ParentFormState["plan"] }))
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !canWrite}>
            Creer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateChildDialog({
  open,
  onOpenChange,
  form,
  setForm,
  parentOptions,
  isSubmitting,
  onSubmit,
  canWrite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ChildFormState;
  setForm: React.Dispatch<React.SetStateAction<ChildFormState>>;
  parentOptions: Tenant[];
  isSubmitting: boolean;
  onSubmit: () => void;
  canWrite: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvel etablissement</DialogTitle>
          <DialogDescription>
            Creez un tenant enfant et sa fiche etablissement commerciale.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tenant principal">
            <select
              value={form.parentTenantId}
              onChange={(event) => setForm((current) => ({ ...current, parentTenantId: event.target.value }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selectionner...</option>
              {parentOptions.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nom">
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: current.slug || slugify(event.target.value),
                }))
              }
              placeholder="Rabat Agdal"
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              placeholder="rabat-agdal"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </Field>
          <Field label="Telephone">
            <Input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </Field>
          <Field label="Ville">
            <Input
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            />
          </Field>
          <Field label="Code postal">
            <Input
              value={form.zip}
              onChange={(event) => setForm((current) => ({ ...current, zip: event.target.value }))}
            />
          </Field>
          <Field label="Adresse">
            <Input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            ["pos_enabled", "POS"],
            ["terminal_enabled", "Kiosk"],
            ["kitchen_enabled", "KDS"],
            ["display_enabled", "Display"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form[key as keyof ChildFormState])}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !canWrite}>
            Creer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModulesDialog({
  open,
  onOpenChange,
  tenant,
  canWrite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  canWrite: boolean;
}) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["tenant-modules", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data: modules, error } = await supabase
        .from("modules")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("display_order");
      if (error) throw error;

      const moduleRows = (modules ?? []) as Module[];
      if (!moduleRows.length) return [];

      const { data: accessRows, error: accessError } = await supabase
        .from("tenant_module_access")
        .select("*")
        .eq("tenant_id", tenant.id);
      if (accessError) throw accessError;

      const accessByModule = new Map(
        ((accessRows ?? []) as TenantModuleAccess[]).map((row) => [row.module_id, row])
      );
      return moduleRows.map((module) => ({
        module,
        access: accessByModule.get(module.id) ?? null,
      }));
    },
    enabled: open && !!tenant,
  });

  const toggleModule = useMutation({
    mutationFn: async ({ module, enabled }: { module: Module; enabled: boolean }) => {
      if (!canWrite) throw new Error("Aucune permission d'ecriture");
      const { error } = await supabase.from("tenant_module_access").upsert(
        {
          tenant_id: module.tenant_id,
          module_id: module.id,
          is_enabled: enabled,
          propagate_to_children: true,
        },
        { onConflict: "tenant_id,module_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-modules", tenant?.id] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Module non modifie");
    },
  });

  const initializeModules = useMutation({
    mutationFn: async () => {
      if (!canWrite) throw new Error("Aucune permission d'ecriture");
      if (!tenant) return;
      await seedDefaultModules(tenant.id);
    },
    onSuccess: () => {
      toast.success("Modules initialises");
      qc.invalidateQueries({ queryKey: ["tenant-modules", tenant?.id] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modules - {tenant?.name}</DialogTitle>
          <DialogDescription>
            Activez les surfaces disponibles pour ce tenant. Les permissions utilisateur fines arrivent ensuite.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 rounded-md bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <MoreHorizontal className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Aucun module initialise pour ce tenant.</p>
            <Button className="mt-4" onClick={() => initializeModules.mutate()} disabled={!canWrite}>
              Initialiser les modules
            </Button>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {data.map(({ module, access }) => {
              const enabled = access?.is_enabled ?? true;
              return (
                <div key={module.id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium text-sm">{module.display_name}</p>
                    <p className="text-xs text-muted-foreground">{module.code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModule.mutate({ module, enabled: !enabled })}
                    disabled={!canWrite}
                    className={cn(
                      "h-6 w-11 rounded-full p-0.5 transition-colors disabled:opacity-40",
                      enabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "block h-5 w-5 rounded-full bg-background transition-transform",
                        enabled && "translate-x-5"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
