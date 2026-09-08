/**
 * Textes d'annonce — français uniquement (écran salle d'attente + TTS).
 */
const buildSenegaleseAnnouncement = ({ name, salle, medecin }) => {
  const patient = name || 'Patient';
  const room = salle || 'cabinet médical';
  const doctor = medecin ? `, ${medecin}` : '';

  const french = room.toLowerCase().startsWith('salle') || room.toLowerCase().startsWith('cabinet')
    ? `${patient}, veuillez vous présenter à la ${room}${doctor}.`
    : `${patient}, veuillez vous présenter ${room}${doctor}.`;

  return { french, speech: french, patient, room };
};

module.exports = { buildSenegaleseAnnouncement };
