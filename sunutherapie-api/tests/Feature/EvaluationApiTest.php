<?php

namespace Tests\Feature;

use App\Models\Consultation;
use App\Models\Etudiant;
use App\Models\Psychologue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EvaluationApiTest extends TestCase
{
    use RefreshDatabase;

    private function etudiant(): User
    {
        $u = User::factory()->create(['role' => 'etudiant', 'statut' => 'actif']);
        Etudiant::create(['user_id' => $u->id, 'numero_carte_etudiant' => 'T-'.$u->id,
            'universite' => 'UCAD', 'faculte' => 'Lettres', 'niveau' => 'L1']);
        return $u;
    }

    private function psy(): User
    {
        $u = User::factory()->create(['role' => 'psychologue', 'statut' => 'actif']);
        Psychologue::create(['user_id' => $u->id, 'numero_ordre' => 'P-'.$u->id]);
        return $u;
    }

    public function test_consentement_est_enregistre(): void
    {
        Sanctum::actingAs($u = $this->etudiant());
        $this->postJson('/api/consentement', ['accepte' => true])->assertOk();
        $this->assertNotNull($u->fresh()->consentement_at);
    }

    public function test_consentement_refuse_sans_acceptation(): void
    {
        Sanctum::actingAs($this->etudiant());
        $this->postJson('/api/consentement', ['accepte' => false])->assertStatus(422);
    }

    public function test_etudiant_enregistre_un_phq9_avec_risque(): void
    {
        Sanctum::actingAs($this->etudiant());
        $this->postJson('/api/evaluations', ['type' => 'phq9', 'reponses' => [1, 1, 1, 1, 1, 1, 1, 1, 2]])
            ->assertCreated()
            ->assertJsonPath('data.score', 10)
            ->assertJsonPath('data.risque', true)
            ->assertJsonPath('data.niveau_propose', 4);
        $this->getJson('/api/evaluations')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_nombre_de_reponses_invalide(): void
    {
        Sanctum::actingAs($this->etudiant());
        $this->postJson('/api/evaluations', ['type' => 'gad7', 'reponses' => [1, 1, 1]])->assertStatus(422);
        $this->postJson('/api/evaluations', ['type' => 'gad7', 'reponses' => [4, 0, 0, 0, 0, 0, 0]])->assertStatus(422);
    }

    public function test_psy_voit_seulement_les_etudiants_quil_suit(): void
    {
        $etu = $this->etudiant();
        Sanctum::actingAs($etu);
        $this->postJson('/api/evaluations', ['type' => 'gad7', 'reponses' => [1, 1, 1, 1, 1, 1, 1]])->assertCreated();

        $psy = $this->psy();
        $etudiantId = $etu->etudiant->id;
        Sanctum::actingAs($psy);
        $this->getJson("/api/etudiants/$etudiantId/evaluations")->assertStatus(403);

        Consultation::create(['etudiant_id' => $etudiantId, 'psychologue_id' => $psy->psychologue->id,
            'type' => 'consultation', 'mode' => 'video', 'statut' => 'acceptee', 'date_consultation' => now()->addDay()]);
        $this->getJson("/api/etudiants/$etudiantId/evaluations")->assertOk()->assertJsonCount(1, 'data');
    }
}
