import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Skeletons, formatDate } from '../../components/ui';
import { NIVEAUX } from '../../lib/evaluation';

const PERIODES = [
  { k: '30', label: '30 jours' },
  { k: '90', label: '3 mois' },
  { k: '365', label: '12 mois' },
  { k: 'tout', label: 'Depuis le début' },
];

// null = effectif masqué (moins de 5 personnes) pour protéger l'anonymat.
const n = (v) => (v === null || v === undefined ? '< 5' : v.toLocaleString('fr-FR'));
const pct = (a, b) => (a == null || !b ? null : Math.round((a / b) * 100));
const moisFr = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

export default function TableauDeBord() {
  const [periode, setPeriode] = useState('90');
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    setD(null);
    setErreur(null);
    api.getStatistiques(periode)
      .then((r) => { if (!annule) setD(r); })
      .catch((e) => { if (!annule) setErreur(e.message); });
    return () => { annule = true; };
  }, [periode]);

  return (
    <>
      <div className="page-head">
        <h1 className="serif">Tableau de bord</h1>
        <p>Chiffres agrégés et anonymes de SunuThérapie, à partager avec les partenaires (OMS, Ministère de la Santé).</p>
      </div>

      <div className="tdb-filtres" role="group" aria-label="Période">
        {PERIODES.map((p) => (
          <button key={p.k} className={`btn btn-sm ${periode === p.k ? 'btn-primary' : 'btn-outline'}`}
                  aria-pressed={periode === p.k} onClick={() => setPeriode(p.k)}>{p.label}</button>
        ))}
        {d ? <button className="btn btn-ghost btn-sm tdb-csv" onClick={() => telechargerCsv(d)}>Télécharger (CSV)</button> : null}
      </div>

      {erreur ? <div className="alert alert-error">{erreur}</div> : null}
      {!d && !erreur ? <Skeletons n={4} /> : null}
      {d ? <Contenu d={d} /> : null}
    </>
  );
}

