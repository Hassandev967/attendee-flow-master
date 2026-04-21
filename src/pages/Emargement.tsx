import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Users, Loader2, QrCode, X, ScanLine, Camera } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import jsQR from "jsqr";

const Emargement = () => {
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<string>("");
  const processingRef = useRef<boolean>(false);

  const { data: formations } = useQuery({
    queryKey: ["emargement-formations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("id, titre, statut")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inscriptions, isLoading, refetch } = useQuery({
    queryKey: ["emargement-inscriptions", selectedFormation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .eq("formation_id", selectedFormation);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFormation,
  });

  const handleMarquerPresent = async (inscriptionId: string) => {
    const { error } = await supabase.from("presences").upsert({
      inscription_id: inscriptionId,
      present: true,
      enregistre_le: new Date().toISOString(),
    }, { onConflict: "inscription_id" });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return false;
    }
    refetch();
    return true;
  };

  // ✅ Traiter le QR code détecté
  const handleQRCodeDetected = useCallback(async (qrValue: string) => {
    if (processingRef.current) return;
    if (qrValue === lastScanRef.current) return;
    
    processingRef.current = true;
    lastScanRef.current = qrValue;
    
    // Arrêter le scanner
    stopStream();

    try {
      const url = new URL(qrValue);
      const parts = url.pathname.split("/");
      const presenceIndex = parts.indexOf("presence");

      if (presenceIndex === -1 || parts.length < presenceIndex + 3) {
        toast({
          title: "QR Code invalide",
          description: "Ce QR code ne correspond pas à une inscription.",
          variant: "destructive",
        });
        processingRef.current = false;
        lastScanRef.current = "";
        return;
      }

      const qrFormationId = parts[presenceIndex + 1];
      const email = decodeURIComponent(parts[presenceIndex + 2]);

      if (selectedFormation && qrFormationId !== selectedFormation) {
        toast({
          title: "Formation incorrecte",
          description: "Ce QR code appartient à une autre formation.",
          variant: "destructive",
        });
        processingRef.current = false;
        lastScanRef.current = "";
        return;
      }

      const { data: inscription, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .eq("email", email)
        .eq("formation_id", qrFormationId)
        .single();

      if (error || !inscription) {
        toast({
          title: "Participant introuvable",
          description: `Aucune inscription trouvée pour ${email}`,
          variant: "destructive",
        });
        processingRef.current = false;
        lastScanRef.current = "";
        return;
      }

      if (inscription.present) {
        toast({
          title: "⚠️ Déjà enregistré",
          description: `${inscription.nom_dirigeant} est déjà marqué présent.`,
        });
        processingRef.current = false;
        return;
      }

      const ok = await handleMarquerPresent(inscription.inscription_id as string);
      if (ok) {
        if (!selectedFormation) setSelectedFormation(qrFormationId);
        toast({
          title: "✅ Présence confirmée !",
          description: `${inscription.nom_dirigeant} — ${inscription.nom_entreprise}`,
          duration: 5000,
        });
      }
    } catch {
      toast({
        title: "QR Code invalide",
        description: "Format non reconnu.",
        variant: "destructive",
      });
      processingRef.current = false;
      lastScanRef.current = "";
    }
  }, [selectedFormation]);

  // ✅ Arrêter le stream caméra
  const stopStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScannerOpen(false);
    setScanning(false);
  }, []);

  // ✅ Boucle de scan avec jsQR
  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    // jsQR lit les pixels et détecte le QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      handleQRCodeDetected(code.data);
      return;
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  }, [handleQRCodeDetected]);

  // ✅ Démarrer la caméra
  const startScanner = async () => {
    processingRef.current = false;
    lastScanRef.current = "";
    setScannerOpen(true);
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            animFrameRef.current = requestAnimationFrame(scanLoop);
          });
        };
      }
    } catch (err: any) {
      console.error("Erreur caméra:", err);
      let msg = "Impossible d'accéder à la caméra.";
      if (err.name === "NotAllowedError") msg = "Permission caméra refusée. Autorisez dans Réglages → Safari → Caméra.";
      else if (err.name === "NotFoundError") msg = "Aucune caméra trouvée sur cet appareil.";
      toast({ title: "Erreur caméra", description: msg, variant: "destructive" });
      setScannerOpen(false);
      setScanning(false);
    }
  };

  const stopScanner = useCallback(() => {
    stopStream();
  }, [stopStream]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // ✅ Upload image QR (fallback)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        handleQRCodeDetected(code.data);
      } else {
        toast({
          title: "QR code non détecté",
          description: "Essayez avec une image plus nette ou mieux éclairée.",
          variant: "destructive",
        });
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = "";
  };

  const presents = inscriptions?.filter((i) => i.present === true).length ?? 0;
  const total = inscriptions?.length ?? 0;
  const tauxPresence = total > 0 ? Math.round((presents / total) * 100) : 0;

  return (
    <AdminLayout title="Émargement" subtitle="Suivi de présence">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-80 space-y-4">
          <div className="stat-card">
            <label className="text-sm font-medium text-foreground mb-2 block">Formation</label>
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une formation" /></SelectTrigger>
              <SelectContent>
                {formations?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.titre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Section Scanner QR */}
          <div className="stat-card space-y-3">
            <p className="text-sm font-medium text-foreground">Scanner QR code</p>
            <p className="text-xs text-muted-foreground">
              Scannez le QR code du participant pour valider sa présence automatiquement.
            </p>

            <Button
              onClick={scannerOpen ? stopScanner : startScanner}
              className="w-full gap-2"
              variant={scannerOpen ? "destructive" : "default"}
            >
              {scannerOpen ? (
                <><X className="w-4 h-4" /> Arrêter le scanner</>
              ) : (
                <><QrCode className="w-4 h-4" /> Scanner avec la caméra</>
              )}
            </Button>

            <label className="w-full cursor-pointer">
              <div className="flex items-center justify-center gap-2 w-full h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent/50 transition-colors">
                <Camera className="w-4 h-4" />
                Importer une photo du QR code
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* Vidéo scanner */}
            {scannerOpen && (
              <div className="relative rounded-lg overflow-hidden border-2 border-accent bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                  style={{ maxHeight: "300px", objectFit: "cover" }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-accent w-48 h-48 rounded-lg opacity-70" />
                </div>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                    <ScanLine className="w-3.5 h-3.5 animate-pulse" />
                    Pointez vers le QR code
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedFormation && (
            <div className="stat-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Taux de présence</p>
              <p className="text-4xl font-bold text-foreground">{tauxPresence}%</p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-3">
                <div
                  className="bg-accent h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${tauxPresence}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{presents} présents</span>
                <span>{total} inscrits</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          {!selectedFormation ? (
            <div className="stat-card text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Sélectionnez une formation pour voir les inscrits.</p>
              <p className="text-xs text-muted-foreground mt-2">
                Ou scannez directement un QR code — la formation sera détectée automatiquement.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="stat-card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Liste des inscrits
                </h3>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                  {presents}/{total}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Participant</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inscriptions?.map((i) => (
                    <TableRow key={i.inscription_id} className={i.present ? "bg-emerald-50/50" : ""}>
                      <TableCell className="font-medium">{i.nom_dirigeant}</TableCell>
                      <TableCell>{i.nom_entreprise}</TableCell>
                      <TableCell className="text-muted-foreground">{i.email}</TableCell>
                      <TableCell>
                        {i.present ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Présent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="w-3.5 h-3.5" /> En attente
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!i.present && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarquerPresent(i.inscription_id as string)}
                            className="text-xs"
                          >
                            Émarger manuellement
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {inscriptions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucun inscrit pour cette formation.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Emargement;