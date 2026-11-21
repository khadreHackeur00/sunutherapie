<?php

namespace App\Console\Commands;

use App\Models\Evaluation;
use App\Models\User;
use App\Services\ExpoPushService;
use Illuminate\Console\Command;

// Rappel push aux étudiants dont la réévaluation est due (une seule fois par échéance).
class RappelsEvaluation extends Command
{
    protected $signature = 'evaluations:rappels';
    protected $description = 'Rappelle aux étudiants de refaire le point quand leur réévaluation est due';

    public function handle(ExpoPushService $push): int
    {
        $envoyes = 0;

        User::where('role', 'etudiant')
            ->where('statut', 'actif')
            ->whereNotNull('consentement_at')
            ->whereNotNull('push_token')
            ->whereHas('evaluations')
            ->each(function (User $user) use ($push, &$envoyes) {
                $p = Evaluation::prochaine($user->id);
                if (! $p['a_faire'] || ($user->rappel_evaluation_at && $user->rappel_evaluation_at->gte($p['a_faire_le']))) {
                    return;
                }

                $push->send(
                    $user->push_token,
                    'Et si on refaisait le point ?',
                    'Deux minutes pour savoir comment vous allez en ce moment.',
                    ['type' => 'rappel_evaluation']
                );
                $user->forceFill(['rappel_evaluation_at' => now()])->save();
                $envoyes++;
            });

        $this->info("$envoyes rappel(s) envoyé(s).");

        return self::SUCCESS;
    }
}
