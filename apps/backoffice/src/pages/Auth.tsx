import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button, Input } from "@kash/ui";
import { useAuth } from "../contexts/AuthContext";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export function AuthPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signIn(data.email, data.password);
      navigate("/");
    } catch {
      toast.error("Identifiants incorrects. Verifiez votre email et mot de passe.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(700px_300px_at_0%_100%,hsl(97_88%_69%_/_0.24),transparent_60%),radial-gradient(600px_320px_at_100%_0%,hsl(160_65%_82%_/_0.24),transparent_58%)]" />

      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-2xl backdrop-blur md:grid-cols-[1.06fr_0.94fr]">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-[#0f2f25] via-[#173f30] to-[#21503c] p-8 text-white md:flex">
          <div className="space-y-6">
            <img src="/logo-kash.svg" alt="Kash" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-3xl font-black leading-tight">Kash Backoffice</h1>
              <p className="mt-2 max-w-sm text-sm text-white/80">
                Administrez vos marques, etablissements, modules et operations depuis une interface unique.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">Securite</p>
            <p className="mt-1 text-sm font-medium text-white">
              Connexion authentifiee, audit des acces et contexte multi-tenant.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-8 md:p-10">
          <div className="mb-7 flex items-center gap-3 md:hidden">
            <img src="/logo-kash.svg" alt="Kash" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-sm font-semibold text-foreground">Kash Backoffice</p>
              <p className="text-xs text-muted-foreground">Restaurant OS</p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-foreground">Connexion</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connectez-vous pour acceder a la plateforme de gestion.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="admin@restaurant.ma"
                autoComplete="email"
                className="h-11 rounded-lg border-border/70 bg-background/60"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mot de passe</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="........"
                  autoComplete="current-password"
                  className="h-11 rounded-lg border-border/70 bg-background/60 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full rounded-lg font-semibold shadow-[0_12px_30px_rgba(81,155,57,0.28)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Session securisee pour utilisateurs backoffice.
          </div>
        </section>
      </div>
    </div>
  );
}
