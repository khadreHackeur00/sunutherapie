<?php

namespace Database\Seeders;

use App\Models\Etudiant;
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
    }
}
