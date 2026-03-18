import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportRow {
  civilite?: string;
  nom?: string;
  prenoms?: string;
  fonction?: string;
  nom_entreprise?: string;
  email?: string;
  telephone?: string;
  source?: string;
  secteurs?: string;
  [key: string]: string | undefined;
}

interface ImportResult {
  row: ImportRow;
  status: "success" | "error" | "pending";
  message?: string;
}

const EXPECTED_COLUMNS = [
  "Civilité",
  "Nom",
  "Prénoms",
  "Fonction",
  "Entreprise",
  "Email",
  "Téléphone",
  "Source d'information",
  "Secteur(s) d'activité(s)",
];

const ImportParticipantsDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: formations } = useQuery({
    queryKey: ["formations-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("id, titre, date_debut, statut")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sources } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sources_information").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: secteurs } = useQuery({
    queryKey: ["secteurs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secteurs").select("*");
      if (error) throw error;
      return data;
    },
  });

  const resetState = () => {
    setParsedRows([]);
    setResults([]);
    setStep("upload");
    setSelectedFormation("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

        if (jsonData.length === 0) {
          toast.error("Le fichier est vide");
          return;
        }

        const rows: ImportRow[] = jsonData.map((row) => ({
          civilite: row["Civilité"] || row["civilite"] || row["CIVILITE"] || "",
          nom: row["Nom"] || row["nom"] || row["NOM"] || "",
          prenoms: row["Prénoms"] || row["prenoms"] || row["PRENOMS"] || row["Prénom"] || row["prenom"] || "",
          fonction: row["Fonction"] || row["fonction"] || row["FONCTION"] || "",
          nom_entreprise: row["Entreprise"] || row["entreprise"] || row["ENTREPRISE"] || row["Nom Entreprise"] || "",
          email: row["Email"] || row["email"] || row["EMAIL"] || row["E-mail"] || "",
          telephone: row["Téléphone"] || row["telephone"] || row["TELEPHONE"] || row["Tel"] || row["Tél"] || "",
          source: row["Source d'information"] || row["Source"] || row["source"] || "",
          secteurs: row["Secteur(s) d'activité(s)"] || row["Secteurs"] || row["secteurs"] || row["Secteur"] || "",
        }));

        setParsedRows(rows);
        setStep("preview");
      } catch {
        toast.error("Erreur de lecture du fichier Excel");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const templateData = [
      {
        "Civilité": "M.",
        "Nom": "DUPONT",
        "Prénoms": "Jean",
        "Fonction": "Directeur Général",
        "Entreprise": "Société ABC",
        "Email": "jean.dupont@abc.ci",
        "Téléphone": "+225 07 00 00 00",
        "Source d'information": "Réseaux sociaux",
        "Secteur(s) d'activité(s)": "Agroalimentaire, Biens et Services",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = EXPECTED_COLUMNS.map(() => ({ wch: 25 }));
    XLSX.utils.book_append_sheet(wb, ws, "Modèle");
    XLSX.writeFile(wb, "modele-import-participants.xlsx");
  };

  const findSourceId = (sourceName: string): number | undefined => {
    if (!sourceName || !sources) return undefined;
    const found = sources.find((s) => s.nom.toLowerCase() === sourceName.trim().toLowerCase());
    return found?.id;
  };

  const findSecteurIds = (secteursStr: string): number[] => {
    if (!secteursStr || !secteurs) return [];
    const names = secteursStr.split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    return secteurs
      .filter((s) => names.includes(s.nom.toLowerCase()))
      .map((s) => s.id);
  };

  const handleImport = async () => {
    if (!selectedFormation) {
      toast.error("Veuillez sélectionner une formation");
      return;
    }

    setImporting(true);
    const importResults: ImportResult[] = [];

    for (const row of parsedRows) {
      if (!row.email || !row.nom || !row.nom_entreprise) {
        importResults.push({
          row,
          status: "error",
          message: "Champs obligatoires manquants (Nom, Entreprise, Email)",
        });
        continue;
      }

      const nomComplet = [row.civilite, row.nom, row.prenoms].filter(Boolean).join(" ").trim();
      const nomDirigeant = row.fonction ? `${nomComplet} — ${row.fonction}` : nomComplet;

      try {
        const { error } = await supabase.rpc("inscrire_participant", {
          p_formation_id: selectedFormation,
          p_nom_entreprise: row.nom_entreprise,
          p_nom_dirigeant: nomDirigeant,
          p_email: row.email.trim(),
          p_telephone: row.telephone || "",
          p_source_id: findSourceId(row.source || "") || null,
          p_secteur_ids: findSecteurIds(row.secteurs || ""),
        });

        if (error) throw error;
        importResults.push({ row, status: "success" });
      } catch (err: any) {
        importResults.push({
          row,
          status: "error",
          message: err?.message || "Erreur inconnue",
        });
      }
    }

    setResults(importResults);
    setStep("done");
    setImporting(false);

    const successCount = importResults.filter((r) => r.status === "success").length;
    const errorCount = importResults.filter((r) => r.status === "error").length;

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["admin-participants-by-formation"] });
    }

    if (errorCount === 0) {
      toast.success(`${successCount} participant(s) importé(s) avec succès`);
    } else {
      toast.warning(`${successCount} importé(s), ${errorCount} erreur(s)`);
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 shrink-0">
          <Upload className="w-4 h-4" />
          Importer Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importer des participants depuis un fichier Excel
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            {/* Formation selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Formation cible *</label>
              <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une formation..." />
                </SelectTrigger>
                <SelectContent>
                  {formations?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.titre} — {f.date_debut} ({f.statut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template download */}
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Téléchargez le modèle Excel, remplissez-le avec les données des participants, puis importez-le.
                </p>
                <p className="text-xs text-muted-foreground">
                  Colonnes attendues : {EXPECTED_COLUMNS.join(", ")}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger le modèle
                </Button>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-import"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                    disabled={!selectedFormation}
                  >
                    <Upload className="w-4 h-4" />
                    Choisir un fichier
                  </Button>
                </div>
              </div>
              {!selectedFormation && (
                <p className="text-xs text-destructive">Veuillez d'abord sélectionner une formation</p>
              )}
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong>{parsedRows.length}</strong> ligne(s) détectée(s) dans le fichier
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState}>
                  Annuler
                </Button>
                <Button onClick={handleImport} disabled={importing} className="gap-2">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? "Importation..." : `Importer ${parsedRows.length} participant(s)`}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border overflow-auto max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Civilité</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénoms</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Secteurs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => {
                    const hasRequired = row.email && row.nom && row.nom_entreprise;
                    return (
                      <TableRow key={i} className={!hasRequired ? "bg-destructive/5" : ""}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>{row.civilite}</TableCell>
                        <TableCell className="font-medium">{row.nom}</TableCell>
                        <TableCell>{row.prenoms}</TableCell>
                        <TableCell>{row.fonction}</TableCell>
                        <TableCell>{row.nom_entreprise}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.telephone}</TableCell>
                        <TableCell>{row.source}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.secteurs}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Les lignes surlignées en rouge ont des champs obligatoires manquants (Nom, Entreprise, Email) et ne seront pas importées.</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 justify-center py-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-2xl font-bold">{successCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">Importé(s)</p>
              </div>
              {errorCount > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-destructive mb-1">
                    <XCircle className="w-5 h-5" />
                    <span className="text-2xl font-bold">{errorCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Erreur(s)</p>
                </div>
              )}
            </div>

            {errorCount > 0 && (
              <div className="rounded-lg border overflow-auto max-h-[40vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Erreur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.filter((r) => r.status === "error").map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            Erreur
                          </Badge>
                        </TableCell>
                        <TableCell>{r.row.nom} {r.row.prenoms}</TableCell>
                        <TableCell>{r.row.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => { setOpen(false); resetState(); }}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportParticipantsDialog;
