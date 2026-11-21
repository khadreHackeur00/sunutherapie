<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Etudiant;
use App\Models\Evaluation;
use App\Models\Psychologue;
use App\Models\User;
use App\Services\AlerteRisqueService;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EvaluationController extends Controller
{
    public const VERSION_CONSENTEMENT = '2026-11';

    // ─── Consentement (étudiant) ───
    public function consentir(Request $request)
    {
        $request->validate(['accepte' => 'accepted']);

        $user = $request->user();
        $user->forceFill([
            'consentement_at' => now(),
            'consentement_version' => self::VERSION_CONSENTEMENT,
        ])->save();

        return response()->json(['success' => true, 'user' => $user]);
    }

    // ─── Enregistrer un questionnaire (étudiant) ───
    public function store(Request $request)
    {
        $type = $request->input('type');
        $n = Evaluation::QUESTIONS[$type] ?? 0;

        $request->validate([
            'type' => ['required', Rule::in(array_keys(Evaluation::QUESTIONS))],
            'reponses' => ['required', 'array', "size:$n"],
            'reponses.*' => ['required', 'integer', 'between:0,3'],
        ]);

        $reponses = array_map('intval', array_values($request->input('reponses')));
        $evaluation = Evaluation::create(
            ['user_id' => $request->user()->id, 'type' => $type, 'reponses' => $reponses]
            + Evaluation::calculer($type, $reponses)
        );

        // Niveau 4 : prévenir tout de suite le psy référent ou les psys d'urgence.
        if ($evaluation->risque) {
            try {
                app(AlerteRisqueService::class)->declencher($evaluation);
            } catch (\Throwable $e) {
                Log::error('Alerte risque non envoyée : ' . $e->getMessage());
            }
        }

        return response()->json(['success' => true, 'data' => $evaluation], 201);
    }

    // ─── Mes évaluations (étudiant) ───
    public function mesEvaluations(Request $request)
    {
        $data = Evaluation::where('user_id', $request->user()->id)->latest()->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─── Évaluations d'un étudiant (psy qui le suit) ───
    public function evaluationsEtudiant(Request $request, $etudiantId)
    {
        $psy = Psychologue::where('user_id', $request->user()->id)->first();
        $etudiant = Etudiant::find($etudiantId);

        if (! $psy || ! $etudiant) {
            return response()->json(['success' => false, 'message' => 'Introuvable'], 404);
        }

        $suit = (int) $etudiant->psy_referent_id === (int) $psy->id
            || Consultation::where('etudiant_id', $etudiant->id)->where('psychologue_id', $psy->id)->exists()
            || (Evaluation::where('user_id', $etudiant->user_id)->where('risque', true)->exists()
                && app(AlerteRisqueService::class)->psyConcerne($psy, $etudiant));

        if (! $suit) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $data = Evaluation::where('user_id', $etudiant->user_id)->latest()->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─── Alertes de risque à traiter (psy référent ou psy d'urgence) ───
    public function alertes(Request $request)
    {
        $psy = Psychologue::where('user_id', $request->user()->id)->first();
        if (! $psy) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $service = app(AlerteRisqueService::class);
        $alertes = Evaluation::with('user.etudiant')
            ->where('risque', true)
            ->whereNull('pris_en_charge_at')
            ->latest()
            ->get()
            ->filter(fn ($e) => $e->user?->etudiant && $service->psyConcerne($psy, $e->user->etudiant))
            ->map(fn ($e) => [
                'id' => $e->id,
                'type' => $e->type,
                'score' => $e->score,
                'severite' => $e->severite,
                'created_at' => $e->created_at,
                'etudiant' => [
                    'id' => $e->user->etudiant->id,
                    'name' => $e->user->name,
                    'email' => $e->user->email,
                    'telephone' => $e->user->telephone,
                    'universite' => $e->user->etudiant->universite,
                ],
            ])
            ->values();

        return response()->json(['success' => true, 'data' => $alertes]);
    }

    // ─── Marquer une alerte comme prise en charge ───
    public function prendreEnCharge(Request $request, $id)
    {
        $request->validate(['note' => 'nullable|string|max:2000']);

        $psy = Psychologue::where('user_id', $request->user()->id)->first();
        $evaluation = Evaluation::with('user.etudiant')->where('risque', true)->find($id);

        if (! $psy || ! $evaluation || ! $evaluation->user?->etudiant
            || ! app(AlerteRisqueService::class)->psyConcerne($psy, $evaluation->user->etudiant)) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $evaluation->update([
            'pris_en_charge_at' => now(),
            'pris_en_charge_par' => $request->user()->id,
            'note_prise_en_charge' => $request->input('note'),
        ]);

        return response()->json(['success' => true, 'data' => $evaluation]);
    }
}
