<?php

namespace Database\Seeders;

use App\Models\Etudiant;
use App\Models\Evaluation;
use App\Models\Psychologue;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Comptes de démonstration pour tester l'app en local.
 * php artisan db:seed --class=DemoSeeder
 * Refuse de tourner hors environnement local.
 */
class DemoSeeder extends Seeder
{
    public const PASSWORD = 'demo-sunu-local-2026';

    public function run(): void
    {
        if (! app()->environment('local')) {
            $this->command?->error('DemoSeeder ne tourne qu\'en local.');
            return;
        }

        $psyUser = User::updateOrCreate(
            ['email' => 'psy.demo@sunutherapie.test'],
            [
                'name' => 'Dr Awa Demo',
                'password' => Hash::make(self::PASSWORD),
                'role' => 'psychologue',
                'statut' => 'actif',
                'email_verified' => true,
            ]
        );
        $psy = Psychologue::updateOrCreate(
            ['user_id' => $psyUser->id],
            [
                'numero_ordre' => 'DEMO-001',
                'specialites' => ['Anxiété', 'Stress des examens'],
                'bio' => 'Compte de démonstration.',
                'etablissement' => 'Centre de démo',
                'annees_experience' => 8,
                'disponible' => true,
                'urgence' => true,
            ]
        );

        $etuUser = User::updateOrCreate(
            ['email' => 'etudiant.demo@sunutherapie.test'],
            [
                'name' => 'Moussa Demo',
                'password' => Hash::make(self::PASSWORD),
                'role' => 'etudiant',
                'statut' => 'actif',
                'email_verified' => true,
            ]
        );
        Etudiant::updateOrCreate(
            ['user_id' => $etuUser->id],
            [
                'numero_carte_etudiant' => 'DEMO-ETU-001',
                'universite' => 'UCAD',
                'faculte' => 'Lettres',
                'niveau' => 'L2',
            ]
        );

        // Administrateur de démo (tableau de bord).
        User::updateOrCreate(
            ['email' => 'admin.demo@sunutherapie.test'],
            ['name' => 'Admin Demo', 'password' => Hash::make(self::PASSWORD), 'role' => 'admin',
             'statut' => 'actif', 'email_verified' => true]
        );

        // Étudiants fictifs avec des questionnaires sur 4 mois, pour remplir le tableau de bord.
        $universites = ['UCAD', 'UGB', 'UASZ', 'UIDT'];
        mt_srand(42);
        foreach (range(1, 40) as $i) {
            $u = User::updateOrCreate(
                ['email' => "etudiant{$i}.demo@sunutherapie.test"],
                ['name' => "Étudiant démo $i", 'password' => Hash::make(self::PASSWORD), 'role' => 'etudiant',
                 'statut' => 'actif', 'email_verified' => true, 'consentement_at' => now()]
            );
            Etudiant::updateOrCreate(['user_id' => $u->id], [
                'numero_carte_etudiant' => "DEMO-ETU-1$i", 'universite' => $universites[$i % 4],
                'faculte' => 'Lettres', 'niveau' => 'L2',
            ]);
            Evaluation::where('user_id', $u->id)->delete();

            $score = mt_rand(3, 22);
            $quand = now()->subDays(mt_rand(60, 120));
            foreach (range(1, mt_rand(1, 3)) as $_) {
                $type = mt_rand(0, 1) ? 'phq9' : 'gad7';
                $n = Evaluation::QUESTIONS[$type];
                $s = min($score, $n * 3);
                $reponses = array_map(fn ($k) => intdiv($s, $n) + ($k < $s % $n ? 1 : 0), range(0, $n - 1));
                if ($type === 'phq9') {
                    $reponses[8] = mt_rand(0, 9) === 0 ? 1 : 0;
                }
                $e = Evaluation::create(['user_id' => $u->id, 'type' => $type, 'reponses' => $reponses]
                    + Evaluation::calculer($type, $reponses));
                $e->forceFill([
                    'created_at' => $quand,
                    'pris_en_charge_at' => $e->risque && mt_rand(0, 4) ? $quand->copy()->addHours(mt_rand(1, 30)) : null,
                ])->save();
                $score = max(0, $score - mt_rand(-3, 8));
                $quand = $quand->copy()->addDays(mt_rand(14, 35));
            }
        }
    }
}
