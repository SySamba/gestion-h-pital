const express = require('express');

const multer = require('multer');

const path = require('path');

const { authenticate, authorize } = require('../middleware/auth');

const { authorizePatientAccess } = require('../middleware/patientAccess');

const rateLimit = require('../middleware/rateLimit');



const authCtrl = require('../controllers/authController');

const patientCtrl = require('../controllers/patientController');

const ticketCtrl = require('../controllers/ticketController');

const queueCtrl = require('../controllers/queueController');

const rdvCtrl = require('../controllers/rdvController');

const analyseCtrl = require('../controllers/analyseController');

const ordCtrl = require('../controllers/ordonnanceController');

const pharmaCtrl = require('../controllers/pharmacieController');

const dashCtrl = require('../controllers/dashboardController');

const settingsCtrl = require('../controllers/settingsController');

const notifCtrl = require('../controllers/notificationController');

const userCtrl = require('../controllers/userController');

const paiementCtrl = require('../controllers/paiementController');

const featuresCtrl = require('../controllers/featuresController');
const receptionCtrl = require('../controllers/receptionController');
const urgenceCtrl = require('../controllers/urgenceController');
const ttsCtrl = require('../controllers/ttsController');
const salleCtrl = require('../controllers/salleController');
const guichetCtrl = require('../controllers/guichetController');
const adminCtrl = require('../controllers/adminController');
const caissierCtrl = require('../controllers/caissierController');
const certificatCtrl = require('../controllers/certificatController');
const hospitalisationCtrl = require('../controllers/hospitalisationController');
const assuranceCtrl = require('../controllers/assuranceController');



const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Trop de créations de compte. Réessayez dans une heure.",
});



const storage = multer.diskStorage({

  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),

  filename: (req, file, cb) => cb(null, `analyse-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`),

});

const ALLOWED_ANALYSE_TYPES = /jpeg|jpg|png|webp|gif|pdf/;

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (ALLOWED_ANALYSE_TYPES.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format accepté : PDF, JPG, PNG, WEBP'));
    }
  },
});

const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `import-medicaments-${Date.now()}${path.extname(file.originalname)}`),
});

const excelUpload = multer({
  storage: excelStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Format accepté : XLSX, XLS'));
    }
  },
});



// Auth

router.post('/auth/register', registerLimiter, authCtrl.register);

router.post('/auth/login', loginLimiter, authCtrl.login);

router.get('/auth/me', authenticate, authCtrl.me);



// Patients

router.get('/patients', authenticate, authorize('admin', 'medecin', 'receptionniste', 'caissier'), patientCtrl.getAll);

router.get('/patients/me', authenticate, authorize('patient'), patientCtrl.getMyProfile);
router.patch('/patients/me', authenticate, authorize('patient'), patientCtrl.updateMyProfile);
router.get('/patients/search', authenticate, authorize('receptionniste', 'admin', 'medecin'), receptionCtrl.searchPatients);
router.get('/patients/:id', authenticate, authorize('admin', 'medecin', 'receptionniste'), patientCtrl.getById);

router.get('/patients/:id/timeline', authenticate, authorizePatientAccess(['admin', 'medecin', 'receptionniste']), featuresCtrl.getTimeline);

router.get('/patients/:id/export', authenticate, authorizePatientAccess(['admin', 'medecin', 'receptionniste']), featuresCtrl.exportDossier);

router.put('/patients/:id', authenticate, authorizePatientAccess(['admin', 'medecin', 'receptionniste']), patientCtrl.update);

router.post('/patients/register', authenticate, authorize('receptionniste', 'admin'), patientCtrl.registerPatient);
router.post('/reception/consultation-express', authenticate, authorize('receptionniste', 'admin'), receptionCtrl.consultationExpress);

router.post('/patients/historique', authenticate, authorize('medecin', 'admin'), patientCtrl.addHistorique);



// Tickets & file d'attente

router.get('/tickets', authenticate, ticketCtrl.getAll);

router.get('/tickets/queue', authenticate, authorize('receptionniste', 'admin', 'medecin'), ticketCtrl.getQueue);

router.get('/tickets/queue/live', authenticate, queueCtrl.getLive);

router.get('/tickets/queue/display', queueCtrl.getDisplay);

router.get('/tickets/queue/announce-audio', ttsCtrl.getAnnounceAudio);

router.get('/tts/status', ttsCtrl.getTtsStatus);

router.get('/tickets/my-position', authenticate, authorize('patient'), queueCtrl.getMyPosition);

router.post('/tickets', authenticate, authorize('patient'), ticketCtrl.create);

router.post('/tickets/generate', authenticate, authorize('receptionniste', 'admin'), ticketCtrl.createForPatient);

router.patch('/tickets/:id', authenticate, authorize('receptionniste', 'admin', 'medecin'), ticketCtrl.updateStatus);

router.post('/tickets/queue/call-next', authenticate, authorize('medecin', 'admin', 'receptionniste'), queueCtrl.callNext);



