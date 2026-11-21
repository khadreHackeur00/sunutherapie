import { QUESTIONNAIRES } from '../lib/evaluation';

// Évolution des scores dans le temps, une courbe par questionnaire (score rapporté au maximum).
const COULEURS = { phq9: 'var(--primary)', gad7: 'var(--accent)' };
const L = 520, H = 170, M = { g: 34, d: 12, h: 12, b: 26 };

export default function CourbeScores({ evaluations }) {
  const points = [...evaluations]
    .map((e) => ({ ...e, t: new Date(String(e.created_at).replace(' ', 'T')).getTime() }))
    .sort((a, b) => a.t - b.t);
  if (points.length < 2) return null;

  const t0 = points[0].t;
  const t1 = points[points.length - 1].t || t0 + 1;
  const x = (t) => M.g + ((t - t0) / Math.max(t1 - t0, 1)) * (L - M.g - M.d);
  const y = (pct) => M.h + (1 - pct) * (H - M.h - M.b);
  const pct = (e) => e.score / (QUESTIONNAIRES[e.type]?.max || 27);
  const date = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <figure className="courbe">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Évolution des scores aux questionnaires">
        {[0, 0.5, 1].map((p) => (
          <g key={p}>
            <line x1={M.g} x2={L - M.d} y1={y(p)} y2={y(p)} className="courbe-grille" />
            <text x={M.g - 6} y={y(p) + 4} textAnchor="end" className="courbe-axe">{Math.round(p * 100)} %</text>
          </g>
        ))}
        <text x={M.g} y={H - 6} className="courbe-axe">{date(t0)}</text>
        <text x={L - M.d} y={H - 6} textAnchor="end" className="courbe-axe">{date(t1)}</text>

        {Object.keys(QUESTIONNAIRES).map((type) => {
          const serie = points.filter((p) => p.type === type);
          if (!serie.length) return null;
          return (
            <g key={type}>
              <polyline fill="none" stroke={COULEURS[type]} strokeWidth="2.5" strokeLinejoin="round"
                        points={serie.map((p) => `${x(p.t)},${y(pct(p))}`).join(' ')} />
              {serie.map((p) => (
                <circle key={p.id} cx={x(p.t)} cy={y(pct(p))} r={p.risque ? 6 : 4}
                        fill={p.risque ? 'var(--danger)' : COULEURS[type]} stroke="#fff" strokeWidth="1.5">
                  <title>{`${QUESTIONNAIRES[type].court} ${p.score}/${QUESTIONNAIRES[type].max} · ${date(p.t)}${p.risque ? ' · risque signalé' : ''}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="courbe-legende">
        {Object.entries(QUESTIONNAIRES).map(([type, q]) => (
          <span key={type}><i style={{ background: COULEURS[type] }} />{q.court}</span>
        ))}
        <span><i style={{ background: 'var(--danger)' }} />Risque signalé</span>
        <span className="courbe-note">Plus haut = plus de gêne</span>
      </figcaption>
    </figure>
  );
}
