import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/ui';
import { MODULES, QUAND_DEMANDER_AIDE, RESPIRATION } from '../lib/psychoeducation';

const CLE_LUS = 'sunu_modules_lus';
const lireLus = () => {
  try { return JSON.parse(localStorage.getItem(CLE_LUS) || '[]'); } catch { return []; }
};
const marquerLu = (id) => {
  try {
    const lus = new Set(lireLus());
    lus.add(id);
    localStorage.setItem(CLE_LUS, JSON.stringify([...lus]));
  } catch { /* stockage indisponible : on ignore */ }
};

export default function BienEtre() {
  const { id } = useParams();
  return id ? <Module id={id} /> : <Liste />;
}

function Liste() {
  const lus = lireLus();
  return (
    <>
      <div className="page-head">
        <h1 className="serif">Prendre soin de soi</h1>
        <p>Des modules courts pour comprendre ce que vous vivez et trouver des pistes concrètes, à votre rythme.</p>
      </div>
      <div className="be-liste">
        {MODULES.map((m) => (
          <Link key={m.id} to={`/bien-etre/${m.id}`} className="card be-carte">
            <div className="be-carte-h">
              <b>{m.titre}</b>
              {lus.includes(m.id) ? <span className="badge badge-ok">Lu</span> : null}
            </div>
            <p>{m.resume}</p>
            <span className="be-duree">{m.duree} de lecture</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function Module({ id }) {
  const m = MODULES.find((x) => x.id === id);
  useEffect(() => { if (m) marquerLu(m.id); }, [m]);

  if (!m) {
    return (
      <div className="card">
        <p>Ce module n'existe pas.</p>
        <Link className="btn btn-outline btn-sm" to="/bien-etre">Retour aux modules</Link>
      </div>
    );
  }

  const i = MODULES.indexOf(m);
  const suivant = MODULES[(i + 1) % MODULES.length];

  return (
    <article className="be-module">
      <Link to="/bien-etre" className="be-retour"><Icon name="back" size={16} /> Tous les modules</Link>
      <div className="page-head">
        <h1 className="serif">{m.titre}</h1>
        <p>{m.resume}</p>
      </div>

      {m.sections.map((s) => (
        <section key={s.titre} className="card be-section">
          <h2>{s.titre}</h2>
          {(s.texte || []).map((t) => <p key={t}>{t}</p>)}
          {s.points ? <ul>{s.points.map((p) => <li key={p}>{p}</li>)}</ul> : null}
        </section>
      ))}

      {m.exercice === 'respiration' ? <Respiration /> : null}

      <section className="card be-aide">
        <h2>Quand demander de l'aide</h2>
        <ul>{QUAND_DEMANDER_AIDE.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="be-aide-actions">
          <Link className="btn btn-primary btn-sm" to="/rendez-vous">Parler à un psychothérapeute</Link>
          <Link className="btn btn-outline btn-sm" to="/evaluation">Faire le point</Link>
        </div>
      </section>

      <Link to={`/bien-etre/${suivant.id}`} className="card be-suivant">
        <span>Module suivant</span>
        <b>{suivant.titre} →</b>
      </Link>
    </article>
  );
}

// Respiration guidée : le cercle grandit à l'inspiration, diminue à l'expiration.
// Tout découle d'un seul compteur de secondes écoulées.
function Respiration() {
  const { inspiration, expiration, cycles } = RESPIRATION;
  const duree = inspiration + expiration;
  const total = duree * cycles;
  const [ecoule, setEcoule] = useState(null); // null = pas commencé

  const actif = ecoule !== null && ecoule < total;
  const fini = ecoule !== null && ecoule >= total;

  useEffect(() => {
    if (!actif) return undefined;
    const t = setTimeout(() => setEcoule((e) => e + 1), 1000);
    return () => clearTimeout(t);
  }, [actif, ecoule]);

  const dansCycle = (ecoule ?? 0) % duree;
  const phase = dansCycle < inspiration ? 'inspire' : 'expire';
  const reste = phase === 'inspire' ? inspiration - dansCycle : duree - dansCycle;
  const cycle = Math.min(Math.floor((ecoule ?? 0) / duree) + 1, cycles);

  return (
    <section className="card be-resp">
      <h2>Respiration guidée</h2>
      <p>Inspirez {inspiration} secondes par le nez, expirez {expiration} secondes par la bouche. {cycles} cycles, environ une minute.</p>
      <div className="be-resp-zone" aria-live="polite">
        <div className={`be-resp-cercle ${actif ? phase : ''}`}
             style={{ transitionDuration: `${phase === 'inspire' ? inspiration : expiration}s` }}>
          <span>{actif ? (phase === 'inspire' ? 'Inspirez' : 'Expirez') : fini ? 'Bien joué' : 'Prêt ?'}</span>
          {actif ? <small>{reste}</small> : null}
        </div>
      </div>
      <div className="be-resp-actions">
        {actif ? (
          <button className="btn btn-outline btn-sm" onClick={() => setEcoule(null)}>Arrêter</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => setEcoule(0)}>{fini ? 'Recommencer' : 'Commencer'}</button>
        )}
        {actif ? <span className="be-resp-cycle">Cycle {cycle} / {cycles}</span> : null}
      </div>
    </section>
  );
}