function Contenu({ d }) {
  const { etudiants: e, evaluations: ev, alertes: a, consultations: c } = d;
  const evol = ev.evolution;

  return (
    <>
      <div className="tdb-tuiles">
        <Tuile valeur={n(e.inscrits)} label="Étudiants inscrits" detail={`${n(e.nouveaux)} sur la période`} />
        <Tuile valeur={n(e.evalues)} label="Étudiants évalués" detail={`${n(ev.total)} questionnaires remplis`} />
        <Tuile valeur={n(a.signalees)} label="Risques signalés" detail={`${n(a.en_attente)} en attente de prise en charge`}
               alerte={a.en_attente > 0} />
        <Tuile valeur={a.delai_median_heures == null ? '—' : `${a.delai_median_heures.toLocaleString('fr-FR')} h`}
               label="Délai médian de prise en charge" detail="entre l'alerte et le contact par un psy" />
      </div>

      <div className="tdb-grille">
        <section className="card">
          <div className="card-h"><h2>Niveau de soin des étudiants évalués</h2></div>
          <p className="tdb-sous">Dernier niveau proposé pour chaque étudiant, selon le modèle de soins par étapes.</p>
          <BarresNiveaux niveaux={ev.niveaux} />
        </section>

        <section className="card">
          <div className="card-h"><h2>Évolution des étudiants suivis</h2></div>
          <p className="tdb-sous">Étudiants ayant rempli au moins deux fois le même questionnaire ({n(evol.suivis)}). Un changement compte à partir de 5 points.</p>
          <div className="tdb-evol">
            <div><b>{n(evol.amelioration)}</b><span>vont mieux</span></div>
            <div><b>{n(evol.stable)}</b><span>stables</span></div>
            <div><b>{n(evol.aggravation)}</b><span>vont moins bien</span></div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-h"><h2>Questionnaires remplis par mois</h2></div>
        <BarresMois mois={ev.par_mois} />
      </section>

      <div className="tdb-grille">
        <section className="card">
          <div className="card-h"><h2>Par université</h2></div>
          {d.universites.length === 0 ? <p className="tdb-sous">Aucune donnée sur la période.</p> : (
            <table className="tdb-table">
              <thead><tr><th>Université</th><th>Évalués</th><th>Niveau 3 ou plus</th></tr></thead>
              <tbody>
                {d.universites.map((u) => (
                  <tr key={u.universite}><td>{u.universite}</td><td>{n(u.evalues)}</td><td>{n(u.niveau_3_ou_plus)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <div className="card-h"><h2>Consultations</h2></div>
          <div className="tdb-evol">
            <div><b>{n(c.demandees)}</b><span>demandées</span></div>
            <div><b>{n(c.terminees)}</b><span>terminées</span></div>
          </div>
          <p className="tdb-sous" style={{ marginTop: 12 }}>
            {n(e.consentement)} étudiants ont accepté le cadre de confidentialité.
          </p>
        </section>
      </div>

      <p className="tdb-note">
        Effectifs inférieurs à {d.seuil} masqués (« &lt; {d.seuil} ») pour qu'aucun étudiant ne puisse être identifié.
        Données générées le {formatDate(d.genere_le)}.
      </p>
    </>
  );
}

function Tuile({ valeur, label, detail, alerte }) {
  return (
    <div className={`card tdb-tuile ${alerte ? 'alerte' : ''}`}>
      <b>{valeur}</b>
      <span className="l">{label}</span>
      <span className="d">{detail}</span>
    </div>
  );
}

function BarresNiveaux({ niveaux }) {
  const valeurs = [1, 2, 3, 4].map((k) => niveaux[k]);
  const total = valeurs.reduce((s, v) => s + (v || 0), 0);
  const max = Math.max(1, ...valeurs.map((v) => v || 0));

  return (
    <div className="tdb-barres">
      {[1, 2, 3, 4].map((k) => {
        const v = niveaux[k];
        const p = pct(v, total);
        return (
          <div className="tdb-barre" key={k} title={`Niveau ${k} · ${NIVEAUX[k].titre} : ${n(v)}${p != null ? ` (${p} %)` : ''}`}>
            <span className="tdb-barre-l">{k}. {NIVEAUX[k].titre}</span>
            <span className="tdb-barre-piste">
              <span className="tdb-barre-val" style={{ width: v ? `${(v / max) * 100}%` : 0 }} />
            </span>
            <span className="tdb-barre-n">{n(v)}{p != null ? <small> · {p} %</small> : null}</span>
          </div>
        );
      })}
    </div>
  );
}

function BarresMois({ mois }) {
  if (!mois.length) return <p className="tdb-sous">Aucun questionnaire sur la période.</p>;
  const max = Math.max(1, ...mois.map((m) => m.evaluations || 0));

  return (
    <>
      <div className="tdb-mois" role="img" aria-label="Nombre de questionnaires remplis par mois">
        {mois.map((m) => (
          <div className="tdb-mois-col" key={m.mois} title={`${moisFr(m.mois)} : ${n(m.evaluations)} questionnaires`}>
            <span className="tdb-mois-zone">
              <span className="tdb-mois-n">{n(m.evaluations)}</span>
              <span className="tdb-mois-barre" style={{ height: `${((m.evaluations || 0) / max) * 150}px` }} />
            </span>
            <span className="tdb-mois-l">{moisFr(m.mois)}</span>
          </div>
        ))}
      </div>
      <details className="tdb-details">
        <summary>Voir le tableau</summary>
        <table className="tdb-table">
          <thead><tr><th>Mois</th><th>Questionnaires</th></tr></thead>
          <tbody>{mois.map((m) => <tr key={m.mois}><td>{moisFr(m.mois)}</td><td>{n(m.evaluations)}</td></tr>)}</tbody>
        </table>
      </details>
    </>
  );
}

function telechargerCsv(d) {
  const lignes = [
    ['Indicateur', 'Valeur'],
    ['Période', d.periode === 'tout' ? 'Depuis le début' : `${d.periode} derniers jours`],
    ['Étudiants inscrits', n(d.etudiants.inscrits)],
    ['Nouveaux inscrits sur la période', n(d.etudiants.nouveaux)],
    ['Étudiants évalués', n(d.etudiants.evalues)],
    ['Questionnaires remplis', n(d.evaluations.total)],
    ...[1, 2, 3, 4].map((k) => [`Niveau ${k} (${NIVEAUX[k].titre})`, n(d.evaluations.niveaux[k])]),
    ['Étudiants suivis (2 questionnaires ou plus)', n(d.evaluations.evolution.suivis)],
    ['Vont mieux', n(d.evaluations.evolution.amelioration)],
    ['Stables', n(d.evaluations.evolution.stable)],
    ['Vont moins bien', n(d.evaluations.evolution.aggravation)],
    ['Risques signalés', n(d.alertes.signalees)],
    ['Alertes prises en charge', n(d.alertes.prises_en_charge)],
    ['Alertes en attente', n(d.alertes.en_attente)],
    ['Délai médian de prise en charge (h)', d.alertes.delai_median_heures ?? '—'],
    ['Consultations demandées', n(d.consultations.demandees)],
    ['Consultations terminées', n(d.consultations.terminees)],
    ...d.evaluations.par_mois.map((m) => [`Questionnaires ${m.mois}`, n(m.evaluations)]),
    ...d.universites.map((u) => [`Évalués · ${u.universite}`, n(u.evalues)]),
  ];
  const csv = lignes.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const lien = Object.assign(document.createElement('a'), { href: url, download: `sunutherapie-statistiques-${d.periode}.csv` });
  lien.click();
  URL.revokeObjectURL(url);
}
