<?php

namespace Tests\Feature;

use App\Models\Etudiant;
use App\Models\Psychologue;
use App\Models\User;
use App\Notifications\AlerteRisque;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AlerteRisqueTest extends TestCase
{
    use RefreshDatabase;

    private const RISQUE = [0, 0, 0, 0, 0, 0, 0, 0, 1];   // PHQ-9 question 9 > 0
    private const SANS_RISQUE = [2, 2, 2, 2, 2, 0, 0, 0, 0];

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        Http::fake();
    }

    private function etudiant(?int $referentId = null): User
    {
        $u = User::factory()->create(['role' => 'etudiant', 'statut' => 'actif']);
        Etudiant::create(['user_id' => $u->id, 'numero_carte_etudiant' => 'T-'.$u->id, 'universite' => 'UCAD',
            'faculte' => 'Lettres', 'niveau' => 'L1', 'psy_referent_id' => $referentId]);
        return $u;
    }

    private function psy(bool $urgence = false): User
    {
        $u = User::factory()->create(['role' => 'psychologue', 'statut' => 'actif', 'push_token' => 'ExponentPushToken[test-'.uniqid().']']);
        Psychologue::create(['user_id' => $u->id, 'numero_ordre' => 'P-'.$u->id, 'urgence' => $urgence]);
        return $u;
    }

    private function remplir(User $etu, array $reponses): int
    {
        Sanctum::actingAs($etu);
        return $this->postJson('/api/evaluations', ['type' => 'phq9', 'reponses' => $reponses])
            ->assertCreated()->json('data.id');
    }

    public function test_le_psy_referent_est_prevenu_en_priorite(): void
    {
        $referent = $this->psy();
        $urgence = $this->psy(urgence: true);
        $this->remplir($this->etudiant($referent->psychologue->id), self::RISQUE);

        Notification::assertSentTo($referent, AlerteRisque::class);
        Notification::assertNotSentTo($urgence, AlerteRisque::class);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'exp.host')
            && collect($r->data())->pluck('to')->contains($referent->push_token));
    }

    public function test_sans_referent_les_psys_urgence_sont_prevenus(): void
    {
        $urgence = $this->psy(urgence: true);
        $autre = $this->psy();
        $this->remplir($this->etudiant(), self::RISQUE);

        Notification::assertSentTo($urgence, AlerteRisque::class);
        Notification::assertNotSentTo($autre, AlerteRisque::class);
    }

    public function test_sans_psy_urgence_les_admins_sont_prevenus(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'statut' => 'actif']);
        $this->remplir($this->etudiant(), self::RISQUE);

        Notification::assertSentTo($admin, AlerteRisque::class);
    }

    public function test_pas_dalerte_sans_risque(): void
    {
        $this->psy(urgence: true);
        $this->remplir($this->etudiant(), self::SANS_RISQUE);

        Notification::assertNothingSent();
        Http::assertNothingSent();
    }

    public function test_le_psy_voit_puis_traite_lalerte(): void
    {
        $urgence = $this->psy(urgence: true);
        $id = $this->remplir($etu = $this->etudiant(), self::RISQUE);

        Sanctum::actingAs($urgence);
        $this->getJson('/api/alertes')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.etudiant.email', $etu->email);
        $this->getJson("/api/etudiants/{$etu->etudiant->id}/evaluations")->assertOk();

        $this->postJson("/api/alertes/$id/prise-en-charge", ['note' => 'Appelé, RDV demain'])->assertOk();
        $this->getJson('/api/alertes')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_un_psy_non_concerne_ne_voit_pas_lalerte(): void
    {
        $this->psy(urgence: true);
        $autre = $this->psy();
        $id = $this->remplir($this->etudiant(), self::RISQUE);

        Sanctum::actingAs($autre);
        $this->getJson('/api/alertes')->assertOk()->assertJsonCount(0, 'data');
        $this->postJson("/api/alertes/$id/prise-en-charge")->assertStatus(403);
    }
}