// Paiements simulés (Mobile Money)

router.post('/paiements/simuler', authenticate, paiementCtrl.simuler);

router.post('/paiements/:id/confirmer', authenticate, paiementCtrl.confirmer);

router.get('/paiements/historique', authenticate, paiementCtrl.getHistorique);



// Rendez-vous

router.get('/medecins', authenticate, rdvCtrl.getMedecins);

router.get('/rendez-vous', authenticate, rdvCtrl.getAll);

router.get('/rendez-vous/today', authenticate, rdvCtrl.getToday);

router.get('/rendez-vous/disponibilites/:medecinId', authenticate, rdvCtrl.getDisponibilites);

router.post('/rendez-vous', authenticate, rdvCtrl.create);

router.patch('/rendez-vous/:id', authenticate, authorize('medecin', 'receptionniste', 'admin'), rdvCtrl.updateStatus);

router.post('/rendez-vous/:id/sms-rappel', authenticate, authorize('receptionniste', 'admin', 'medecin'), featuresCtrl.sendRdvSms);



// Analyses

router.get('/analyses', authenticate, analyseCtrl.getAll);

router.post('/analyses', authenticate, authorize('medecin', 'admin'), analyseCtrl.create);

router.patch('/analyses/:id', authenticate, authorize('laborantin', 'admin'), analyseCtrl.update);

router.post('/analyses/:id/upload', authenticate, authorize('laborantin', 'admin'), upload.single('file'), analyseCtrl.uploadResult);



// Alertes urgence / secours (SOS patient)

router.post('/urgence', authenticate, urgenceCtrl.create);

router.get('/urgence', authenticate, urgenceCtrl.getAll);

router.patch('/urgence/:id', authenticate, authorize('receptionniste', 'admin', 'medecin'), urgenceCtrl.updateStatus);



// Ordonnances & alertes médicales

router.get('/ordonnances', authenticate, ordCtrl.getAll);

router.post('/ordonnances', authenticate, authorize('medecin', 'admin'), ordCtrl.create);

router.patch('/ordonnances/:id/deliver', authenticate, authorize('pharmacien', 'admin'), ordCtrl.deliver);

router.post('/ordonnances/check', authenticate, authorize('medecin', 'admin'), featuresCtrl.checkPrescription);

router.get('/ordonnances/:id/pdf', authenticate, ordCtrl.getPdf);



// Pharmacie

router.get('/medicaments', authenticate, pharmaCtrl.getMedicaments);

router.post('/medicaments', authenticate, authorize('pharmacien', 'admin'), pharmaCtrl.createMedicament);

router.patch('/medicaments/:id', authenticate, authorize('pharmacien', 'admin'), pharmaCtrl.updateMedicament);

router.delete('/medicaments/:id', authenticate, authorize('pharmacien', 'admin'), pharmaCtrl.deleteMedicament);

router.patch('/medicaments/:id/stock', authenticate, authorize('pharmacien', 'admin'), pharmaCtrl.adjustStock);

router.get('/medicaments/template', authenticate, authorize('pharmacien', 'admin'), pharmaCtrl.downloadTemplate);

router.post('/medicaments/import', authenticate, authorize('pharmacien', 'admin'), excelUpload.single('file'), pharmaCtrl.importMedicaments);

router.get('/ventes', authenticate, authorize('pharmacien', 'admin'), pharmaCtrl.getVentes);

router.post('/ventes', authenticate, authorize('pharmacien', 'admin'), pharmaCtrl.createVente);



// Caisse — Caissier

router.get('/caisse/dashboard', authenticate, authorize('caissier', 'admin'), caissierCtrl.getDashboard);

router.post('/caisse/ouvrir', authenticate, authorize('caissier', 'admin'), caissierCtrl.openCaisse);

router.post('/caisse/cloturer', authenticate, authorize('caissier', 'admin'), caissierCtrl.closeCaisse);

router.get('/caisse/status', authenticate, authorize('caissier', 'admin'), caissierCtrl.getCaisseStatus);

router.post('/caisse/encaisser', authenticate, authorize('caissier', 'admin'), caissierCtrl.encaisser);

router.get('/caisse/transactions', authenticate, authorize('caissier', 'admin'), caissierCtrl.getTransactions);

router.post('/factures', authenticate, authorize('caissier', 'admin'), caissierCtrl.createFacture);

router.get('/factures', authenticate, authorize('caissier', 'admin'), caissierCtrl.getFactures);

router.get('/factures/a-recouvrer', authenticate, authorize('caissier', 'admin'), caissierCtrl.getFacturesARecouvrer);

router.get('/factures/:id', authenticate, authorize('caissier', 'admin'), caissierCtrl.getFacture);

router.get('/factures/:id/pdf', authenticate, authorize('caissier', 'admin'), caissierCtrl.getFacturePdf);

router.post('/caisse/rembourser', authenticate, authorize('caissier', 'admin'), caissierCtrl.rembourser);

router.patch('/caisse/remboursement/:id/valider', authenticate, authorize('admin'), caissierCtrl.validerRemboursement);

