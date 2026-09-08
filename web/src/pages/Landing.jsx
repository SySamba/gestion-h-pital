import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { BRAND } from '../constants/branding';
import { useInView } from '../hooks/useInView';
import { Icon } from '../components/LandingIcons';
import './Landing.css';

const CONTACT = {
  email: 'contact@medikasn.sn',
  phone: '+221 33 800 00 00',
  whatsapp: '221770000000',
};

const FEATURES = [
  {
    icon: 'ticket',
    title: 'Tickets & file d\'attente',
    desc: 'Numérotation intelligente, QR code patient, affichage temps réel en salle d\'attente.',
    color: 'blue',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Accueil et file d\'attente dans une clinique',
  },
  {
    icon: 'calendar',
    title: 'Rendez-vous en ligne',
    desc: 'Calendrier médecins, confirmations et rappels automatiques.',
    color: 'green',
    image: 'https://images.unsplash.com/photo-1506784983877-45594f1dae26?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Prise de rendez-vous médical sur tablette',
  },
  {
    icon: 'folder',
    title: 'Dossier médical',
    desc: 'Historique complet, allergies, diagnostics — tout centralisé et sécurisé.',
    color: 'teal',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Dossier patient numérique',
  },
  {
    icon: 'lab',
    title: 'Laboratoire intégré',
    desc: 'Prescription analyses, résultats, validation en un clic.',
    color: 'purple',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Laboratoire médical et analyses',
  },
  {
    icon: 'pharma',
    title: 'Pharmacie',
    desc: 'Ordonnances et délivrance aux patients.',
    color: 'orange',
    image: 'https://images.unsplash.com/photo-1587854692153-c1ebf3b36eb0?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Pharmacie et médicaments',
  },
  {
    icon: 'receipt',
    title: 'Facturation automatique',
    desc: 'Chaque service consommé génère la facture du patient — aucune saisie manuelle.',
    color: 'gold',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Facturation en établissement de santé',
  },
  {
    icon: 'wallet',
    title: 'Caisse & encaissements',
    desc: 'Espèces, Wave, Orange Money, carte. Sessions de caisse et écarts justifiés.',
    color: 'green',
    image: 'https://images.unsplash.com/photo-1565514020179-26527eeb3b92?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Encaissement en caisse et paiement électronique',
  },
  {
    icon: 'bell',
    title: 'Notifications & urgences',
    desc: 'Rappels de rendez-vous, appel en salle, alertes urgence vers l\u2019équipe médicale.',
    color: 'purple',
    image: 'https://images.unsplash.com/photo-1576091160544-0fa5f2e9c1c9?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Alertes et notifications hospitalières',
  },
  {
    icon: 'chart',
    title: 'Pilotage & rapports',
    desc: 'Tableaux de bord, recettes par service et par caissier, journal d\u2019audit complet.',
    color: 'blue',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Tableau de bord et statistiques',
  },
  {
    icon: 'folder',
    title: 'Certificats médicaux',
    desc: 'Arrêt de travail, aptitude, hospitalisation — génération PDF officielle en un clic.',
    color: 'teal',
    image: 'https://images.unsplash.com/photo-1631817944613-24f5e2589a68?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Certificat médical et documents de santé',
  },
  {
    icon: 'ticket',
    title: 'Hospitalisation & lits',
    desc: 'Gestion des lits par salle, admissions, sorties, suivi des disponibilités en temps réel.',
    color: 'orange',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Chambre d\u2019hospitalisation et lit médicalisé',
  },
  {
    icon: 'wallet',
    title: 'Assurances & tiers payant',
    desc: 'Rattachement patients aux organismes, taux de couverture, gestion IPM et CNSS.',
    color: 'green',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&h=520&q=80',
    alt: 'Assurance santé et gestion des dossiers',
  },
];

