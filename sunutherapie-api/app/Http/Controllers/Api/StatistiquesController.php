<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Etudiant;
use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Tableau de bord des partenaires (OMS, Ministère) : chiffres agrégés et anonymes.
 * Aucune donnée individuelle ne sort d'ici ; les effectifs inférieurs à SEUIL sont masqués.
 */
class StatistiquesController extends Controller
{
    public const SEUIL = 5;

    public function index(Request $request)
    {
        $request->validate(['periode' => 'nullable|in:30,90,365,tout']);
        $periode = $request->input('periode', '90');
        $depuis = $periode === 'tout' ? null : now()->subDays((int) $periode);

        $evaluations = Evaluation::query()
            ->when($depuis, fn ($q) => $q->where('created_at', '>=', $depuis))
            ->orderBy('created_at')
            ->get(['id', 'user_id', 'type', 'score', 'niveau_propose', 'risque', 'created_at', 'pris_en_charge_at']);

        $etudiants = User::where('role', 'etudiant');
        $consultations = Consultation::query()->when($depuis, fn ($q) => $q->where('created_at', '>=', $depuis));

        // Dernier niveau connu par étudiant évalué sur la période.
        $derniers = $evaluations->groupBy('user_id')->map(fn ($e) => $e->last()->niveau_propose);

        $alertes = $evaluations->where('risque', true);
        $traitees = $alertes->whereNotNull('pris_en_charge_at');
        $delais = $traitees->map(fn ($e) => $e->created_at->diffInMinutes($e->pris_en_charge_at) / 60)->sort()->values();

        return response()->json(['success' => true, 'data' => [
            'periode' => $periode,
            'seuil' => self::SEUIL,
            'genere_le' => now(),
            'etudiants' => [
                'inscrits' => $this->masque((clone $etudiants)->count()),
                'nouveaux' => $this->masque((clone $etudiants)->when($depuis, fn ($q) => $q->where('created_at', '>=', $depuis))->count()),
                'consentement' => $this->masque((clone $etudiants)->whereNotNull('consentement_at')->count()),
                'evalues' => $this->masque($derniers->count()),
            ],
            'evaluations' => [
                'total' => $this->masque($evaluations->count()),
                'par_type' => collect(Evaluation::QUESTIONS)->keys()
                    ->mapWithKeys(fn ($t) => [$t => $this->masque($evaluations->where('type', $t)->count())]),
                'niveaux' => collect([1, 2, 3, 4])
                    ->mapWithKeys(fn ($n) => [$n => $this->masque($derniers->filter(fn ($v) => $v === $n)->count())]),
                'par_mois' => $this->parMois($evaluations),
                'evolution' => $this->evolution($evaluations),
            ],
            'alertes' => [
                'signalees' => $this->masque($alertes->count()),
                'prises_en_charge' => $this->masque($traitees->count()),
                'en_attente' => $this->masque($alertes->whereNull('pris_en_charge_at')->count()),
                'delai_median_heures' => $delais->count() >= self::SEUIL ? round($this->mediane($delais), 1) : null,
            ],
            'consultations' => [
                'demandees' => $this->masque((clone $consultations)->count()),
                'terminees' => $this->masque((clone $consultations)->where('statut', 'terminee')->count()),
            ],
            'universites' => $this->parUniversite($derniers),
        ]]);
    }

    /** Petits effectifs masqués : null signifie « moins de SEUIL ». 0 reste affiché. */
    private function masque(int $n): ?int
    {
        return $n > 0 && $n < self::SEUIL ? null : $n;
    }

    private function mediane(Collection $v): float
    {
        $n = $v->count();
        return $n % 2 ? $v[intdiv($n, 2)] : ($v[$n / 2 - 1] + $v[$n / 2]) / 2;
    }

    private function parMois(Collection $evaluations): array
    {
        return $evaluations
            ->groupBy(fn ($e) => $e->created_at->format('Y-m'))
            ->map(fn ($g, $mois) => ['mois' => $mois, 'evaluations' => $this->masque($g->count())])
            ->values()
            ->all();
    }

    /** Étudiants ayant au moins deux questionnaires du même type : score en baisse, stable ou en hausse. */
    private function evolution(Collection $evaluations): array
    {
        $r = ['amelioration' => 0, 'stable' => 0, 'aggravation' => 0];

        foreach ($evaluations->groupBy(fn ($e) => $e->user_id . '-' . $e->type) as $serie) {
            if ($serie->count() < 2) {
                continue;
            }
            $ecart = $serie->last()->score - $serie->first()->score;
            // Variation d'au moins 5 points : seuil de changement cliniquement notable (PHQ-9 / GAD-7).
            $r[$ecart <= -5 ? 'amelioration' : ($ecart >= 5 ? 'aggravation' : 'stable')]++;
        }

        $suivis = array_sum($r);

        return ['suivis' => $this->masque($suivis)] + ($suivis >= self::SEUIL ? $r : array_fill_keys(array_keys($r), null));
    }

    private function parUniversite(Collection $derniers): array
    {
        $univ = Etudiant::whereIn('user_id', $derniers->keys())->pluck('universite', 'user_id');

        return $derniers->groupBy(fn ($n, $userId) => $univ[$userId] ?? 'Non renseignée')
            ->map(fn ($niveaux, $nom) => [
                'universite' => $nom,
                'evalues' => $this->masque($niveaux->count()),
                'niveau_3_ou_plus' => $this->masque($niveaux->filter(fn ($n) => $n >= 3)->count()),
            ])
            ->sortByDesc(fn ($u) => $u['evalues'] ?? 0)
            ->values()
            ->all();
    }
}
