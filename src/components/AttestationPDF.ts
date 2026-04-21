import jsPDF from "jspdf";

interface AttestationData {
  nomDirigeant: string;
  nomEntreprise: string;
  formationTitre: string;
  theme: string;
  dateDebut: string;
  lieu: string | null;
  signatureDataUrl?: string | null;
  nomDG?: string;
}

export function generateAttestation(data: AttestationData): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(32, 95, 44);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(13, 13, w - 26, h - 26);

  // Header
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("AGENCE CÔTE D'IVOIRE EXPORT", w / 2, 30, { align: "center" });

  // Title
  doc.setFontSize(28);
  doc.setTextColor(32, 95, 44);
  doc.setFont("helvetica", "bold");
  doc.text("ATTESTATION DE PARTICIPATION", w / 2, 48, { align: "center" });

  // Decorative line
  doc.setDrawColor(207, 151, 6);
  doc.setLineWidth(1);
  doc.line(w / 2 - 60, 54, w / 2 + 60, 54);

  // Body text
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.text("Nous certifions que", w / 2, 70, { align: "center" });

  // Participant name
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(data.nomDirigeant, w / 2, 84, { align: "center" });

  // Company
  doc.setFontSize(14);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  doc.text(`Représentant : ${data.nomEntreprise}`, w / 2, 94, { align: "center" });

  // Participation text
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("a participé avec succès à la formation :", w / 2, 108, { align: "center" });

  // Formation title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(32, 95, 44);
  doc.text(`« ${data.formationTitre} »`, w / 2, 120, { align: "center" });

  // Theme
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Thème : ${data.theme}`, w / 2, 130, { align: "center" });

  // Date and location
  const dateFormatted = data.dateDebut
    ? new Date(data.dateDebut).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const lieuText = data.lieu ? ` à ${data.lieu}` : "";
  doc.text(`Le ${dateFormatted}${lieuText}`, w / 2, 140, { align: "center" });

  // Signature section
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text("Le Directeur Général", w - 70, 158, { align: "center" });

  if (data.signatureDataUrl) {
    try {
      doc.addImage(data.signatureDataUrl, "PNG", w - 95, 161, 50, 20);
    } catch {
      // fallback if image fails
    }
  }

  const dgName = data.nomDG || "Le Directeur Général";
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(dgName, w - 70, 186, { align: "center" });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("Agence Côte d'Ivoire Export — Immeuble CGRAE, Adjamé-Indénié, Abidjan", w / 2, h - 16, {
    align: "center",
  });

  return doc;
}

export function downloadAttestation(data: AttestationData) {
  const doc = generateAttestation(data);
  const fileName = `Attestation_${data.nomDirigeant.replace(/\s+/g, "_")}_${data.formationTitre.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}

export function downloadAllAttestations(
  items: AttestationData[]
) {
  items.forEach((item) => {
    downloadAttestation(item);
  });
}
