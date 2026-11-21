<?php

namespace Tests\Unit;

use App\Models\Evaluation;
use PHPUnit\Framework\TestCase;

class EvaluationScoreTest extends TestCase
{
    public function test_phq9_minimale_donne_niveau_1(): void
    {
        $r = Evaluation::calculer('phq9', [0, 1, 0, 1, 0, 0, 1, 0, 0]);
        $this->assertSame(3, $r['score']);
        $this->assertSame('minimale', $r['severite']);
        $this->assertFalse($r['risque']);
        $this->assertSame(1, $r['niveau_propose']);
    }

    public function test_phq9_seuils_de_severite(): void
    {
        $this->assertSame('legere', Evaluation::calculer('phq9', [1, 1, 1, 1, 1, 0, 0, 0, 0])['severite']);       // 5
        $this->assertSame('moderee', Evaluation::calculer('phq9', [2, 2, 2, 2, 2, 0, 0, 0, 0])['severite']);      // 10
        $this->assertSame('moderement_severe', Evaluation::calculer('phq9', [3, 3, 3, 3, 3, 0, 0, 0, 0])['severite']); // 15
        $this->assertSame('severe', Evaluation::calculer('phq9', [3, 3, 3, 3, 3, 3, 2, 0, 0])['severite']);       // 20
    }

    public function test_phq9_question_9_declenche_le_risque_et_le_niveau_4(): void
    {
        $r = Evaluation::calculer('phq9', [0, 0, 0, 0, 0, 0, 0, 0, 1]);
        $this->assertTrue($r['risque']);
        $this->assertSame(4, $r['niveau_propose']);
    }

    public function test_gad7_niveaux(): void
    {
        $this->assertSame(2, Evaluation::calculer('gad7', [2, 2, 2, 2, 2, 0, 0])['niveau_propose']); // 10 modérée
        $r = Evaluation::calculer('gad7', [3, 3, 3, 3, 3, 0, 0]);                                   // 15 sévère
        $this->assertSame('severe', $r['severite']);
        $this->assertSame(3, $r['niveau_propose']);
        $this->assertFalse($r['risque']);
    }
}
