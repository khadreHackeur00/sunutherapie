<?php

namespace Tests\Feature;

use App\Models\Etudiant;
use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReevaluationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake();
    }

    private function etudiant(): User
    {
        $u = User::factory()->create(['role' => 'etudiant', 'statut' => 'actif', 'consentement_at' => now(),
            'push_token' => 'ExponentPushToken[test-'.uniqid().']']);
        Etudiant::create(['user_id' => $u->id, 'numero_carte_etudiant' => 'T-'.$u->id,
            'universite' => 'UCAD', 'faculte' => 'Lettres', 'niveau' => 'L1']);
        return $u;
    }

    private function evaluation(User $u, int $niveau, $quand): void
    {
        $e = Evaluation::create(['user_id' => $u->id, 'type' => 'gad7', 'reponses' => [0, 0, 0, 0, 0, 0, 0],
            'score' => 0, 'severite' => 'minimale', 'risque' => false, 'niveau_propose' => $niveau]);
        $e->forceFill(['created_at' => $quand])->save();
    }

    public function test_sans_evaluation_il_faut_faire_le_point(): void
    {
        Sanctum::actingAs($this->etudiant());
        $this->getJson('/api/evaluations/prochaine')->assertOk()->assertJsonPath('data.a_faire', true);
    }

    public function test_le_delai_depend_du_niveau(): void
    {
        $u = $this->etudiant();
        $this->evaluation($u, 3, now()->subDays(10));   // niveau 3 : 14 jours
        Sanctum::actingAs($u);
        $this->getJson('/api/evaluations/prochaine')->assertOk()
            ->assertJsonPath('data.delai_jours', 14)
            ->assertJsonPath('data.a_faire', false);

        $this->evaluation($u, 3, now()->subDays(15));
        // La plus récente (il y a 10 jours) reste la référence.
        $this->getJson('/api/evaluations/prochaine')->assertJsonPath('data.a_faire', false);
    }

    public function test_rappel_envoye_une_seule_fois_par_echeance(): void
    {
        $due = $this->etudiant();
        $this->evaluation($due, 2, now()->subDays(30));     // 28 jours : échu
        $pasDue = $this->etudiant();
        $this->evaluation($pasDue, 2, now()->subDays(5));

        $this->artisan('evaluations:rappels')->expectsOutput('1 rappel(s) envoyé(s).')->assertSuccessful();
        $this->assertNotNull($due->fresh()->rappel_evaluation_at);
        $this->assertNull($pasDue->fresh()->rappel_evaluation_at);

        // Relancer le même jour ne renvoie rien.
        $this->artisan('evaluations:rappels')->expectsOutput('0 rappel(s) envoyé(s).');
        Http::assertSentCount(1);
    }
}
