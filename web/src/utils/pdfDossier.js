import { jsPDF } from 'jspdf';

const BRAND_NAME = 'MedikaSN';
const PRIMARY = [14, 90, 167];
const DARK = [10, 67, 128];
const TEAL = [15, 118, 110];
const TEXT = [22, 35, 58];
const MUTED = [86, 101, 124];
const BORDER = [223, 230, 239];
const LIGHT_BG = [246, 248, 251];

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(d);
  }
}

function formatDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(d);
  }
}

export function generateDossierPDF(data) {
  const p = data.patient;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ─── Header band ───
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setFillColor(...TEAL);
  doc.rect(0, 32, pageW, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(BRAND_NAME, margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Plateforme hospitalière — Dossier médical', margin, 22);
  doc.setFontSize(8);
  doc.text(`Exporté le ${new Date().toLocaleString('fr-FR')}`, pageW - margin, 22, { align: 'right' });

  y = 44;

  // ─── Patient info card ───
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentW, 38, 3, 3, 'F');
  doc.setDrawColor(...BORDER);
  doc.roundedRect(margin, y, contentW, 38, 3, 3, 'S');

  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${p.prenom || ''} ${p.nom || ''}`, margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const infoLines = [
    `Email: ${p.email || '—'}`,
    `Téléphone: ${p.telephone || '—'}`,
    `Date de naissance: ${formatDate(p.date_naissance)}    Sexe: ${p.sexe === 'M' ? 'Homme' : p.sexe === 'F' ? 'Femme' : p.sexe || '—'}`,
    `Groupe sanguin: ${p.groupe_sanguin || '—'}    Allergies: ${p.allergies || 'Aucune déclarée'}`,
    `Adresse: ${p.adresse || '—'}    QR: ${p.qr_code || '—'}`,
  ];
  infoLines.forEach((line, i) => {
    doc.text(line, margin + 6, y + 17 + i * 4.5);
  });

  y += 48;

  // ─── Section helper ───
  const sectionTitle = (title, count) => {
    if (y > pageH - 30) { doc.addPage(); y = margin; }
    doc.setFillColor(...DARK);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${title} (${count})`, margin + 4, y + 5.5);
    y += 14;
  };

  const entry = (date, title, detail, doctor) => {
    if (y > pageH - 20) { doc.addPage(); y = margin; }
    doc.setTextColor(...TEAL);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(formatDateTime(date), margin, y);
    doc.setTextColor(...TEXT);
    doc.setFontSize(10);
    doc.text(title, margin + 42, y);
    if (doctor) {
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text(doctor, pageW - margin, y, { align: 'right' });
    }
    y += 5;
    if (detail) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(detail, contentW - 4);
      lines.forEach((l) => {
        if (y > pageH - 20) { doc.addPage(); y = margin; }
        doc.text(l, margin + 2, y);
        y += 4.5;
      });
    }
    y += 3;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  };

  // ─── Consultations ───
  const historique = data.historique || [];
  sectionTitle('Consultations', historique.length);
  if (historique.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Aucune consultation enregistrée', margin, y);
    y += 8;
  } else {
    historique.forEach((h) => {
      const doctor = h.medecin_prenom ? `Dr. ${h.medecin_prenom} ${h.medecin_nom}` : null;
      entry(h.date_consultation, h.diagnostic || 'Consultation', h.notes, doctor);
    });
  }

  // ─── Analyses ───
  const analyses = data.analyses || [];
  sectionTitle('Analyses médicales', analyses.length);
  if (analyses.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Aucune analyse enregistrée', margin, y);
    y += 8;
  } else {
    analyses.forEach((a) => {
      entry(a.date_demande, a.type_analyse, `Statut: ${a.statut}`, null);
    });
  }

  // ─── Ordonnances ───
  const ordonnances = data.ordonnances || [];
  sectionTitle('Ordonnances', ordonnances.length);
  if (ordonnances.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Aucune ordonnance enregistrée', margin, y);
    y += 8;
  } else {
    ordonnances.forEach((o) => {
      const meds = typeof o.medicaments === 'string' ? JSON.parse(o.medicaments) : o.medicaments;
      const medNames = (meds || []).map((m) => `${m.nom}${m.dosage ? ` (${m.dosage})` : ''}`).join(', ');
      const doctor = o.medecin_prenom ? `Dr. ${o.medecin_prenom} ${o.medecin_nom}` : null;
      entry(o.date_creation, `Ordonnance — ${o.statut}`, medNames || 'Aucun médicament', doctor);
    });
  }

  // ─── Tickets ───
  const tickets = data.tickets || [];
  if (tickets.length > 0) {
    sectionTitle('Tickets', tickets.length);
    tickets.forEach((t) => {
      entry(t.created_at, `Ticket ${t.numero}`, `${t.service} — ${t.paye ? 'Payé' : 'Non payé'}`, null);
    });
  }

  // ─── Footer on each page ───
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${BRAND_NAME} — Dossier médical de ${p.prenom} ${p.nom}`, margin, pageH - 7);
    doc.text(`Page ${i}/${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  const filename = `dossier-${(p.nom || 'patient').toLowerCase()}-${(p.prenom || '').toLowerCase()}.pdf`;
  doc.save(filename);
}