const ROLES = [
  {
    id: 'patient',
    name: 'Patient',
    icon: 'user',
    color: 'blue',
    tagline: 'Autonome, informé, sans file d\u2019attente inutile',
    summary:
      'Le patient dispose de son propre espace : il prend rendez-vous, suit sa position dans la file, consulte ses résultats et télécharge son dossier médical.',
    groups: [
      {
        label: 'Rendez-vous & file d\u2019attente',
        items: [
          'Prise de rendez-vous en ligne selon les disponibilités réelles du médecin',
          'Achat de ticket et suivi de sa position dans la file en temps réel',
          'Notifications automatiques : confirmation, rappel, appel en salle',
        ],
      },
      {
        label: 'Dossier médical',
        items: [
          'Consultation de son historique : diagnostics, consultations, allergies',
          'Résultats d\u2019analyses disponibles dès leur validation par le laboratoire',
          'Téléchargement du dossier médical complet au format PDF',
        ],
      },
      {
        label: 'Paiements',
        items: [
          'Paiement par mobile money : Wave, Orange Money, Free Money',
          'Historique des paiements et reçus téléchargeables',
        ],
      },
    ],
  },
  {
    id: 'receptionniste',
    name: 'Réceptionniste',
    icon: 'headset',
    color: 'green',
    tagline: 'L\u2019accueil maîtrisé, sans papier ni attente',
    summary:
      'Point d\u2019entrée de l\u2019établissement : enregistrement des patients, distribution des tickets, gestion de la file et orientation vers les services.',
    groups: [
      {
        label: 'Accueil patient',
        items: [
          'Enregistrement d\u2019un nouveau patient en moins d\u2019une minute',
          'Création automatique du compte de connexion et du QR code patient',
          'Recherche instantanée d\u2019un patient par nom, téléphone ou QR code',
        ],
      },
      {
        label: 'File d\u2019attente',
        items: [
          'Génération de tickets numérotés avec niveau de priorité',
          'Appel du patient suivant avec affichage et annonce vocale en salle',
          'Attribution des salles de consultation et suivi des temps d\u2019attente',
        ],
      },
      {
        label: 'Organisation',
        items: [
          'Planification et confirmation des rendez-vous',
          'Envoi de rappels SMS aux patients',
          'Consultation express : enregistrement et ticket en une seule opération',
          'Déclenchement d\u2019alertes urgence vers l\u2019équipe médicale',
        ],
      },
    ],
  },
  {
    id: 'medecin',
    name: 'Médecin',
    icon: 'stethoscope',
    color: 'teal',
    tagline: 'Le dossier complet, à portée de main',
    summary:
      'Le praticien accède à l\u2019historique complet du patient, saisit sa consultation, prescrit analyses et traitements — tout est relié au dossier.',
    groups: [
      {
        label: 'Consultation',
        items: [
          'Chronologie médicale unifiée : consultations, analyses, ordonnances',
          'Saisie du diagnostic et des notes cliniques',
          'Accès aux allergies et au groupe sanguin avant toute prescription',
        ],
      },
      {
        label: 'Prescriptions',
        items: [
          'Prescription d\u2019analyses de laboratoire transmises instantanément',
          'Rédaction d\u2019ordonnances avec dosage et durée du traitement',
          'Contrôle automatique des interactions et allergies déclarées',
        ],
      },
      {
        label: 'Agenda & suivi',
        items: [
          'Agenda personnel avec rendez-vous du jour',
          'Gestion de ses créneaux de disponibilité',
          'File d\u2019attente de ses patients et appel depuis son poste',
          'Réception des alertes urgence en temps réel',
        ],
      },
    ],
  },
  {
    id: 'laborantin',
    name: 'Laborantin',
    icon: 'flask',
    color: 'purple',
    tagline: 'Des analyses tracées de la demande au résultat',
    summary:
      'Le laboratoire reçoit les demandes d\u2019analyses directement du médecin, saisit les résultats et les publie automatiquement au patient.',
    groups: [
      {
        label: 'Gestion des demandes',
        items: [
          'Liste des analyses à traiter, triées par priorité et ancienneté',
          'Suivi des statuts : demandée, en cours, terminée',
          'Identification du patient et du médecin prescripteur',
        ],
      },
      {
        label: 'Résultats',
        items: [
          'Saisie des résultats sous forme de texte structuré',
          'Import de documents : PDF de laboratoire, images, radiographies',
          'Publication automatique au patient et au médecin prescripteur',
        ],
      },
      {
        label: 'Traçabilité',
        items: [
          'Historique complet de chaque analyse avec dates et intervenants',
          'Recherche par patient, type d\u2019analyse ou période',
        ],
      },
    ],
  },
  {
    id: 'pharmacien',
    name: 'Pharmacien',
    icon: 'pill',
    color: 'orange',
    tagline: 'Stock maîtrisé, ordonnances délivrées sans erreur',
    summary:
      'La pharmacie reçoit les ordonnances électroniques, délivre les traitements et pilote son stock avec alertes de réapprovisionnement.',
    groups: [
      {
        label: 'Ordonnances',
        items: [
          'Réception des ordonnances électroniques émises par les médecins',
          'Délivrance tracée avec mise à jour automatique du stock',
          'Historique des délivrances par patient',
        ],
      },
      {
        label: 'Stock & produits',
        items: [
          'Catalogue produits : création, modification, suppression',
          'Ajustement des quantités et inventaire',
          'Seuils d\u2019alerte et signalement des ruptures imminentes',
          'Import en masse depuis un fichier Excel (modèle fourni)',
        ],
      },
      {
        label: 'Ventes',
        items: [
          'Enregistrement des ventes avec calcul automatique en FCFA',
          'Historique et rapports d\u2019activité de la pharmacie',
        ],
      },
    ],
  },
  {
    id: 'caissier',
    name: 'Caissier',
    icon: 'wallet',
    color: 'gold',
    tagline: 'Les recettes encaissées, contrôlées, justifiées',
    summary:
      'La caisse voit automatiquement ce que chaque patient doit : les services consommés génèrent la facture, le caissier encaisse et justifie sa caisse.',
    badge: 'Nouveau',
    groups: [
      {
        label: 'Facturation automatique',
        items: [
          'Les consultations et analyses génèrent la facture sans saisie manuelle',
          'Regroupement des services d\u2019une même journée sur une facture unique',
          'Tableau « À recouvrer » : qui doit payer, combien, pour quels services',
        ],
      },
      {
        label: 'Encaissements',
        items: [
          'Modes de paiement : espèces, Wave, Orange Money, Free Money, carte',
          'Paiements partiels avec suivi automatique du reste à payer',
          'Génération de reçus et de factures imprimables',
        ],
      },
      {
        label: 'Session de caisse',
        items: [
          'Ouverture de caisse avec déclaration du fonds initial',
          'Clôture avec comptage réel et calcul automatique de l\u2019écart',
          'Répartition des recettes par mode de paiement',
        ],
      },
      {
        label: 'Remboursements & contrôle',
        items: [
          'Remboursement motivé avec conservation de l\u2019historique',
          'Validation administrateur obligatoire au-delà d\u2019un seuil défini',
          'Recherche unifiée : patients, factures, transactions',
        ],
      },
    ],
  },
  {
    id: 'admin',
    name: 'Administrateur',
    icon: 'shieldCheck',
    color: 'navy',
    tagline: 'Le pilotage complet de l\u2019établissement',
    summary:
      'La direction supervise l\u2019ensemble des services, gère les comptes et les tarifs, et suit l\u2019activité comme les recettes en temps réel.',
    groups: [
      {
        label: 'Pilotage',
        items: [
          'Tableau de bord consolidé : patients, consultations, recettes',
          'Rapports d\u2019activité par service et par période',
          'Suivi des recettes par mode de paiement et par caissier',
        ],
      },
      {
        label: 'Comptes & droits',
        items: [
          'Création des comptes du personnel avec attribution des rôles',
          'Activation et désactivation des accès',
          'Cloisonnement strict : chaque rôle ne voit que son périmètre',
        ],
      },
      {
        label: 'Paramétrage',
        items: [
          'Identité de l\u2019établissement, tarifs et durée de validité des tickets',
          'Gestion multi-établissements pour les groupes',
          'Validation des opérations sensibles (remboursements)',
        ],
      },
      {
        label: 'Sécurité & conformité',
        items: [
          'Journal d\u2019audit de toutes les actions sensibles',
          'Sauvegardes automatiques et export intégral des données',
        ],
      },
    ],
  },
];

