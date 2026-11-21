<?php

namespace App\Services;

use App\Models\Etudiant;
use App\Models\Evaluation;
use App\Models\Psychologue;
use App\Models\User;
use App\Notifications\AlerteRisque;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Niveau 4 du modèle par étapes : un étudiant a signalé un risque (PHQ-9, question 9).
 * Qui est prévenu :
 *  1. son psy référent s'il en a un ;
 *  2. sinon les psys « urgence » actifs ;
 *  3. sinon les administrateurs, pour que l'alerte ne se perde jamais.
 */
class AlerteRisqueService
{
    public function psychologuesConcernes(Etudiant $etudiant): Collection
    {
        if ($etudiant->psy_referent_id) {
            $ref = Psychologue::with('user')->find($etudiant->psy_referent_id);
            if ($ref && $ref->user && $ref->user->statut === 'actif') {
                return collect([$ref]);
            }
        }

        return Psychologue::with('user')
            ->where('urgence', true)
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
            ->get();
    }

    public function destinataires(Etudiant $etudiant): Collection
    {
        $users = $this->psychologuesConcernes($etudiant)->pluck('user')->filter();

        return $users->isNotEmpty()
            ? $users
            : User::where('role', 'admin')->where('statut', 'actif')->get();
    }

    /** Un psy peut-il voir et traiter les alertes de cet étudiant ? */
    public function psyConcerne(Psychologue $psy, Etudiant $etudiant): bool
    {
        return $this->psychologuesConcernes($etudiant)->contains('id', $psy->id);
    }

    public function declencher(Evaluation $evaluation): void
    {
        $etudiant = Etudiant::where('user_id', $evaluation->user_id)->first();
        if (! $etudiant) {
            return;
        }

        $destinataires = $this->destinataires($etudiant);

        // Message volontairement neutre : une notification peut s'afficher sur un écran verrouillé.
        (new ExpoPushService())->sendMany(
            $destinataires->pluck('push_token')->filter()->all(),
            'Alerte : un étudiant à recontacter',
            'Un étudiant a besoin d\'être recontacté en priorité. Ouvrez SunuThérapie.',
            ['type' => 'alerte_risque', 'evaluation_id' => $evaluation->id]
        );

        foreach ($destinataires as $user) {
            try {
                $user->notify(new AlerteRisque());
            } catch (\Throwable $e) {
                Log::error('AlerteRisque mail: ' . $e->getMessage());
            }
        }
    }
}
