import { jsPDF } from 'jspdf';

const BRAND_NAME = 'MedikaSN';
const PRIMARY = [14, 90, 167];
const DARK = [10, 67, 128];
const TEAL = [15, 118, 110];
const TEXT = [22, 35, 58];
const MUTED = [86, 101, 124];
const BORDER = [223, 230, 239];
const LIGHT_BG = [246, 248, 251];

const TYPE_TITLES = {
  arret_travail: "CERTIFICAT D'ARRET DE TRAVAIL",
  aptitude: "CERTIFICAT D'APTITUDE",
  consultation: 'CERTIFICAT DE CONSULTATION',
  hospitalisation: "CERTIFICAT D'HOSPITALISATION",
  deces: 'CERTIFICAT DE DECES',
  autre: 'CERTIFICAT MEDICAL',
};

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return String(d);
  }
}

export function generateCertificatPDF(c) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 35, 'F');
  doc.setFillColor(...TEAL);
  doc.rect(0, 35, pageW, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(BRAND_NAME, margin, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Plateforme hospitaliere - Document medical officiel', margin, 24);
  doc.setFontSize(8);
  doc.text(`Emis le ${new Date().toLocaleString('fr-FR')}`, pageW - margin, 24, { align: 'right' });

  y = 50;

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const title = TYPE_TITLES[c.type] || 'CERTIFICAT MEDICAL';
  doc.text(title, pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`No ${c.numero}`, pageW / 2, y, { align: 'center' });
  y += 12;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
  doc.setDrawColor(...BORDER);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, 'S');

  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${c.patient_prenom || ''} ${c.patient_nom || ''}`, margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Date de naissance: ${formatDate(c.date_naissance)}    Sexe: ${c.sexe === 'M' ? 'Masculin' : c.sexe === 'F' ? 'Feminin' : '—'}`, margin + 6, y + 18);

  y += 38;

  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Je soussigne Dr. ${c.medecin_prenom || ''} ${c.medecin_nom || ''}${c.specialite ? `, ${c.specialite}` : ''},`, margin, y);
  y += 7;
  doc.text(`certifie avoir examine ce jour ${formatDate(c.date_examen)},`, margin, y);
  y += 7;
  doc.text('le patient nomme ci-dessus, et declare ce qui suit :', margin, y);
  y += 10;

  const contenuLines = doc.splitTextToSize(c.contenu, contentW);
  contenuLines.forEach((line) => {
    if (y > pageH - 50) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 6;
  });

  if (c.type === 'arret_travail' && (c.date_debut || c.nombre_jours)) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(`Arret de travail de ${c.nombre_jours || '?'} jour(s)`, margin, y);
    y += 6;
    if (c.date_debut && c.date_fin) {
      doc.setFont('helvetica', 'normal');
      doc.text(`du ${formatDate(c.date_debut)} au ${formatDate(c.date_fin)} inclus.`, margin, y);
      y += 6;
    } else if (c.date_debut) {
      doc.setFont('helvetica', 'normal');
      doc.text(`a compter du ${formatDate(c.date_debut)}.`, margin, y);
      y += 6;
    }
  }

  if (c.conclusion) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Conclusion :', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const conclLines = doc.splitTextToSize(c.conclusion, contentW);
    conclLines.forEach((line) => {
      if (y > pageH - 40) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 6;
    });
  }

  y += 10;
  if (y > pageH - 40) { doc.addPage(); y = margin; }
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text('En foi de quoi, le present certificat est delivre pour servir et valoir ce que de droit.', margin, y);
  y += 15;

  if (y > pageH - 35) { doc.addPage(); y = margin; }
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(pageW - margin - 70, y, pageW - margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Dr. ${c.medecin_prenom || ''} ${c.medecin_nom || ''}`, pageW - margin - 35, y + 5, { align: 'center' });
  doc.text(c.lieu || 'Dakar, Senegal', pageW - margin - 35, y + 10, { align: 'center' });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${BRAND_NAME} - Certificat ${c.numero}`, margin, pageH - 7);
    doc.text(`Page ${i}/${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  doc.save(`certificat-${c.numero}.pdf`);
}
