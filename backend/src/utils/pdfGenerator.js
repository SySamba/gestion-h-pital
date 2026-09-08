const PDFDocument = require('pdfkit');

const BRAND = 'MedikaSN';
const PRIMARY = '#0E5AA7';
const DARK = '#0A4380';
const TEAL = '#0F766E';
const TEXT_COLOR = '#16233A';
const MUTED = '#56657C';
const BORDER = '#DFE6EF';
const LIGHT_BG = '#F6F8FB';

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return String(d); }
}

function formatDateTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('fr-FR'); } catch { return String(d); }
}

function formatFCFA(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
}

function addHeader(doc, subtitle) {
  doc.fillColor(PRIMARY).rect(0, 0, 595, 70, 'F');
  doc.fillColor(TEAL).rect(0, 70, 595, 4, 'F');
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text(BRAND, 40, 18);
  doc.fontSize(10).font('Helvetica').text(subtitle, 40, 38);
  doc.fontSize(8).text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 555, 38, { align: 'right' });
}

function addFooter(doc) {
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc.moveTo(40, 800).lineTo(555, 800).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.fillColor(MUTED).fontSize(7.5).font('Helvetica').text(`${BRAND} — Plateforme hospitalière`, 40, 808);
    doc.text(`Page ${i - pages.start + 1}/${pages.count}`, 555, 808, { align: 'right' });
  }
}

function generateFacturePDF(f, lignes) {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  addHeader(doc, 'Facture');

  let y = 100;
  doc.fillColor(TEXT_COLOR).fontSize(14).font('Helvetica-Bold').text(`Facture ${f.numero}`, 40, y);
  y += 20;
  doc.fontSize(10).font('Helvetica').fillColor(MUTED);
  doc.text(`Date: ${formatDate(f.date_creation)}`, 40, y);
  doc.text(`Patient: ${f.patient_nom || '—'}`, 300, y);
  y += 14;
  doc.text(`Statut: ${f.statut}`, 40, y);
  if (f.notes) { doc.text(`Notes: ${f.notes}`, 300, y); }
  y += 24;

  doc.fillColor(DARK).rect(40, y, 515, 20, 'F');
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
  doc.text('Désignation', 48, y + 6);
  doc.text('Service', 300, y + 6);
  doc.text('Montant', 470, y + 6, { align: 'right' });
  y += 26;

  lignes.forEach((l, i) => {
    if (i % 2 === 0) {
      doc.fillColor(LIGHT_BG).rect(40, y - 4, 515, 18, 'F');
    }
    doc.fillColor(TEXT_COLOR).fontSize(9.5).font('Helvetica');
    doc.text(l.libelle, 48, y);
    doc.text(l.type_service || '—', 300, y);
    doc.text(formatFCFA(l.montant), 555, y, { align: 'right' });
    y += 20;
  });

  y += 10;
  doc.moveTo(40, y).lineTo(555, y).strokeColor(BORDER).lineWidth(1).stroke();
  y += 16;

  doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_COLOR);
  doc.text('Montant total:', 350, y);
  doc.text(formatFCFA(f.montant_total), 555, y, { align: 'right' });
  y += 16;
  doc.font('Helvetica').fillColor(MUTED);
  doc.text('Montant payé:', 350, y);
  doc.text(formatFCFA(f.montant_paye), 555, y, { align: 'right' });
  y += 14;
  doc.fillColor('#dc2626');
  doc.text('Reste à payer:', 350, y);
  doc.text(formatFCFA(Number(f.montant_total) - Number(f.montant_paye)), 555, y, { align: 'right' });

  addFooter(doc);
  doc.end();
  return doc;
}

function generateOrdonnancePDF(o) {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  addHeader(doc, 'Ordonnance médicale');

  let y = 100;
  doc.fillColor(TEXT_COLOR).fontSize(14).font('Helvetica-Bold').text(`Ordonnance N°${o.id}`, 40, y);
  y += 22;
  doc.fontSize(10).font('Helvetica').fillColor(MUTED);
  doc.text(`Date: ${formatDate(o.date_creation)}`, 40, y);
  doc.text(`Patient: ${o.patient_prenom} ${o.patient_nom}`, 300, y);
  y += 14;
  doc.text(`Médecin: Dr. ${o.medecin_prenom} ${o.medecin_nom}`, 40, y);
  if (o.specialite) doc.text(`Spécialité: ${o.specialite}`, 300, y);
  y += 24;

  const meds = typeof o.medicaments === 'string' ? JSON.parse(o.medicaments) : o.medicaments;

  doc.fillColor(DARK).rect(40, y, 515, 20, 'F');
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
  doc.text('Médicament', 48, y + 6);
  doc.text('Posologie', 280, y + 6);
  doc.text('Durée', 480, y + 6);
  y += 26;

  meds.forEach((m, i) => {
    if (i % 2 === 0) doc.fillColor(LIGHT_BG).rect(40, y - 4, 515, 18, 'F');
    doc.fillColor(TEXT_COLOR).fontSize(9.5).font('Helvetica');
    doc.text(m.nom || '—', 48, y);
    doc.text(m.dosage || '—', 280, y);
    doc.text(m.duree || '—', 480, y);
    y += 20;
  });

  y += 16;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK).text('Instructions:', 40, y);
  y += 14;
  doc.font('Helvetica').fillColor(MUTED).fontSize(9.5);
  const instr = o.instructions || 'Suivre le traitement prescrit';
  doc.text(instr, 40, y, { width: 515 });

  addFooter(doc);
  doc.end();
  return doc;
}

module.exports = { generateFacturePDF, generateOrdonnancePDF };
