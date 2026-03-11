import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Loader2, UserPlus, Shield, ShieldCheck, Trash2, History, Clock,
  User as UserIcon, Eye, BookOpen, Check, X, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SUPERADMIN_EMAILS = ["t.coulibaly@cotedivoirexport.ci", "h.cisse@cotedivoirexport.ci"];

const ROLES = [
  { value: "superadmin", label: "Super Admin", icon: ShieldCheck, color: "bg-accent/10 text-accent" },
  { value: "admin", label: "Admin", icon: Shield, color: "bg-primary/10 text-primary" },
  { value: "formateur", label: "Formateur", icon: GraduationCap, color: "bg-info/10 text-info" },
  { value: "lecteur", label: "Lecteur", icon: Eye, color: "bg-muted text-muted-foreground" },
];

const PERMISSIONS = [
  { label: "Gérer les utilisateurs", superadmin: true, admin: false, formateur: false, lecteur: false },
  { label: "Journal d'audit", superadmin: true, admin: false, formateur: false, lecteur: false },
  { label: "Supprimer formations / inscriptions", superadmin: true, admin: false, formateur: false, lecteur: false },
  { label: "Créer / modifier formations", superadmin: true, admin: true, formateur: false, lecteur: false },
  { label: "Gérer les participants", superadmin: true, admin: true, formateur: false, lecteur: false },
  { label: "Gérer les attestations", superadmin: true, admin: true, formateur: false, lecteur: false },
  { label: "Paramètres de la plateforme", superadmin: true, admin: true, formateur: false, lecteur: false },
  { label: "Émargement", superadmin: true, admin: true, formateur: true, lecteur: false },
  { label: "Consulter le reporting", superadmin: true, admin: true, formateur: true, lecteur: true },
  { label: "Consulter les formations", superadmin: true, admin: true, formateur: true, lecteur: true },
];

const getRoleConfig = (role: string) => ROLES.find((r) => r.value === role) || ROLES[3];

const logAction = async (action: string, details: string, email: string) => {
  await supabase.from("audit_log").insert({ action, details, user_email: email });
};

const UsersManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newNom, setNewNom] = useState("");
  const [newRole, setNewRole] = useState("admin");

  const isSuperAdmin = user?.email ? SUPERADMIN_EMAILS.includes(user.email) : false;

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admins"] });
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  const addAdmin = useMutation({
    mutationFn: async () => {
      if (!newEmail.endsWith("@cotedivoirexport.ci")) {
        throw new Error("Seuls les emails @cotedivoirexport.ci sont autorisés");
      }
      const { error } = await supabase.from("admins").insert({
        email: newEmail,
        nom_complet: newNom || null,
        role: newRole,
      });
      if (error) throw error;
      const roleLabel = getRoleConfig(newRole).label;
      await logAction("Ajout utilisateur", `${newNom || newEmail} ajouté en tant que ${roleLabel}`, user?.email || "");
    },
    onSuccess: () => {
      invalidateAll();
      setNewEmail("");
      setNewNom("");
      setNewRole("admin");
      toast({ title: "Utilisateur ajouté avec succès" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role, adminEmail }: { id: string; role: string; adminEmail: string }) => {
      const { error } = await supabase.from("admins").update({ role }).eq("id", id);
      if (error) throw error;
      const roleLabel = getRoleConfig(role).label;
      await logAction("Modification rôle", `${adminEmail} → ${roleLabel}`, user?.email || "");
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Rôle mis à jour" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, actif, adminEmail }: { id: string; actif: boolean; adminEmail: string }) => {
      const { error } = await supabase.from("admins").update({ actif }).eq("id", id);
      if (error) throw error;
      await logAction(
        actif ? "Activation utilisateur" : "Désactivation utilisateur",
        `${adminEmail} ${actif ? "activé" : "désactivé"}`,
        user?.email || ""
      );
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Statut mis à jour" });
    },
  });

  const deleteAdmin = useMutation({
    mutationFn: async ({ id, adminEmail }: { id: string; adminEmail: string }) => {
      const { error } = await supabase.from("admins").delete().eq("id", id);
      if (error) throw error;
      await logAction("Suppression utilisateur", `${adminEmail} supprimé`, user?.email || "");
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Utilisateur supprimé" });
    },
  });

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Gestion des utilisateurs">
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Accès réservé aux super-administrateurs.</p>
        </div>
      </AdminLayout>
    );
  }

  const actionColors: Record<string, string> = {
    "Ajout utilisateur": "bg-success/10 text-success",
    "Ajout admin": "bg-success/10 text-success",
    "Suppression utilisateur": "bg-destructive/10 text-destructive",
    "Suppression admin": "bg-destructive/10 text-destructive",
    "Activation utilisateur": "bg-info/10 text-info",
    "Activation admin": "bg-info/10 text-info",
    "Désactivation utilisateur": "bg-warning/10 text-warning",
    "Désactivation admin": "bg-warning/10 text-warning",
    "Modification rôle": "bg-accent/10 text-accent",
  };

  return (
    <AdminLayout title="Gestion des utilisateurs" subtitle="Gérez les utilisateurs, rôles et permissions de la plateforme">
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> Rôles & Permissions
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="w-4 h-4" /> Journal d'activité
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="space-y-6">
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-accent" />
              Ajouter un utilisateur
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Nom complet"
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                className="sm:w-48"
              />
              <Input
                placeholder="email@cotedivoirexport.ci"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="sm:flex-1"
              />
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="flex items-center gap-2">
                        <r.icon className="w-3.5 h-3.5" />
                        {r.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => addAdmin.mutate()} disabled={!newEmail || addAdmin.isPending}>
                {addAdmin.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajouter"}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="stat-card p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins?.map((admin) => {
                    const roleConf = getRoleConfig(admin.role);
                    const RoleIcon = roleConf.icon;
                    return (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.nom_complet || "—"}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          {admin.email === user?.email ? (
                            <Badge variant="secondary" className={`${roleConf.color} border-0`}>
                              <span className="flex items-center gap-1">
                                <RoleIcon className="w-3 h-3" />
                                {roleConf.label}
                              </span>
                            </Badge>
                          ) : (
                            <Select
                              value={admin.role}
                              onValueChange={(val) =>
                                updateRole.mutate({ id: admin.id, role: val, adminEmail: admin.email })
                              }
                            >
                              <SelectTrigger className="w-40 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    <span className="flex items-center gap-2">
                                      <r.icon className="w-3.5 h-3.5" />
                                      {r.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={admin.actif}
                            onCheckedChange={(checked) =>
                              toggleActive.mutate({ id: admin.id, actif: checked, adminEmail: admin.email })
                            }
                            disabled={admin.email === user?.email}
                          />
                        </TableCell>
                        <TableCell>
                          {admin.email !== user?.email && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {admin.email} n'aura plus accès au back-office.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAdmin.mutate({ id: admin.id, adminEmail: admin.email })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── Permissions Tab ── */}
        <TabsContent value="permissions" className="space-y-6">
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Matrice des permissions par rôle
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Permission</TableHead>
                    {ROLES.map((r) => (
                      <TableHead key={r.value} className="text-center min-w-[120px]">
                        <span className="flex items-center justify-center gap-1.5">
                          <r.icon className="w-4 h-4" />
                          {r.label}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSIONS.map((perm) => (
                    <TableRow key={perm.label}>
                      <TableCell className="font-medium">{perm.label}</TableCell>
                      {(["superadmin", "admin", "formateur", "lecteur"] as const).map((role) => (
                        <TableCell key={role} className="text-center">
                          {perm[role] ? (
                            <Check className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Role summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {ROLES.map((r) => {
              const count = admins?.filter((a) => a.role === r.value).length || 0;
              return (
                <div key={r.value} className="stat-card flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.color}`}>
                    <r.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{r.label}</p>
                    <p className="text-sm text-muted-foreground">{count} utilisateur{count > 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Audit Tab ── */}
        <TabsContent value="audit" className="space-y-4">
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              Journal d'activité
            </h3>

            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="mt-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                        <UserIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`${actionColors[log.action] || ""} border-0 text-xs`}>
                          {log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">par {log.user_email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée pour le moment.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default UsersManagement;
