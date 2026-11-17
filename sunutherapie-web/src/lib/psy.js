// L'API envoie `specialites` (tableau JSON) et `etablissement`.
export function specialitesPsy(psy) {
  const s = psy?.specialites;
  if (Array.isArray(s)) return s.filter(Boolean).join(', ');
  return s || '';
}

export function sousTitrePsy(psy) {
  return specialitesPsy(psy) || psy?.etablissement || 'Psychothérapeute';
}
