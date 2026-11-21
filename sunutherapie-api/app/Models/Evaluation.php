<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = ['user_id', 'type', 'reponses', 'score', 'severite', 'risque', 'niveau_propose',
        'pris_en_charge_at', 'pris_en_charge_par', 'note_prise_en_charge'];

    protected $casts = [
        'reponses' => 'array',
        'risque' => 'boolean',
        'pris_en_charge_at' => 'datetime',
    ];

    public const QUESTIONS = ['phq9' => 9, 'gad7' => 7];

    /**
     * Délai avant de refaire le point, selon le dernier niveau proposé (en jours).
     * Plus la gêne est forte, plus le suivi est rapproché. À valider par l'équipe clinique.
     */
    public const DELAIS_REEVALUATION = [1 => 56, 2 => 28, 3 => 14, 4 => 7];

    /** Prochaine évaluation conseillée pour un étudiant. */
    public static function prochaine(int $userId): array
    {
        $derniere = static::where('user_id', $userId)->latest()->latest('id')->first();

        if (! $derniere) {
            return ['derniere_at' => null, 'niveau' => null, 'delai_jours' => null, 'a_faire_le' => null, 'a_faire' => true];
        }

        $delai = self::DELAIS_REEVALUATION[$derniere->niveau_propose] ?? 28;
        $due = $derniere->created_at->copy()->addDays($delai);

        return [
            'derniere_at' => $derniere->created_at,
            'niveau' => $derniere->niveau_propose,
            'delai_jours' => $delai,
            'a_faire_le' => $due,
            'a_faire' => now()->greaterThanOrEqualTo($due),
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Score, sévérité, risque et niveau proposé à partir des réponses (0 à 3 chacune).
     * Seuils standard : PHQ-9 (Kroenke 2001) et GAD-7 (Spitzer 2006).
     */
    public static function calculer(string $type, array $reponses): array
    {
        $score = array_sum($reponses);

        $severite = match (true) {
            $score <= 4 => 'minimale',
            $score <= 9 => 'legere',
            $score <= 14 => 'moderee',
            $type === 'phq9' && $score <= 19 => 'moderement_severe',
            default => 'severe',
        };

        // PHQ-9 question 9 : pensées de mort ou d'automutilation.
        $risque = $type === 'phq9' && ($reponses[8] ?? 0) > 0;

        $niveau = match (true) {
            $risque => 4,
            in_array($severite, ['moderement_severe', 'severe'], true) => 3,
            in_array($severite, ['legere', 'moderee'], true) => 2,
            default => 1,
        };

        return compact('score', 'severite', 'risque') + ['niveau_propose' => $niveau];
    }
}
