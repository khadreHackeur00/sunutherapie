<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('consentement_at')->nullable()->after('statut');
            $table->string('consentement_version', 20)->nullable()->after('consentement_at');
        });

        // Questionnaires de dépistage (PHQ-9, GAD-7) remplis par les étudiants.
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10);            // phq9 | gad7
            $table->json('reponses');               // [0..3, ...]
            $table->unsignedTinyInteger('score');
            $table->string('severite', 30);         // minimale, legere, moderee, moderement_severe, severe
            $table->boolean('risque')->default(false); // PHQ-9 question 9 > 0
            $table->unsignedTinyInteger('niveau_propose'); // 1 à 4 (modèle par étapes), à valider par un professionnel
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['consentement_at', 'consentement_version']);
        });
    }
};
