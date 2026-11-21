<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Etudiant;
use App\Models\Evaluation;
use App\Models\Psychologue;
use App\Models\User;
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
            || Consultation::where('etudiant_id', $etudiant->id)->where('psychologue_id', $psy->id)->exists();

        if (! $suit) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $data = Evaluation::where('user_id', $etudiant->user_id)->latest()->get();

        return response()->json(['success' => true, 'data' => $data]);
    }
}
