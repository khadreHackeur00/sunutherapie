import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as api from '../lib/api';
import { Icon } from '../components/ui';

// Appel vidéo/audio dans le navigateur, sur le même canal Agora que l'app mobile.
export default function Appel() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const audioSeul = params.get('mode') === 'audio';
  const navigate = useNavigate();

  const [etat, setEtat] = useState('connexion'); // connexion | attente | en-cours | erreur
  const [erreur, setErreur] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!audioSeul);
  const [distantVideo, setDistantVideo] = useState(false);
  const [duree, setDuree] = useState(0);

  const localRef = useRef(null);
  const distantRef = useRef(null);
  const session = useRef({ client: null, micro: null, camera: null });

  useEffect(() => {
    let annule = false;
    const s = session.current;

    (async () => {
      try {
        const info = await api.getVideoToken(id);
        if (!info?.app_id || !info?.channel_name) throw new Error("Configuration de l'appel incomplète.");

        const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
        AgoraRTC.setLogLevel(3);
        if (annule) return;

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        s.client = client;

        client.on('user-published', async (user, type) => {
          await client.subscribe(user, type);
          if (type === 'video') {
            setDistantVideo(true);
            user.videoTrack?.play(distantRef.current);
          }
          if (type === 'audio') user.audioTrack?.play();
          setEtat('en-cours');
        });
        client.on('user-unpublished', (user, type) => {
          if (type === 'video') setDistantVideo(false);
        });
        client.on('user-joined', () => setEtat('en-cours'));
        client.on('user-left', () => { setDistantVideo(false); setEtat('attente'); });

        await client.join(info.app_id, info.channel_name, info.token || null, info.uid ?? null);
        if (annule) { await client.leave(); return; }

        s.micro = await AgoraRTC.createMicrophoneAudioTrack();
        const pistes = [s.micro];
        if (!audioSeul) {
          s.camera = await AgoraRTC.createCameraVideoTrack();
          s.camera.play(localRef.current);
          pistes.push(s.camera);
        }
        await client.publish(pistes);
        setEtat((e) => (e === 'en-cours' ? e : 'attente'));
      } catch (e) {
        if (annule) return;
        const nom = e?.name || e?.code || '';
        const msg = /PERMISSION|NotAllowed/i.test(String(nom) + String(e?.message))
          ? 'Autorisez la caméra et le micro dans votre navigateur, puis réessayez.'
          : e?.message || "Impossible de démarrer l'appel.";
        setErreur(msg);
        setEtat('erreur');
      }
    })();

    return () => {
      annule = true;
      s.micro?.close();
      s.camera?.close();
      s.client?.leave().catch(() => {});
    };
  }, [id, audioSeul]);

  useEffect(() => {
    if (etat !== 'en-cours') return undefined;
    const t = setInterval(() => setDuree((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [etat]);

  const basculerMic = async () => {
    const m = session.current.micro;
    if (!m) return;
    await m.setEnabled(!micOn);
    setMicOn(!micOn);
  };

  const basculerCam = async () => {
    const c = session.current.camera;
    if (!c) return;
    await c.setEnabled(!camOn);
    setCamOn(!camOn);
  };

  const raccrocher = () => navigate('/consultations');

  const mm = String(Math.floor(duree / 60)).padStart(2, '0');
  const ss = String(duree % 60).padStart(2, '0');

  const statut = {
    connexion: 'Connexion…',
    attente: "En attente de l'autre participant…",
    'en-cours': `En cours · ${mm}:${ss}`,
    erreur: 'Appel impossible',
  }[etat];

  return (
    <div className="appel">
      <div className="appel-head">
        <div>
          <h1 className="serif">Consultation {audioSeul ? 'audio' : 'vidéo'}</h1>
          <p>{statut}</p>
        </div>
      </div>

      {erreur ? <div className="alert alert-error">{erreur}</div> : null}

      <div className="appel-scene">
        <div className="appel-distant" ref={distantRef}>
          {!distantVideo ? (
            <div className="appel-vide">
              <Icon name="user" size={40} />
              <span>{etat === 'en-cours' ? 'Caméra coupée' : "L'autre participant n'est pas encore là"}</span>
            </div>
          ) : null}
        </div>
        {!audioSeul ? (
          <div className="appel-local" ref={localRef}>
            {!camOn ? <div className="appel-vide petit">Caméra coupée</div> : null}
          </div>
        ) : null}
      </div>

      <div className="appel-actions">
        <button className={`appel-btn ${micOn ? '' : 'off'}`} onClick={basculerMic}
                disabled={etat === 'erreur' || etat === 'connexion'}
                aria-label={micOn ? 'Couper le micro' : 'Activer le micro'}>
          {micOn ? 'Micro' : 'Micro coupé'}
        </button>
        {!audioSeul ? (
          <button className={`appel-btn ${camOn ? '' : 'off'}`} onClick={basculerCam}
                  disabled={etat === 'erreur' || etat === 'connexion'}
                  aria-label={camOn ? 'Couper la caméra' : 'Activer la caméra'}>
            {camOn ? 'Caméra' : 'Caméra coupée'}
          </button>
        ) : null}
        <button className="appel-btn raccrocher" onClick={raccrocher}>Raccrocher</button>
      </div>
    </div>
  );
}
