// Copie de sunutherapie-web/src/lib/evaluation.js : garder les deux fichiers identiques.
// Contenus du consentement et des questionnaires de dépistage.
// PHQ-9 et GAD-7 : versions françaises (Pfizer, libres d'utilisation).
// À faire valider par l'équipe clinique de SunuThérapie avant diffusion.

export const CONSENTEMENT = [
  {
    titre: 'Une démarche volontaire',
    texte: "Vous utilisez SunuThérapie librement. Vous pouvez arrêter à tout moment, sans avoir à vous justifier.",
  },
  {
    titre: 'Ce qui reste confidentiel',
    texte: "Vos échanges, vos réponses aux questionnaires et vos notes de suivi ne sont visibles que par vous et par les professionnels qui vous accompagnent. Ils ne sont jamais transmis à votre université ni à votre famille.",
  },
  {
    titre: 'Les limites de la confidentialité',
    texte: "Si votre vie ou celle d'une autre personne est en danger, l'équipe peut être amenée à agir pour votre sécurité, par exemple en vous orientant en urgence vers une structure de soins. Dans ce cas, nous vous en parlons d'abord, autant que possible.",
  },
  {
    titre: 'Vos réponses aux questionnaires',
    texte: "Elles servent à vous proposer le soutien le plus adapté. Un professionnel les relit avec vous : un questionnaire ne remplace pas un entretien et ne pose pas de diagnostic.",
  },
];

export const CHOIX = ['Jamais', 'Plusieurs jours', 'Plus de la moitié du temps', 'Presque tous les jours'];

export const QUESTIONNAIRES = {
  phq9: {
    nom: 'Humeur (PHQ-9)',
    court: 'PHQ-9',
    max: 27,
    intro: 'Au cours des 2 dernières semaines, à quelle fréquence avez-vous été gêné(e) par les problèmes suivants ?',
    questions: [
      "Peu d'intérêt ou de plaisir à faire les choses",
      'Être triste, déprimé(e) ou désespéré(e)',
      "Difficultés à s'endormir ou à rester endormi(e), ou dormir trop",
      "Se sentir fatigué(e) ou manquer d'énergie",
      "Avoir peu d'appétit ou manger trop",
      "Avoir une mauvaise opinion de soi-même, se sentir nul(le), ou avoir l'impression d'avoir déçu sa famille ou de s'être déçu(e) soi-même",
      'Avoir du mal à se concentrer, par exemple pour lire ou suivre un cours',
      "Bouger ou parler si lentement que les autres ont pu le remarquer, ou au contraire être si agité(e) qu'il était difficile de tenir en place",
      'Penser qu\'il vaudrait mieux mourir, ou envisager de vous faire du mal d\'une manière ou d\'une autre',
    ],
  },
  gad7: {
    nom: 'Anxiété (GAD-7)',
    court: 'GAD-7',
    max: 21,
    intro: 'Au cours des 2 dernières semaines, à quelle fréquence avez-vous été gêné(e) par les problèmes suivants ?',
    questions: [
      "Un sentiment de nervosité, d'anxiété ou de tension",
      "Être incapable d'arrêter de s'inquiéter ou de contrôler ses inquiétudes",
      "S'inquiéter trop à propos de différentes choses",
      'Avoir du mal à se détendre',
      'Être si agité(e) qu\'il est difficile de rester tranquille',
      'Être facilement contrarié(e) ou irritable',
      'Avoir peur que quelque chose de terrible puisse arriver',
    ],
  },
};

export const SEVERITE = {
  minimale: 'Minimale',
  legere: 'Légère',
  moderee: 'Modérée',
  moderement_severe: 'Modérément sévère',
  severe: 'Sévère',
};

// Modèle de soins par étapes : ce que l'on propose au jeune selon le niveau.
export const NIVEAUX = {
  1: { titre: 'Prévention', texte: "Vos réponses ne montrent pas de détresse importante. Les contenus de la bibliothèque, le forum et les activités de groupe peuvent vous aider à garder l'équilibre. Vous pouvez refaire le questionnaire quand vous le souhaitez." },
  2: { titre: 'Soutien de première ligne', texte: "Vos réponses montrent une gêne légère à modérée. Un échange avec un intervenant ou un psychothérapeute peut vous aider : prenez rendez-vous quand vous le souhaitez." },
  3: { titre: 'Accompagnement par un professionnel', texte: "Vos réponses montrent une gêne importante. Nous vous conseillons de prendre rendez-vous avec un psychothérapeute dès que possible." },
  4: { titre: 'Parlez-en maintenant', texte: "Vous avez indiqué avoir eu des pensées de mort ou de vous faire du mal. Vous n'êtes pas seul(e) : parlez-en dès maintenant à un professionnel." },
};

// Numéros d'urgence au Sénégal (à confirmer par l'équipe).
export const URGENCES = [
  { nom: 'SAMU national', numero: '1515' },
  { nom: 'Sapeurs-pompiers', numero: '18' },
  { nom: 'Police secours', numero: '17' },
];
