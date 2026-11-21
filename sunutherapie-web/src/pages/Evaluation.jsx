import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api';
import { Skeletons, formatDate } from '../components/ui';
import { CHOIX, QUESTIONNAIRES, SEVERITE, NIVEAUX, URGENCES } from '../lib/evaluation';

export default function Evaluation() {
  const [type, setType] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [historique, setHistorique] = useState(null);

  const charger = () => api.getMesEvaluations().then(setHistorique).catch(() => setHistorique([]));
  useEffect(() => { charger(); }, []);

  const termine = (r) => { setResultat(r); setType(null); charger(); };

  return (
    <>
      <div className="page-head">
        <h1 className="serif">Faire le point</h1>
        <p>Deux questionnaires courts pour savoir comment vous allez et vous proposer le soutien le plus adapté. Vos réponses restent confidentielles.</p>
      </div>

      {resultat ? <Resultat r={resultat} onFermer={() => setResultat(null)} /> : null}

      {type ? (
        <Questionnaire type={type} onAnnuler={() => setType(null)} onTermine={termine} />
      ) : !resultat ? (
        <div className="eval-choix">
          {Object.entries(QUESTIONNAIRES).map(([k, q]) => (
            <button key={k} className="card eval-carte" onClick={() => setType(k)}>
              <b>{q.nom}</b>
              <span>{q.questions.length} questions · 2 minutes</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 22 }}>
        <div className="card-h"><h2>Mes résultats</h2></div>
        {historique === null ? <Skeletons n={2} />
          : historique.length === 0 ? <p className="eval-vide">Aucun questionnaire pour l'instant.</p>
          : historique.map((e) => (
            <div className="item" key={e.id}>
              <div className="bd">
                <div className="t">{QUESTIONNAIRES[e.type]?.court} · {e.score}/{QUESTIONNAIRES[e.type]?.max}</div>
                <div className="s">{formatDate(e.created_at)} · {SEVERITE[e.severite] || e.severite}</div>
              </div>
              <div className="r"><span className={`badge niveau-${e.niveau_propose}`}>Niveau {e.niveau_propose}</span></div>
            </div>
          ))}
      </div>
    </>
  );
}

function Questionnaire({ type, onAnnuler, onTermine }) {
  const q = QUESTIONNAIRES[type];
  const [reponses, setReponses] = useState(Array(q.questions.length).fill(null));
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const complet = reponses.every((r) => r !== null);

  const choisir = (i, v) => setReponses((rs) => rs.map((r, j) => (j === i ? v : r)));

  const envoyer = async () => {
    setErreur(null);
    setEnvoi(true);
    try {
      const res = await api.envoyerEvaluation(type, reponses);
      onTermine(res.data);
    } catch (e) {
      setErreur(e.message);
      setEnvoi(false);
    }
  };

  return (
    <div className="card">
      <div className="card-h"><h2>{q.nom}</h2></div>
      <p className="eval-intro">{q.intro}</p>
      {erreur ? <div className="alert alert-error">{erreur}</div> : null}
      <ol className="eval-questions">
        {q.questions.map((texte, i) => (
          <li key={i}>
            <p>{texte}</p>
            <div className="eval-options" role="radiogroup" aria-label={texte}>
              {CHOIX.map((c, v) => (
                <label key={v} className={reponses[i] === v ? 'on' : undefined}>
                  <input type="radio" name={`q${i}`} checked={reponses[i] === v} onChange={() => choisir(i, v)} />
                  {c}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="modal-actions">
        <button className="btn btn-outline btn-sm" onClick={onAnnuler}>Annuler</button>
        <button className="btn btn-primary btn-sm" disabled={!complet || envoi} onClick={envoyer}>
          {envoi ? 'Envoi…' : complet ? 'Voir mon résultat' : `Encore ${reponses.filter((r) => r === null).length} réponse(s)`}
        </button>
      </div>
    </div>
  );
}

function Resultat({ r, onFermer }) {
  const q = QUESTIONNAIRES[r.type];
  const n = NIVEAUX[r.niveau_propose];
  return (
    <div className={`card eval-resultat ${r.risque ? 'urgent' : ''}`}>
      <div className="eval-score">
        <b>{r.score}<small>/{q.max}</small></b>
        <span>{q.court} · {SEVERITE[r.severite] || r.severite}</span>
      </div>
      <h2>{n.titre}</h2>
      <p>{n.texte}</p>

      {r.risque ? (
        <div className="eval-urgence">
          <b>En cas de danger immédiat, appelez :</b>
          <div className="eval-numeros">
            {URGENCES.map((u) => (
              <a key={u.numero} href={`tel:${u.numero}`}><strong>{u.numero}</strong>{u.nom}</a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="modal-actions">
        <button className="btn btn-outline btn-sm" onClick={onFermer}>Faire un autre questionnaire</button>
        {r.niveau_propose >= 2 ? <Link className="btn btn-primary btn-sm" to="/rendez-vous">Prendre rendez-vous</Link> : null}
      </div>
      <p className="eval-note">Ce résultat est une première indication, pas un diagnostic. Un professionnel le relira avec vous.</p>
    </div>
  );
}
