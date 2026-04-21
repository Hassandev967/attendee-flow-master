import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Clock, Award, Loader2, Download, FileDown, Upload, Trash2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { downloadAttestation } from "@/components/AttestationPDF";
import { toast } from "sonner";

const Attestations = () => {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [nomDG, setNomDG] = useState("M. le Directeur Général");
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ["attestations-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .not("present", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const presents = inscriptions?.filter((i) => i.present === true) ?? [];

  const handleUploadSignature = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSignatureDataUrl(ev.target?.result as string);
      toast.success("Signature chargée avec succès");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDownloadOne = (i: typeof presents[0]) => {
    if (!signatureDataUrl) {
      setShowSignatureDialog(true);
      return;
    }
    downloadAttestation({
      nomDirigeant: i.nom_dirigeant ?? "",
      nomEntreprise: i.nom_entreprise ?? "",
      formationTitre: i.formation_titre ?? "",
      theme: i.theme ?? "",
      dateDebut: i.date_debut ?? "",
      lieu: i.lieu,
      signatureDataUrl,
      nomDG,
    });
    toast.success(`Attestation générée pour ${i.nom_dirigeant}`);
  };

  const handleDownloadAll = () => {
    if (!signatureDataUrl) {
      setShowSignatureDialog(true);
      return;
    }
    if (presents.length === 0) {
      toast.error("Aucun participant présent à certifier");
      return;
    }
    presents.forEach((i) => {
      downloadAttestation({
        nomDirigeant: i.nom_dirigeant ?? "",
        nomEntreprise: i.nom_entreprise ?? "",
        formationTitre: i.formation_titre ?? "",
        theme: i.theme ?? "",
        dateDebut: i.date_debut ?? "",
        lieu: i.lieu,
        signatureDataUrl,
        nomDG,
      });
    });
    toast.success(`${presents.length} attestation(s) générée(s)`);
  };

  return (
    <AdminLayout title="Attestations" subtitle="Générez les attestations avec signature électronique du DG">
      {/* Stats + Signature config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card text-center py-4">
          <Award className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{presents.length}</p>
          <p className="text-xs text-muted-foreground">Présences validées</p>
        </div>
        <div className="stat-card text-center py-4">
          <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{(inscriptions?.length ?? 0) - presents.length}</p>
          <p className="text-xs text-muted-foreground">Non validées</p>
        </div>

        {/* Signature card */}
        <div className="stat-card py-4 px-4 flex flex-col items-center justify-center gap-2">
          {signatureDataUrl ? (
            <>
              <img src={signatureDataUrl} alt="Signature DG" className="h-10 object-contain" />
              <p className="text-xs text-muted-foreground">Signature chargée ✓</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSignatureDataUrl(null);
                  toast.info("Signature supprimée");
                }}
                className="text-destructive text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Supprimer
              </Button>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center">Signature du DG</p>
              <Button variant="outline" size="sm" onClick={() => setShowSignatureDialog(true)}>
                Configurer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Download all button */}
      {presents.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button onClick={handleDownloadAll} className="gap-2">
            <FileDown className="w-4 h-4" />
            Télécharger toutes les attestations ({presents.length})
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="stat-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Participant</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Formation</TableHead>
                <TableHead>Thème</TableHead>
                <TableHead>Présence</TableHead>
                <TableHead className="text-right">Attestation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscriptions?.map((i) => (
                <TableRow key={i.inscription_id}>
                  <TableCell className="font-medium">{i.nom_dirigeant}</TableCell>
                  <TableCell>{i.nom_entreprise}</TableCell>
                  <TableCell className="max-w-48 truncate">{i.formation_titre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs">
                      {i.theme}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {i.present ? (
                      <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Présent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Clock className="w-3.5 h-3.5" /> Absent
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {i.present ? (
                      <Button variant="outline" size="sm" onClick={() => handleDownloadOne(i)} className="gap-1.5">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!inscriptions || inscriptions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune donnée de présence disponible.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Signature électronique du DG</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Nom du Directeur Général
              </label>
              <Input
                value={nomDG}
                onChange={(e) => setNomDG(e.target.value)}
                placeholder="Ex: M. Koné Ibrahim"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Image de la signature (PNG transparent recommandé)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadSignature}
              />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {signatureDataUrl ? (
                  <div className="space-y-2">
                    <img src={signatureDataUrl} alt="Aperçu signature" className="h-16 mx-auto object-contain" />
                    <p className="text-xs text-muted-foreground">Signature chargée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Cliquez pour importer la signature</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {signatureDataUrl ? "Changer l'image" : "Importer une image"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSignatureDialog(false)}
              disabled={!signatureDataUrl}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Attestations;
