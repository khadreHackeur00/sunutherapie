import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import { formatDate } from './ui';
import { QUESTIONNAIRES } from '../lib/evaluation';

// Alertes de niveau 4 (risque signalé) à traiter par le psy. Rafraîchies toutes les minutes.
export default function AlertesRisque() {
  const [alertes, setAlertes] = useState([]);
  const [ouverte, setOuverte] = useState(null);
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    const charger = () => api.getAlertes().then((a) => { if (!annule) setAlertes(a); }).catch(() => {});
    charger();
    const t = setInterval(charger, 60000);
    return () => { annule = true; clearInterval(t); };
  }, []);

  if (alertes.length === 0) return null;

  const traiter = async (a) => {
    setErreur(null);
    setEnvoi(true);
    try {
      await api.prendreEnChargeAlerte(a.id, note.trim() || null);
      setAlertes((l) => l.filter((x) => x.id !== a.id));
      setOuverte(null);
      setNote('');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="card alertes">
      <div className="alertes-h">
        <span className="alertes-dot" aria-hidden="true" />
        <h2>{alertes.length === 1 ? '1 étudiant à recontacter en priorité' : `${alertes.length} étudiants à recontacter en priorité`}</h2>
      </div>
      <p className="alertes-sub">Ces étudiants ont signalé des pensées de mort ou d'automutilation (question 9 du PHQ-9). Contactez-les dès que possible.</p>

      {erreur ? <div className="alert alert-error">{erreur}</div> : null}

      {alertes.map((a) => (
        <div className="alerte" key={a.id}>
          <div className="alerte-bd">
            <b>{a.etudiant.name}</b>
            <span>{a.etudiant.universite} · {QUESTIONNAIRES[a.type]?.court} {a.score}/{QUESTIONNAIRES[a.type]?.max} · {formatDate(a.created_at)}</span>
            <div className="alerte-contact">
              {a.etudiant.telephone ? <a href={`tel:${a.etudiant.telephone}`}>{a.etudiant.telephone}</a> : null}
              <a href={`mailto:${a.etudiant.email}`}>{a.etudiant.email}</a>
            </div>
          </div>
          {ouverte === a.id ? (
            <div className="alerte-form">
              <textarea placeholder="Note (facultatif) : appel passé, rendez-vous fixé, orientation…" value={note}
                        onChange={(e) => setNote(e.target.value)} />
              <div className="alerte-actions">
                <button className="btn btn-outline btn-sm" onClick={() => { setOuverte(null); setNote(''); }}>Annuler</button>
                <button className="btn btn-primary btn-sm" disabled={envoi} onClick={() => traiter(a)}>
                  {envoi ? 'Enregistrement…' : 'Confirmer'}
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setOuverte(a.id)}>J'ai recontacté l'étudiant</button>
          )}
        </div>
      ))}
    </div>
  );
}
