import { useState } from 'react';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import { CONSENTEMENT } from '../lib/evaluation';

// Texte du consentement, réutilisé à l'inscription.
export function TexteConsentement() {
  return (
    <div className="consent-list">
      {CONSENTEMENT.map((c) => (
        <div key={c.titre} className="consent-item">
          <b>{c.titre}</b>
          <p>{c.texte}</p>
        </div>
      ))}
    </div>
  );
}

// Écran affiché aux étudiants qui n'ont pas encore donné leur consentement.
export default function Consentement() {
  const { refresh, signOut } = useAuth();
  const [coche, setCoche] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const valider = async () => {
    setErreur(null);
    setEnvoi(true);
    try {
      await api.donnerConsentement();
      await refresh();
    } catch (e) {
      setErreur(e.message);
      setEnvoi(false);
    }
  };

  return (
    <div className="consent-page">
      <div className="card consent-card">
        <h1 className="serif">Avant de commencer</h1>
        <p className="consent-lead">Prenez une minute pour lire comment SunuThérapie protège vos informations.</p>
        {erreur ? <div className="alert alert-error">{erreur}</div> : null}
        <TexteConsentement />
        <label className="consent-check">
          <input type="checkbox" checked={coche} onChange={(e) => setCoche(e.target.checked)} />
          <span>J'ai lu ces informations et j'accepte d'utiliser SunuThérapie dans ce cadre.</span>
        </label>
        <div className="consent-actions">
          <button className="btn btn-outline btn-sm" onClick={signOut}>Se déconnecter</button>
          <button className="btn btn-primary" disabled={!coche || envoi} onClick={valider}>
            {envoi ? 'Enregistrement…' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  );
}
