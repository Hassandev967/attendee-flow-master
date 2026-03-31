import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Download, Inbox } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const FormSubmissions = () => {
  const { id: formId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: form } = useQuery({
    queryKey: ["dynamic-form", formId],
    queryFn: async () => {
      const { data, error } = await supabase.from("dynamic_forms").select("*").eq("id", formId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  const { data: fields } = useQuery({
    queryKey: ["dynamic-form-fields", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_form_fields")
        .select("*")
        .eq("form_id", formId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["form-submissions", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_form_submissions")
        .select("*")
        .eq("form_id", formId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  const visibleFields = fields?.filter(f => !["heading", "separator"].includes(f.field_type)) || [];

  const exportCSV = () => {
    if (!submissions || !visibleFields.length) return;
    const headers = ["Date", ...visibleFields.map(f => f.label)];
    const rows = submissions.map(sub => {
      const data = sub.data as Record<string, any>;
      return [
        format(new Date(sub.created_at), "dd/MM/yyyy HH:mm"),
        ...visibleFields.map(f => String(data[f.id] ?? "")),
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${form?.slug || "formulaire"}_reponses.csv`;
    a.click();
  };

  return (
    <AdminLayout
      title={`Réponses — ${form?.title || ""}`}
      subtitle={`${submissions?.length || 0} soumission(s)`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/admin/formulaires")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          {submissions && submissions.length > 0 && (
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> Exporter CSV
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : submissions && submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Date</th>
                  {visibleFields.map(f => (
                    <th key={f.id} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  const data = sub.data as Record<string, any>;
                  return (
                    <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(sub.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                      </td>
                      {visibleFields.map(f => (
                        <td key={f.id} className="py-3 px-3 text-sm">
                          {typeof data[f.id] === "boolean" ? (data[f.id] ? "Oui" : "Non") : String(data[f.id] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="stat-card text-center py-12">
            <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune soumission pour ce formulaire</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FormSubmissions;