function RolesSection() {
  const [active, setActive] = useState(ROLES[0].id);
  const [ref, visible] = useInView(0.08);
  const role = ROLES.find((r) => r.id === active) || ROLES[0];

  return (
    <section id="roles" className="roles-section">
      <div className="landing-container">
        <div className="section-head">
          <span className="section-label">Rôles métier</span>
          <h2>Un écran pensé pour chaque métier</h2>
          <p>
            Sept profils, sept périmètres cloisonnés. Chacun voit exactement ce dont il a
            besoin — ni plus, ni moins.
          </p>
        </div>

        <div ref={ref} className={`roles-wrap ${visible ? 'is-visible' : ''}`}>
          <div className="roles-tabs" role="tablist" aria-label="Rôles métier">
            {ROLES.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                id={`role-tab-${r.id}`}
                aria-selected={active === r.id}
                aria-controls={`role-panel-${r.id}`}
                className={`role-tab role-tab-${r.color} ${active === r.id ? 'is-active' : ''}`}
                style={{ '--delay': `${i * 0.05}s` }}
                onClick={() => setActive(r.id)}
              >
                <span className="role-tab-icon">
                  <Icon name={r.icon} size={22} />
                </span>
                <span className="role-tab-text">
                  <strong>{r.name}</strong>
                  <small>{r.tagline}</small>
                </span>
                {r.badge && <span className="role-tab-badge">{r.badge}</span>}
              </button>
            ))}
          </div>

          <div
            className={`role-panel role-panel-${role.color}`}
            role="tabpanel"
            id={`role-panel-${role.id}`}
            aria-labelledby={`role-tab-${role.id}`}
            key={role.id}
          >
            <div className="role-panel-head">
              <span className="role-panel-icon">
                <Icon name={role.icon} size={30} />
              </span>
              <div>
                <h3>
                  {role.name}
                  {role.badge && <span className="role-panel-badge">{role.badge}</span>}
                </h3>
                <p>{role.summary}</p>
              </div>
            </div>

            <div className="role-groups">
              {role.groups.map((g, gi) => (
                <div key={g.label} className="role-group" style={{ '--delay': `${gi * 0.07}s` }}>
                  <h4>
                    <span className="role-group-dot" aria-hidden="true" />
                    {g.label}
                  </h4>
                  <ul>
                    {g.items.map((item) => (
                      <li key={item}>
                        <Icon name="check" size={15} strokeWidth={2.5} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="roles-flow">
          <p className="roles-flow-title">Un parcours continu, sans rupture d&apos;information</p>
          <div className="roles-flow-steps">
            {[
              { icon: 'headset', label: 'Réception' },
              { icon: 'stethoscope', label: 'Service médical' },
              { icon: 'receipt', label: 'Facturation auto' },
              { icon: 'wallet', label: 'Caisse' },
              { icon: 'chart', label: 'Rapport financier' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <div className="roles-flow-step" style={{ '--delay': `${i * 0.08}s` }}>
                  <span className="roles-flow-icon"><Icon name={s.icon} size={20} /></span>
                  <span>{s.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="roles-flow-arrow" aria-hidden="true">
                    <Icon name="arrowRight" size={16} />
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureImage({ src, alt, color, icon }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`feature-image-fallback feature-fallback-${color}`} aria-hidden="true">
        <FeatureIcon type={icon} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

const STEPS = [
  { n: '01', title: 'Accueil du patient', desc: 'Enregistrement, ticket ou rendez-vous en quelques secondes.' },
  { n: '02', title: 'Parcours médical', desc: 'Consultation, analyses et ordonnances rattachées au dossier.' },
  { n: '03', title: 'Facturation automatique', desc: 'Chaque service consommé alimente la facture du patient.' },
  { n: '04', title: 'Encaissement en caisse', desc: 'Le caissier voit la dette, encaisse et remet le reçu.' },
  { n: '05', title: 'Pilotage direction', desc: 'Recettes, activité et audit consolidés en temps réel.' },
];

const METRICS = [
  { id: 'roles', end: 7, suffix: '', label: 'Rôles métier', sub: 'De la réception à la direction', icon: 'users' },
  { id: 'modules', end: 14, suffix: '+', label: 'Modules intégrés', sub: 'Une seule plateforme', icon: 'layers' },
  { id: 'deploy', end: 48, suffix: 'h', label: 'Mise en service', sub: 'Paramétrage et comptes inclus', icon: 'clock' },
  { id: 'fcfa', display: 'FCFA', label: 'Monnaie locale', sub: 'Tarifs et reçus en FCFA', icon: 'wallet' },
];

const WHY_ITEMS = [
  'Interface en français, prise en main d\u2019un poste en moins d\u2019une heure',
  'Déploiement possible sur serveur local — indépendant d\u2019Internet',
  '7 rôles cloisonnés : la réception ne voit pas l\u2019écran du laboratoire',
  'Facturation automatique : les services génèrent la dette, la caisse encaisse',
  'Vos données vous appartiennent — export intégral à tout moment',
  'Hébergement au choix : dans votre établissement ou en ligne',
];

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    target: 'Cabinets et centres de santé',
    price: '45 000',
    period: 'FCFA / mois',
    setup: 'Installation : 150 000 FCFA',
    features: [
      'Jusqu\u2019à 5 utilisateurs',
      'Accueil, tickets et file d\u2019attente',
      'Dossier patient et consultations',
      'Rendez-vous et rappels',
      'Facturation automatique et caisse',
      'Support téléphonique aux heures ouvrables',
    ],
  },
  {
    id: 'clinique',
    name: 'Clinique',
    target: 'Cliniques privées pluridisciplinaires',
    price: '120 000',
    period: 'FCFA / mois',
    setup: 'Installation : 350 000 FCFA',
    highlight: true,
    badge: 'Le plus demandé',
    features: [
      'Jusqu\u2019à 25 utilisateurs',
      'Laboratoire et pharmacie intégrés',
      'Caisse complète : sessions, remboursements, écarts',
      'Certificats médicaux et génération PDF',
      'Hospitalisation et gestion des lits',
      'Écran d\u2019appel en salle d\u2019attente',
      'Tableaux de bord et rapports direction',
      'Accès multi-postes simultanés illimités',
      'Formation sur site (une journée)',
    ],
  },
  {
    id: 'hopital',
    name: 'Hôpital',
    target: 'Hôpitaux et groupes multi-sites',
    price: 'Sur devis',
    period: 'après étude de vos flux',
    setup: 'Audit de vos processus inclus',
    features: [
      'Utilisateurs illimités',
      'Gestion multi-établissements',
      'Assurances et tiers payant (IPM, CNSS)',
      'Hébergement sur votre propre serveur',
      'Interconnexion avec vos outils existants',
      'Interlocuteur dédié et astreinte',
      'Reprise de vos données existantes',
    ],
  },
];

function AnimatedNumber({ end, suffix = '', prefix = '', active, duration = 1400 }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setN(Math.round(eased * end));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, end, duration]);

  return (
    <span className="metric-value-animated">
      {prefix}{active ? n : 0}{suffix}
    </span>
  );
}

function MetricCard({ metric, index }) {
  const [ref, visible] = useInView(0.2);

  return (
    <div
      ref={ref}
      className={`metric-item ${visible ? 'is-visible' : ''}`}
      style={{ '--delay': `${index * 0.12}s` }}
    >
      <div className="metric-icon-ring">
        <Icon name={metric.icon} size={26} className="metric-icon" />
      </div>
      <strong>
        {metric.display ? (
          <span className={`metric-text-reveal ${visible ? 'show' : ''}`}>{metric.display}</span>
        ) : (
          <AnimatedNumber end={metric.end} suffix={metric.suffix} active={visible} />
        )}
      </strong>
      <span className="metric-label">{metric.label}</span>
      <span className="metric-sub">{metric.sub}</span>
      <div className="metric-line" aria-hidden="true" />
    </div>
  );
}

function WhyContent({ children }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div ref={ref} className={`why-content ${visible ? 'is-visible' : ''}`}>
      {children}
    </div>
  );
}

function WhyBenefits() {
  const [ref, visible] = useInView(0.12);

  return (
    <ul ref={ref} className={`why-list ${visible ? 'is-visible' : ''}`}>
      {WHY_ITEMS.map((item, i) => (
        <li key={item} style={{ '--i': i }}>
          <span className="why-check">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function WhyStatsPanel() {
  const [ref, visible] = useInView(0.15);

  return (
    <div ref={ref} className={`why-cards ${visible ? 'is-visible' : ''}`}>
      <div className="why-stat-card why-stat-primary" style={{ '--delay': '0s' }}>
        <span className="why-stat-icon"><Icon name="clock" size={22} /></span>
        <span className="why-stat-num">
          <AnimatedNumber end={40} prefix="+" suffix="%" active={visible} duration={1600} />
        </span>
        <span className="why-stat-label">Temps gagné à l&apos;accueil</span>
      </div>
      <div className="why-stat-card why-stat-accent" style={{ '--delay': '0.1s' }}>
        <span className="why-stat-icon"><Icon name="fileText" size={22} /></span>
        <span className="why-stat-num">
          <AnimatedNumber end={0} active={visible} duration={800} />
        </span>
        <span className="why-stat-label">Dossier papier perdu</span>
      </div>
      <div className="included-card" style={{ '--delay': '0.2s' }}>
        <h4>Inclus dès l&apos;installation</h4>
        <ul>
          <li><Icon name="database" size={18} /><span>Reprise de votre liste de patients</span></li>
          <li><Icon name="headset" size={18} /><span>Formation de votre équipe</span></li>
          <li><Icon name="shieldCheck" size={18} /><span>Sauvegardes automatiques</span></li>
          <li><Icon name="phone" size={18} /><span>Assistance à la prise en main</span></li>
        </ul>
      </div>
    </div>
  );
}

function FeatureIcon({ type }) {
  const icons = {
    ticket: <path d="M4 8h16v3H4V8zm0 5h10v3H4v-3zm14-10H6a2 2 0 00-2 2v14l4-3 4 3 4-3 4 3V5a2 2 0 00-2-2z" fill="currentColor" />,
    calendar: <path d="M7 2v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm12 8H5v10h14V10z" fill="currentColor" />,
    folder: <path d="M4 6h6l2 2h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" fill="currentColor" />,
    lab: <path d="M9 2v2H7v3l4 8v7h2v-7l4-8V4h-2V2H9zm1 5h4l-2 4-2-4z" fill="currentColor" />,
    pharma: <path d="M10 2v6H6v4h4v10h4V12h4V8h-4V2h-4z" fill="currentColor" />,
    chart: <path d="M4 18h16v2H4v-2zm3-4h2v3H7v-3zm4-6h2v9h-2V8zm4 3h2v6h-2v-6z" fill="currentColor" />,
    receipt: <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zm3 5v2h6V7H9zm0 4v2h6v-2H9z" fill="currentColor" />,
    wallet: <path d="M4 6h14a2 2 0 012 2v1h-6a3 3 0 000 6h6v1a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm10 5h8v2h-8a1 1 0 010-2z" fill="currentColor" />,
    bell: <path d="M12 2a6 6 0 00-6 6c0 4-2 6-2 6h16s-2-2-2-6a6 6 0 00-6-6zm-2 16a2 2 0 004 0h-4z" fill="currentColor" />,
  };
  return (
    <svg className="feature-svg" viewBox="0 0 24 24" aria-hidden="true">
      {icons[type]}
    </svg>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Faut-il installer un logiciel sur chaque ordinateur ?',
    a: 'Non. La plateforme est entièrement web : vos agents ouvrent simplement leur navigateur (Chrome, Edge, Firefox ou Safari) et se connectent avec leurs identifiants. Aucune installation, aucune mise à jour à faire poste par poste.',
  },
  {
    q: 'Que se passe-t-il en cas de coupure d\u2019Internet ?',
    a: 'La plateforme peut être installée sur un serveur au sein de votre établissement. Dans ce cas, elle continue de fonctionner normalement sur votre réseau local, même sans connexion Internet. Seules les notifications SMS nécessitent le réseau.',
  },
  {
    q: 'Comment la facturation est-elle générée ?',
    a: 'Automatiquement. Dès qu\u2019un patient reçoit un ticket de consultation ou qu\u2019un médecin prescrit une analyse, la ligne correspondante est ajoutée à sa facture du jour. Le caissier voit directement le montant à recouvrer, sans aucune ressaisie.',
  },
  {
    q: 'Nos données médicales sont-elles protégées ?',
    a: 'Les mots de passe sont chiffrés, les accès contrôlés par jeton sécurisé et chaque rôle ne voit que son périmètre : la réception n\u2019accède pas aux résultats du laboratoire. Toutes les actions sensibles sont enregistrées dans un journal d\u2019audit.',
  },
  {
    q: 'Pouvons-nous récupérer nos données si nous changeons d\u2019outil ?',
    a: 'Oui, sans condition. Vos données vous appartiennent : un export intégral est disponible à tout moment depuis l\u2019espace administrateur. Aucun verrouillage contractuel ni technique.',
  },
  {
    q: 'Combien de temps prend la mise en service ?',
    a: '48 heures en moyenne : paramétrage de votre établissement, création des comptes de votre équipe, reprise de votre liste de patients existante et formation incluse.',
  },
  {
    q: 'Que comprend exactement l\u2019abonnement mensuel ?',
    a: 'L\u2019accès à tous les modules de votre formule, les mises à jour, les sauvegardes automatiques et l\u2019assistance téléphonique. Aucun frais caché : seuls les frais d\u2019installation initiaux s\u2019ajoutent la première fois.',
  },
];

function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="faq-section">
      <div className="landing-container">
        <div className="section-head">
          <span className="section-label">Questions fréquentes</span>
          <h2>Ce que les directions nous demandent</h2>
          <p>
            Les réponses aux interrogations les plus courantes avant de digitaliser un
            établissement de santé.
          </p>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <h3 className="faq-heading">
                  <button
                    type="button"
                    className="faq-question"
                    id={`faq-btn-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{item.q}</span>
                    <Icon name="chevronDown" size={20} className="faq-chevron" />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  className="faq-answer"
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                >
                  <div className="faq-answer-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TRUST_POINTS = [
  { icon: 'lock', title: 'Mots de passe chiffrés', desc: 'Aucun mot de passe stocké en clair' },
  { icon: 'shieldCheck', title: 'Accès cloisonnés', desc: 'Chaque rôle limité à son périmètre' },
  { icon: 'fileText', title: 'Journal d\u2019audit', desc: 'Toute action sensible est tracée' },
  { icon: 'database', title: 'Sauvegardes automatiques', desc: 'Vos données protégées quotidiennement' },
];

function SecuritySection() {
  const [ref, visible] = useInView(0.12);

  return (
    <section id="securite" className="security-section">
      <div className="landing-container">
        <div className="section-head">
          <span className="section-label">Sécurité & confiance</span>
          <h2>Des données médicales traitées avec rigueur</h2>
          <p>
            Le dossier médical est une donnée sensible. La plateforme applique les principes
            de base d&apos;une gestion sérieuse, sans compromis.
          </p>
        </div>
        <div ref={ref} className={`security-grid ${visible ? 'is-visible' : ''}`}>
          {TRUST_POINTS.map((t, i) => (
            <div key={t.title} className="security-card" style={{ '--delay': `${i * 0.08}s` }}>
              <span className="security-icon">
                <Icon name={t.icon} size={24} />
              </span>
              <strong>{t.title}</strong>
              <span>{t.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="cta-band">
      <div className="landing-container cta-band-inner">
        <div>
          <h2>Prêt à voir la plateforme sur vos propres flux ?</h2>
          <p>
            Une démonstration de 30 minutes suffit pour évaluer si la solution correspond à
            votre établissement. Sans engagement.
          </p>
        </div>
        <div className="cta-band-actions">
          <a href="#demo" className="btn btn-lg cta-band-primary">
            Demander une démonstration
            <Icon name="arrowRight" size={18} />
          </a>
          <a href="#tarifs" className="btn btn-lg cta-band-ghost">Consulter les tarifs</a>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [ref, visible] = useInView(0.1);

  return (
    <section id="tarifs" className="pricing-section">
      <div className="landing-container">
        <div className="section-head">
          <span className="section-label">Tarifs</span>
          <h2>Des formules claires, en FCFA</h2>
          <p>
            Abonnement mensuel sans engagement de durée. Mises à jour, sauvegardes et
            assistance comprises.
          </p>
        </div>
        <div ref={ref} className={`pricing-grid ${visible ? 'is-visible' : ''}`}>
          {PLANS.map((plan, i) => (
            <article
              key={plan.id}
              className={`plan-card ${plan.highlight ? 'plan-highlight' : ''}`}
              style={{ '--delay': `${i * 0.1}s` }}
            >
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <h3>{plan.name}</h3>
              <p className="plan-target">{plan.target}</p>
              <div className="plan-price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
              <p className="plan-setup">{plan.setup}</p>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <Icon name="check" size={16} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#demo"
                className={`btn btn-lg plan-cta ${plan.highlight ? 'btn-primary' : 'btn-outline'}`}
              >
                {plan.price === 'Sur devis' ? 'Demander un devis' : 'Demander une démonstration'}
              </a>
            </article>
          ))}
        </div>
        <p className="pricing-note">
          <Icon name="spark" size={16} />
          Structures publiques, mutuelles de santé et groupements : tarifs adaptés sur demande.
        </p>
      </div>
    </section>
  );
}

const TEAM_SIZES = [
  '1 à 5 praticiens',
  '6 à 15 praticiens',
  '16 à 40 praticiens',
  'Plus de 40 praticiens',
];

function DemoSection({ contactEmail, contactPhone }) {
  const [form, setForm] = useState({
    etablissement: '',
    nom: '',
    fonction: '',
    telephone: '',
    email: '',
    taille: TEAM_SIZES[0],
    message: '',
  });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.etablissement.trim() || !form.nom.trim() || !form.telephone.trim()) {
      setError('Renseignez au minimum l\u2019établissement, votre nom et un numéro de téléphone.');
      return;
    }
    setError('');

    const body = [
      `Établissement : ${form.etablissement}`,
      `Contact : ${form.nom}${form.fonction ? ` — ${form.fonction}` : ''}`,
      `Téléphone : ${form.telephone}`,
      form.email ? `Email : ${form.email}` : null,
      `Taille : ${form.taille}`,
      '',
      form.message || 'Souhaite une démonstration de la plateforme.',
    ]
      .filter(Boolean)
      .join('\n');

    const subject = `Demande de démonstration — ${form.etablissement}`;
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <section id="demo" className="demo-section">
      <div className="landing-container demo-grid">
        <div className="demo-intro">
          <span className="section-label">Prendre contact</span>
          <h2>Voyons la plateforme sur vos propres flux</h2>
          <p>
            Décrivez votre établissement en une minute. Nous vous rappelons pour organiser
            une présentation de 30 minutes, sur site ou à distance.
          </p>
          <ol className="demo-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Vous nous écrivez</strong>
                <small>Le formulaire ci-contre suffit</small>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Nous vous rappelons</strong>
                <small>Sous 24 heures ouvrées</small>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Démonstration</strong>
                <small>30 minutes, avec vos services</small>
              </div>
            </li>
          </ol>
          <div className="demo-channels">
            <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="demo-channel">
              <Icon name="phone" size={20} />
              <div>
                <small>Téléphone</small>
                <strong>{contactPhone}</strong>
              </div>
            </a>
            <a href={`mailto:${contactEmail}`} className="demo-channel">
              <Icon name="mail" size={20} />
              <div>
                <small>Email</small>
                <strong>{contactEmail}</strong>
              </div>
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="demo-channel"
            >
              <Icon name="chat" size={20} />
              <div>
                <small>WhatsApp</small>
                <strong>Discuter maintenant</strong>
              </div>
            </a>
          </div>
        </div>

        <div className="demo-form-card">
          {sent ? (
            <div className="demo-sent" role="status">
              <span className="demo-sent-icon">
                <Icon name="check" size={28} strokeWidth={2.25} />
              </span>
              <h3>Votre demande est prête</h3>
              <p>
                Votre logiciel de messagerie s&apos;est ouvert avec le message prérempli.
                Si rien ne s&apos;est passé, écrivez-nous à{' '}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a> ou appelez le {contactPhone}.
              </p>
              <button type="button" className="btn btn-outline" onClick={() => setSent(false)}>
                Modifier ma demande
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h3>Parlez-nous de votre établissement</h3>
              <div className="demo-fields">
                <div className="demo-field demo-field-full">
                  <label htmlFor="demo-etablissement">Nom de l&apos;établissement *</label>
                  <input
                    id="demo-etablissement"
                    className="input"
                    value={form.etablissement}
                    onChange={update('etablissement')}
                    placeholder="Clinique du Plateau"
                    autoComplete="organization"
                  />
                </div>
                <div className="demo-field">
                  <label htmlFor="demo-nom">Votre nom *</label>
                  <input
                    id="demo-nom"
                    className="input"
                    value={form.nom}
                    onChange={update('nom')}
                    placeholder="Aminata Diop"
                    autoComplete="name"
                  />
                </div>
                <div className="demo-field">
                  <label htmlFor="demo-fonction">Votre fonction</label>
                  <input
                    id="demo-fonction"
                    className="input"
                    value={form.fonction}
                    onChange={update('fonction')}
                    placeholder="Directrice administrative"
                    autoComplete="organization-title"
                  />
                </div>
                <div className="demo-field">
                  <label htmlFor="demo-telephone">Téléphone *</label>
                  <input
                    id="demo-telephone"
                    className="input"
                    type="tel"
                    value={form.telephone}
                    onChange={update('telephone')}
                    placeholder="+221 77 000 00 00"
                    autoComplete="tel"
                  />
                </div>
                <div className="demo-field">
                  <label htmlFor="demo-email">Email</label>
                  <input
                    id="demo-email"
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="direction@clinique.sn"
                    autoComplete="email"
                  />
                </div>
                <div className="demo-field demo-field-full">
                  <label htmlFor="demo-taille">Nombre de praticiens</label>
                  <select
                    id="demo-taille"
                    className="input"
                    value={form.taille}
                    onChange={update('taille')}
                  >
                    {TEAM_SIZES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="demo-field demo-field-full">
                  <label htmlFor="demo-message">Votre besoin principal</label>
                  <textarea
                    id="demo-message"
                    className="input"
                    rows={4}
                    value={form.message}
                    onChange={update('message')}
                    placeholder="Files d'attente, dossiers patients, suivi des recettes…"
                  />
                </div>
              </div>
              {error && <p className="demo-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary btn-lg demo-submit">
                <Icon name="send" size={18} />
                Envoyer ma demande
              </button>
              <p className="demo-legal">
                Vos coordonnées servent uniquement à vous recontacter. Aucune donnée de
                patient n&apos;est demandée à cette étape.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [settings, setSettings] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    api.getSettings().then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const name = settings?.nom || BRAND.name;
  const contactEmail = settings?.email || CONTACT.email;
  const contactPhone = settings?.telephone || CONTACT.phone;

  return (
    <>
      <header className="landing-nav" role="banner">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <div className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect width="24" height="24" rx="6" fill="currentColor" opacity="0" />
                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <strong>{name}</strong>
              <span>Plateforme hospitalière</span>
            </div>
          </Link>
          <button
            type="button"
            className="landing-nav-toggle"
            aria-label="Menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`landing-nav-links ${mobileNavOpen ? 'nav-open' : ''}`} aria-label="Navigation principale">
            <a href="#features" onClick={() => setMobileNavOpen(false)}>Solutions</a>
            <a href="#roles" onClick={() => setMobileNavOpen(false)}>Rôles</a>
            <a href="#tarifs" onClick={() => setMobileNavOpen(false)}>Tarifs</a>
            <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>
            <Link to="/login" className="btn btn-outline btn-nav" onClick={() => setMobileNavOpen(false)}>Connexion</Link>
            <a href="#demo" className="btn btn-primary btn-nav" onClick={() => setMobileNavOpen(false)}>Demander une démo</a>
          </nav>
        </div>
      </header>

      <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="grid-pattern" />
      </div>

      <section className="hero">
        <div className="hero-inner landing-container">
          <div className="hero-content animate-in">
            <div className="hero-badges">
              <span className="pill pill-primary">
                <span className="pill-dot" />
                Solution santé — Sénégal
              </span>
              <span className="pill pill-soft">v3.0 · Application Web</span>
            </div>

            <h1>
              Digitalisez votre établissement
              <span className="gradient-text"> avec confiance</span>
            </h1>

            <p className="hero-lead">
              {settings?.slogan || BRAND.tagline}. {name} relie accueil, consultations,
              laboratoire, pharmacie, facturation et caisse dans un parcours unique —
              de l&apos;arrivée du patient au rapport financier de la direction.
            </p>

            <ul className="hero-checks">
              <li><span className="check-icon"><Icon name="check" size={13} strokeWidth={2.75} /></span> Mise en service en 48 heures, formation comprise</li>
              <li><span className="check-icon"><Icon name="check" size={13} strokeWidth={2.75} /></span> Fonctionne aussi sans Internet, sur votre réseau local</li>
              <li><span className="check-icon"><Icon name="check" size={13} strokeWidth={2.75} /></span> Facturation automatique et caisse contrôlée en FCFA</li>
            </ul>

            <div className="hero-actions">
              <a href="#demo" className="btn btn-primary btn-lg hero-cta-main">
                <span>Demander une démonstration</span>
                <Icon name="arrowRight" size={18} />
              </a>
              <a href="#tarifs" className="btn btn-secondary btn-lg">Voir les tarifs</a>
            </div>

            <div className="hero-rating">
              <span className="hero-rating-icon"><Icon name="shieldCheck" size={20} /></span>
              <p>Conçue pour les <strong>cliniques, hôpitaux et centres de santé</strong> du Sénégal</p>
            </div>
          </div>

          <div className="hero-visual animate-in delay-1">
            <div className="preview-glow" aria-hidden="true" />
            <div className="dashboard-preview">
              <div className="preview-topbar">
                <div className="preview-dots">
                  <span /><span /><span />
                </div>
                <span className="preview-live"><span className="live-dot" /> En ligne</span>
                <span className="preview-title">Tableau de bord</span>
              </div>
              <div className="preview-body">
                <aside className="preview-sidebar">
                  {['Accueil', 'Patients', 'RDV', 'Labo', 'Pharma'].map((m, i) => (
                    <div key={m} className={`preview-menu ${i === 0 ? 'active' : ''}`}>{m}</div>
                  ))}
                </aside>
                <div className="preview-main">
                  <div className="preview-stats">
                    <div className="preview-stat"><small>Patients</small><b>128</b><span className="trend up">+12%</span></div>
                    <div className="preview-stat"><small>RDV aujourd&apos;hui</small><b>24</b></div>
                    <div className="preview-stat warn"><small>File attente</small><b>8</b></div>
                  </div>
                  <div className="preview-chart-wrap">
                    <span className="chart-label">Activité semaine</span>
                    <div className="preview-chart">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="preview-bar" style={{ '--h': `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="preview-list">
                    <div className="preview-row">
                      <span className="preview-avatar">FF</span>
                      <div><b>Fatou Fall</b><small>Consultation · 09:00</small></div>
                      <span className="preview-badge ok">Confirmé</span>
                    </div>
                    <div className="preview-row">
                      <span className="preview-avatar alt">MS</span>
                      <div><b>Moussa Sow</b><small>Ticket A-002</small></div>
                      <span className="preview-badge wait">En attente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-card float-1">
              <span className="float-icon"><Icon name="stethoscope" size={20} /></span>
              <div><strong>Consultation</strong><small>Dossier à jour</small></div>
            </div>
            <div className="floating-card float-2">
              <span className="float-icon"><Icon name="bell" size={20} /></span>
              <div><strong>3 alertes</strong><small>RDV & urgence</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="metrics-bar" aria-label="Chiffres clés">
        <div className="landing-container">
          <p className="metrics-tagline">La plateforme en un coup d&apos;œil</p>
          <div className="metrics-inner">
            {METRICS.map((m, i) => (
              <MetricCard key={m.id} metric={m} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="landing-container">
          <p className="trust-title">Adapté à tous les établissements de santé</p>
          <div className="trust-tags">
            {['Cliniques privées', 'Hôpitaux', 'Centres de santé', 'Laboratoires', 'Pharmacies'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-label">Solutions</span>
            <h2>Tout ce dont votre structure a besoin</h2>
            <p>Modules interconnectés — un seul flux, zéro perte d&apos;information</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className={`feature-card feature-${f.color}`}>
                <div className="feature-image-wrap">
                  <FeatureImage src={f.image} alt={f.alt} color={f.color} icon={f.icon} />
                  <div className="feature-image-overlay" aria-hidden="true" />
                  <div className="feature-icon-badge">
                    <FeatureIcon type={f.icon} />
                  </div>
                </div>
                <div className="feature-body">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <Link to="/login" className="feature-link">
                    En savoir plus
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <RolesSection />

      <section id="platform" className="platform-section">
        <div className="landing-container platform-grid">
          <div className="platform-content">
            <span className="section-label">Plateforme web</span>
            <h2>Une seule application web, tous vos postes</h2>
            <p>
              Rien à installer sur les ordinateurs : un simple navigateur suffit. Réception,
              cabinets, laboratoire, pharmacie et direction travaillent sur les mêmes
              données, mises à jour en temps réel.
            </p>
            <div className="platform-cards">
              <div className="platform-card">
                <span className="platform-icon"><Icon name="monitor" size={22} /></span>
                <div>
                  <strong>Aucune installation</strong>
                  <span>Chrome, Edge, Firefox ou Safari — ordinateur ou tablette</span>
                </div>
              </div>
              <div className="platform-card">
                <span className="platform-icon"><Icon name="database" size={22} /></span>
                <div>
                  <strong>Serveur local ou en ligne</strong>
                  <span>Fonctionne sur votre réseau interne, même sans Internet</span>
                </div>
              </div>
              <div className="platform-card">
                <span className="platform-icon"><Icon name="users" size={22} /></span>
                <div>
                  <strong>Postes simultanés</strong>
                  <span>Chaque agent sa session, ses droits et son historique</span>
                </div>
              </div>
            </div>
          </div>
          <div className="steps-block">
            <h3>Comment ça fonctionne</h3>
            {STEPS.map((s) => (
              <div key={s.n} className="step-item">
                <span className="step-num">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="why-section">
        <div className="landing-container why-grid">
          <WhyContent>
            <span className="section-label">Pourquoi nous choisir</span>
            <h2>Pensée pour la réalité de vos services</h2>
            <p className="why-intro">
              Coupures de réseau, dossiers papier, files d&apos;attente qui débordent :
              la plateforme répond aux contraintes concrètes des établissements de santé
              au Sénégal.
            </p>
            <div className="why-highlight">
              <span className="why-flag"><Icon name="mapPin" size={20} /></span>
              <p>Équipe et support basés au Sénégal</p>
            </div>
            <WhyBenefits />
            <a href="#demo" className="btn btn-primary btn-lg why-cta-btn">
              Demander une démonstration
              <Icon name="arrowRight" size={18} />
            </a>
          </WhyContent>
          <WhyStatsPanel />
        </div>
      </section>

      <SecuritySection />

      <PricingSection />

      <FaqSection />

      <CtaBand />

      <DemoSection contactEmail={contactEmail} contactPhone={contactPhone} />

      <footer className="landing-footer">
        <div className="landing-container footer-grid">
          <div className="footer-brand">
            <div className="landing-logo footer-logo">
              <div className="logo-mark sm">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
              </div>
              <strong>{name}</strong>
            </div>
            <p>{settings?.adresse || 'Dakar, Sénégal'}</p>
            <p className="footer-tagline">{BRAND.tagline}</p>
          </div>
          <div className="footer-col">
            <h4>Produit</h4>
            <a href="#features">Fonctionnalités</a>
            <a href="#roles">Rôles métier</a>
            <a href="#platform">Plateforme</a>
            <a href="#securite">Sécurité</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Accès</h4>
            <Link to="/login">Connexion</Link>
            <Link to="/register">Créer un compte patient</Link>
            <Link to="/ecran-attente">Écran de salle d&apos;attente</Link>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href={`tel:${contactPhone.replace(/\s/g, '')}`}>{contactPhone}</a>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <a href="#demo">Demander une démonstration</a>
          </div>
        </div>
        <div className="footer-bottom landing-container">
          <p>© {new Date().getFullYear()} {name} — Plateforme hospitalière v3.0</p>
          <p>Confiance · Propreté · Sécurité · Modernité</p>
        </div>
      </footer>
      </div>
    </>
  );
}