router.get('/caisse/search', authenticate, authorize('caissier', 'admin'), caissierCtrl.search);



// Multi-établissements

router.get('/etablissements', authenticate, featuresCtrl.getEtablissements);

router.post('/etablissements', authenticate, authorize('admin'), featuresCtrl.createEtablissement);



// SMS simulés

router.get('/sms/historique', authenticate, featuresCtrl.getSmsHistory);



// Settings & Dashboard

router.get('/settings', settingsCtrl.getSettings);

router.patch('/settings', authenticate, authorize('admin'), settingsCtrl.updateSettings);

router.get('/salles', authenticate, salleCtrl.getAll);

router.get('/salles/actives', authenticate, salleCtrl.getActive);

router.post('/salles', authenticate, authorize('admin'), salleCtrl.create);

router.patch('/salles/:id', authenticate, authorize('admin'), salleCtrl.update);

router.delete('/salles/:id', authenticate, authorize('admin'), salleCtrl.remove);

router.get('/guichets', authenticate, guichetCtrl.getAll);

router.get('/guichets/actifs', authenticate, guichetCtrl.getActive);

router.post('/guichets', authenticate, authorize('admin'), guichetCtrl.create);

router.patch('/guichets/:id', authenticate, authorize('admin'), guichetCtrl.update);

router.delete('/guichets/:id', authenticate, authorize('admin'), guichetCtrl.remove);

router.get('/admin/medecins', authenticate, authorize('admin'), adminCtrl.getMedecinsAdmin);

router.patch('/admin/medecins/:id', authenticate, authorize('admin'), adminCtrl.updateMedecin);

router.post('/admin/personnel', authenticate, authorize('admin'), adminCtrl.createStaff);

router.patch('/admin/personnel/:id', authenticate, authorize('admin'), adminCtrl.updateStaff);

router.get('/dashboard/stats', authenticate, authorize('admin', 'receptionniste', 'medecin', 'laborantin', 'pharmacien', 'caissier'), dashCtrl.getStats);

router.get('/dashboard/overview', authenticate, authorize('admin', 'receptionniste', 'medecin', 'laborantin', 'pharmacien', 'caissier'), dashCtrl.getOverview);

router.get('/search', authenticate, authorize('admin', 'receptionniste', 'medecin'), dashCtrl.search);



// Admin

router.get('/users', authenticate, authorize('admin'), userCtrl.getAll);

router.patch('/users/:id', authenticate, authorize('admin'), userCtrl.updateRole);



// Notifications

router.get('/notifications', authenticate, notifCtrl.getAll);

router.patch('/notifications/:id/read', authenticate, notifCtrl.markRead);

router.patch('/notifications/read-all', authenticate, notifCtrl.markAllRead);



// Certificats médicaux
router.get('/certificats', authenticate, certificatCtrl.getAll);
router.get('/certificats/types', authenticate, certificatCtrl.getTypes);
router.get('/certificats/:id', authenticate, certificatCtrl.getById);
router.post('/certificats', authenticate, authorize('medecin', 'admin'), certificatCtrl.create);
router.delete('/certificats/:id', authenticate, authorize('medecin', 'admin'), certificatCtrl.remove);

// Lits & hospitalisation
router.get('/lits', authenticate, hospitalisationCtrl.getLits);
router.post('/lits', authenticate, authorize('admin', 'medecin'), hospitalisationCtrl.createLit);
router.patch('/lits/:id', authenticate, authorize('admin', 'medecin'), hospitalisationCtrl.updateLit);
router.delete('/lits/:id', authenticate, authorize('admin'), hospitalisationCtrl.deleteLit);

router.get('/hospitalisations', authenticate, hospitalisationCtrl.getHospitalisations);
router.get('/hospitalisations/stats', authenticate, hospitalisationCtrl.getStats);
router.post('/hospitalisations/admettre', authenticate, authorize('medecin', 'admin', 'receptionniste'), hospitalisationCtrl.admettre);
router.patch('/hospitalisations/:id/sortie', authenticate, authorize('medecin', 'admin'), hospitalisationCtrl.sortir);

// Assurances / tiers payant
router.get('/assurances', authenticate, assuranceCtrl.getAll);
router.get('/assurances/types', authenticate, assuranceCtrl.getTypes);
router.post('/assurances', authenticate, authorize('admin'), assuranceCtrl.create);
router.patch('/assurances/:id', authenticate, authorize('admin'), assuranceCtrl.update);
router.delete('/assurances/:id', authenticate, authorize('admin'), assuranceCtrl.remove);

router.get('/patient-assurances', authenticate, assuranceCtrl.getPatientAssurances);
router.post('/patient-assurances', authenticate, authorize('admin', 'receptionniste', 'caissier'), assuranceCtrl.attachPatient);
router.delete('/patient-assurances/:id', authenticate, authorize('admin', 'receptionniste', 'caissier'), assuranceCtrl.detachPatient);

module.exports = router;

