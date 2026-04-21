import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  options: string[];
  required: boolean;
  position: number;
  width: string;
}

const FormPublicView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: form, isLoading: loadingForm } = useQuery({
    queryKey: ["public-form", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_forms")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .eq("is_public", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: fields, isLoading: loadingFields } = useQuery({
    queryKey: ["public-form-fields", form?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_form_fields")
        .select("*")
        .eq("form_id", form!.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as FormField[];
    },
    enabled: !!form?.id,
  });

  const submitForm = useMutation({
    mutationFn: async () => {
      // Validate required fields
      const missing = fields?.filter(f => f.required && !["heading", "separator"].includes(f.field_type) && !formData[f.id]);
      if (missing && missing.length > 0) {
        throw new Error(`Veuillez remplir : ${missing.map(f => f.label).join(", ")}`);
      }
      const { error } = await supabase.from("dynamic_form_submissions").insert({
        form_id: form!.id,
        data: formData,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Formulaire envoyé avec succès !" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const widthClass = (w: string) => {
    switch (w) {
      case "half": return "col-span-1";
      case "third": return "col-span-1";
      default: return "col-span-2";
    }
  };

  if (loadingForm || loadingFields) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-lg font-semibold text-foreground">Formulaire introuvable</h1>
          <p className="text-sm text-muted-foreground mt-1">Ce formulaire n'existe pas ou n'est pas disponible.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="stat-card max-w-md w-full text-center py-12">
          <CheckCircle2 className="w-14 h-14 mx-auto text-accent mb-4" />
          <h2 className="text-xl font-bold text-foreground">Merci !</h2>
          <p className="text-sm text-muted-foreground mt-2">Votre réponse a bien été enregistrée.</p>
          <Button className="mt-6" onClick={() => { setSubmitted(false); setFormData({}); }}>
            Soumettre une autre réponse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="stat-card mb-6">
          <h1 className="text-xl font-bold text-foreground">{form.title}</h1>
          {form.description && <p className="text-sm text-muted-foreground mt-1">{form.description}</p>}
        </div>

        <div className="stat-card">
          <div className="grid grid-cols-2 gap-4">
            {fields?.map((field) => {
              const ft = (field.field_type || "text").toLowerCase();
              if (ft === "heading") {
                return (
                  <div key={field.id} className="col-span-2 pt-4 first:pt-0">
                    <h3 className="text-base font-semibold text-foreground">{field.label}</h3>
                  </div>
                );
              }
              if (ft === "separator") {
                return <Separator key={field.id} className="col-span-2 my-2" />;
              }

              const isText = ["text", "string", ""].includes(ft);
              const isTextarea = ft === "textarea";
              const isEmail = ft === "email";
              const isTel = ["tel", "phone"].includes(ft);
              const isNumber = ft === "number";
              const isDate = ft === "date";
              const isSelect = ["select", "dropdown", "dropdown_menu", "list"].includes(ft);
              const isCheckbox = ft === "checkbox";
              const isRadio = ft === "radio";
              const isFile = ft === "file";
              const isKnown =
                isText || isTextarea || isEmail || isTel || isNumber || isDate || isSelect || isCheckbox || isRadio || isFile;

              return (
                <div key={field.id} className={`${widthClass(field.width)} space-y-2`}>
                  <Label className="text-sm">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>

                  {(isText || !isKnown) && (
                    <Input
                      value={formData[field.id] || ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                    />
                  )}

                  {isTextarea && (
                    <Textarea
                      value={formData[field.id] || ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                      rows={3}
                    />
                  )}

                  {isEmail && (
                    <Input
                      type="email"
                      value={formData[field.id] || ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                    />
                  )}

                  {isTel && (
                    <Input
                      type="tel"
                      value={formData[field.id] || ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                    />
                  )}

                  {isNumber && (
                    <Input
                      type="number"
                      value={formData[field.id] || ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                    />
                  )}

                  {isDate && (
                    <Input
                      type="date"
                      value={formData[field.id] || ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                    />
                  )}

                  {isSelect && (
                    <Select
                      value={formData[field.id] || ""}
                      onValueChange={(v) => updateField(field.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || "Sélectionner..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(field.options) &&
                          (field.options as any[])
                            .map((opt) => (typeof opt === "string" ? opt : opt?.value ?? opt?.label ?? ""))
                            .filter((opt) => opt && String(opt).trim() !== "")
                            .map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  )}

                  {isCheckbox && (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        checked={formData[field.id] === true}
                        onCheckedChange={(checked) => updateField(field.id, checked)}
                      />
                      <span className="text-sm text-muted-foreground">{field.placeholder || ""}</span>
                    </div>
                  )}

                  {isRadio && (
                    <RadioGroup
                      value={formData[field.id] || ""}
                      onValueChange={(v) => updateField(field.id, v)}
                    >
                      {Array.isArray(field.options) &&
                        (field.options as any[])
                          .map((opt) => (typeof opt === "string" ? opt : opt?.value ?? opt?.label ?? ""))
                          .filter((opt) => opt && String(opt).trim() !== "")
                          .map((opt) => (
                            <div key={opt} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                              <Label htmlFor={`${field.id}-${opt}`} className="text-sm font-normal">
                                {opt}
                              </Label>
                            </div>
                          ))}
                    </RadioGroup>
                  )}

                  {isFile && (
                    <Input
                      type="file"
                      onChange={(e) => updateField(field.id, e.target.files?.[0]?.name || "")}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={() => submitForm.mutate()}
              disabled={submitForm.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitForm.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPublicView;
