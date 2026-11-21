// Modules de psychoéducation (niveau 1 du modèle par étapes).
// Contenu de premier niveau, à faire relire par l'équipe clinique avant diffusion.
// Copie identique de sunutherapie-web/src/lib/psychoeducation.js : garder les deux fichiers identiques.

export const MODULES = [
  {
    id: 'stress',
    titre: 'Le stress des études',
    resume: "Comprendre ce qui se passe dans le corps et retrouver de l'air quand la pression monte.",
    duree: '5 min',
    exercice: 'respiration',
    sections: [
      {
        titre: 'Comprendre',
        texte: [
          "Le stress est une réaction normale : face à un examen, à une dette ou à une dispute, le corps se prépare à agir. Le cœur bat plus vite, les muscles se tendent, l'esprit se met en alerte.",
          "À petite dose, il aide à se concentrer. Il devient un problème quand il dure des semaines, empêche de dormir ou de manger, ou donne l'impression de ne plus rien contrôler.",
        ],
      },
      {
        titre: 'Ce qui aide',
        points: [
          "Découper le travail : une tâche précise par séance (« relire le chapitre 3 ») plutôt que « réviser tout ».",
          "Faire des pauses courtes et régulières : 5 minutes toutes les 45 minutes.",
          "Bouger un peu chaque jour : 20 minutes de marche suffisent à faire baisser la tension.",
          "En parler : à un ami, à un membre de la famille, à un Jeune Défenseur de la santé mentale.",
          "Limiter le café, le thé très fort et les boissons énergisantes le soir.",
        ],
      },
      {
        titre: 'À essayer maintenant',
        texte: ["La respiration lente calme le système nerveux en quelques minutes. Suivez le cercle : inspirez quand il grandit, expirez quand il diminue."],
      },
    ],
  },
  {
    id: 'sommeil',
    titre: 'Mieux dormir',
    resume: "Le sommeil est le premier allié de la mémoire et de l'humeur. Quelques habitudes simples changent beaucoup.",
    duree: '4 min',
    sections: [
      {
        titre: 'Comprendre',
        texte: [
          "Pendant le sommeil, le cerveau range ce qu'il a appris dans la journée. Réviser toute la nuit avant un examen fait souvent perdre plus qu'on ne gagne.",
          "Un adulte jeune a besoin de 7 à 9 heures de sommeil. Le bruit, la chaleur, le téléphone et les soucis sont les ennemis les plus fréquents.",
        ],
      },
      {
        titre: 'Ce qui aide',
        points: [
          "Se coucher et se lever à peu près à la même heure, même le week-end.",
          "Poser le téléphone 30 minutes avant de dormir : la lumière de l'écran retarde l'endormissement.",
          "Si l'on ne dort pas au bout de 20 minutes, se lever, faire une activité calme, puis revenir.",
          "Éviter les grosses siestes l'après-midi : 20 minutes maximum.",
          "Écrire ses soucis sur une feuille avant de se coucher, pour « les poser » jusqu'au lendemain.",
        ],
      },
    ],
  },
  {
    id: 'anxiete',
    titre: "Calmer l'anxiété",
    resume: "Quand l'inquiétude tourne en boucle : la reconnaître et l'apprivoiser.",
    duree: '5 min',
    exercice: 'ancrage',
    sections: [
      {
        titre: 'Comprendre',
        texte: [
          "L'anxiété, c'est une inquiétude qui anticipe le pire, souvent pour des choses qui ne sont pas encore arrivées. Elle peut s'accompagner d'un cœur qui s'emballe, d'une boule au ventre ou de difficultés à respirer.",
          "Ces sensations sont désagréables mais ne sont pas dangereuses. Elles passent, même si sur le moment elles semblent durer.",
        ],
      },
      {
        titre: 'Ce qui aide',
        points: [
          "Nommer ce qui se passe : « je suis en train d'avoir peur », plutôt que lutter contre la sensation.",
          "Se demander : « qu'est-ce qui est vraiment sûr, là, maintenant ? » et « que dirais-je à un ami dans ma situation ? »",
          "Réserver un « temps pour s'inquiéter » de 15 minutes par jour, et y renvoyer les soucis le reste du temps.",
          "Éviter de fuir systématiquement ce qui fait peur : l'évitement entretient l'anxiété.",
        ],
      },
      {
        titre: 'À essayer maintenant : l\'ancrage 5-4-3-2-1',
        texte: ["Ramenez votre attention sur le moment présent en nommant, autour de vous :"],
        points: [
          '5 choses que vous voyez',
          '4 choses que vous pouvez toucher',
          '3 sons que vous entendez',
          '2 odeurs que vous sentez',
          '1 chose que vous pouvez goûter, ou une respiration lente',
        ],
      },
    ],
  },
  {
    id: 'emotions',
    titre: 'Gérer ses émotions',
    resume: "Colère, tristesse, découragement : les accueillir sans se laisser submerger.",
    duree: '4 min',
    sections: [
      {
        titre: 'Comprendre',
        texte: [
          "Toutes les émotions ont un rôle : la colère signale une injustice, la tristesse une perte, la peur un danger. Elles ne sont ni bonnes ni mauvaises.",
          "Ce qui pose problème, c'est quand elles débordent : paroles regrettées, isolement, envie de tout abandonner.",
        ],
      },
      {
        titre: 'Ce qui aide',
        points: [
          "Mettre un mot précis sur ce qu'on ressent : « déçu », « humilié », « épuisé » plutôt que « mal ».",
          "Attendre avant de réagir : quitter la pièce, respirer, répondre une heure plus tard.",
          "Écrire ce qui s'est passé, ce qu'on a ressenti et ce dont on aurait eu besoin.",
          "Garder des moments qui font du bien : la prière ou la méditation, le sport, la musique, le temps avec des proches.",
          "Se parler avec la même bienveillance qu'à un ami.",
        ],
      },
    ],
  },
];

// Toujours affiché en bas de chaque module.
export const QUAND_DEMANDER_AIDE = [
  "Si ces difficultés durent plus de deux semaines ou vous empêchent d'étudier, de dormir ou de voir vos proches.",
  "Si vous pensez à la mort ou à vous faire du mal : parlez-en tout de suite à quelqu'un. Vous n'êtes pas seul(e).",
];

// Exercice de respiration : inspiration 4 s, expiration 6 s.
export const RESPIRATION = { inspiration: 4, expiration: 6, cycles: 6 };
