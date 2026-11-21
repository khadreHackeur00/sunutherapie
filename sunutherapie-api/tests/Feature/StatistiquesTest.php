<?php

namespace Tests\Feature;

use App\Models\Etudiant;
use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StatistiquesTest extends TestCase
{
    use RefreshDatabase;

    private function etudiant(string $universite = 'UCAD'): User
    {
        $u = User::factory()->create(['role' => 'etudiant', 'statut' => 'actif', 'consentement_at' => now()]);
        Etudiant::create(['user_id' => $u->id, 'numero_carte_etudiant' => 'T-'.$u->id,
            'universite' => $universite, 'faculte' => 'Lettres', 'niveau' => 'L1']);
        return $u;
    }

    private function evaluation(User $u, int $score, int $niveau, $quand, bool $risque = false): void
    {
        $e = Evaluation::create(['user_id' => $u->id, 'type' => 'phq9', 'reponses' => array_fill(0, 9, 0),
            'score' => $score, 'severite' => 'moderee', 'risque' => $risque, 'niveau_propose' => $niveau]);
        $e->forceFill(['created_at' => $quand])->save();
    }

    public function test_reserve_aux_administrateurs(): void
    {
        Sanctum::actingAs($this->etudiant());
        $this->getJson('/api/statistiques')->assertStatus(403);

        Sanctum::actingAs(User::factory()->create(['role' => 'psychologue', 'statut' => 'actif']));
        $this->getJson('/api/statistiques')->assertStatus(403);
    }

    public function test_les_petits_effectifs_sont_masques(): void
    {
        $this->evaluation($this->etudiant(), 10, 2, now()->subDay());
        $this->evaluation($this->etudiant(), 10, 2, now()->subDay());

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'statut' => 'actif']));
        $this->getJson('/api/statistiques')->assertOk()
            ->assertJsonPath('data.evaluations.total', null)      // 2 < 5 : masqué
            ->assertJsonPath('data.evaluations.niveaux.4', 0)     // 0 reste affiché
            ->assertJsonPath('data.alertes.delai_median_heures', null);
    }

    public function test_niveaux_evolution_et_alertes(): void
    {
        $etudiants = collect(range(1, 6))->map(fn () => $this->etudiant());

        foreach ($etudiants as $i => $u) {
            // Premier point il y a 20 jours (score 15), puis un second : 5 améliorations, 1 stable.
            $this->evaluation($u, 15, 3, now()->subDays(20));
            $this->evaluation($u, $i < 5 ? 6 : 14, $i < 5 ? 2 : 3, now()->subDays(2), risque: true);
        }
        // Alertes prises en charge 3 h après.
        Evaluation::where('risque', true)->get()->each(fn ($e) => $e->forceFill(['pris_en_charge_at' => $e->created_at->copy()->addHours(3)])->save());

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'statut' => 'actif']));
        $r = $this->getJson('/api/statistiques?periode=30')->assertOk();

        $r->assertJsonPath('data.etudiants.evalues', 6)
          ->assertJsonPath('data.evaluations.total', 12)
          ->assertJsonPath('data.evaluations.niveaux.2', 5)
          ->assertJsonPath('data.evaluations.niveaux.3', null)   // 1 étudiant : masqué
          ->assertJsonPath('data.evaluations.evolution.amelioration', 5)
          ->assertJsonPath('data.alertes.signalees', 6)
          ->assertJsonPath('data.alertes.en_attente', 0)
          ->assertJsonPath('data.alertes.delai_median_heures', 3);
    }

    public function test_la_periode_filtre_les_evaluations(): void
    {
        foreach (range(1, 5) as $_) {
            $this->evaluation($this->etudiant(), 5, 2, now()->subDays(60));
        }
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'statut' => 'actif']));
        $this->getJson('/api/statistiques?periode=30')->assertJsonPath('data.evaluations.total', 0);
        $this->getJson('/api/statistiques?periode=90')->assertJsonPath('data.evaluations.total', 5);
        $this->getJson('/api/statistiques?periode=7')->assertStatus(422);
    }
}
