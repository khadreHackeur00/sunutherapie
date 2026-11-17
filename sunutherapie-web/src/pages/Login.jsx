import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const PARTENAIRES = [
  { src: '/partenaires/amref.png', nom: 'AMREF Health Africa' },
  { src: '/partenaires/mastercard.png', nom: 'Fondation Mastercard' },
  { src: '/partenaires/ucad.png', nom: 'Université Cheikh Anta Diop de Dakar' },
  { src: '/partenaires/oms.png', nom: 'Organisation mondiale de la Santé' },
  { src: '/partenaires/mshp.png', nom: "Ministère de la Santé et de l'Hygiène publique" },
];

function Aside() {
  return (
    <aside className="auth-aside">
      <div className="brand"><img src="/logo.jpeg" alt="" />SunuThérapie</div>
      <h1 className="serif">Votre bien-être mental, notre priorité</h1>
      <p>Consultez vos rendez-vous, lisez les ressources partagées par votre psychothérapeute et échangez avec la communauté, depuis votre navigateur.</p>
      <p className="note">Rejoignez vos consultations vidéo directement depuis votre navigateur ou depuis l'application mobile SunuThérapie.</p>
      <div className="partenaires">
        <span className="partenaires-titre">Nos partenaires</span>
        <div className="partenaires-logos">
          {PARTENAIRES.map((p) => <img key={p.src} src={p.src} alt={p.nom} title={p.nom} />)}
        </div>
      </div>
    </aside>
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      await signIn(email.trim(), password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="auth">
      <Aside />
      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <h2 className="serif">Content de vous revoir</h2>
          <p className="sub">Connectez-vous avec votre compte SunuThérapie.</p>

          {erreur ? <div className="alert alert-error">{erreur}</div> : null}

          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" type="email" autoComplete="email" required
                   value={email} onChange={(e) => setEmail(e.target.value)}
                   placeholder="vous@exemple.com" />
          </div>

          <div className="field">
            <label htmlFor="pwd">Mot de passe</label>
            <input id="pwd" type="password" autoComplete="current-password" required
                   value={password} onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••" />
          </div>

          <button className="btn btn-primary btn-block" disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export { Aside };
