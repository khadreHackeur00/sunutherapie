<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->timestamp('pris_en_charge_at')->nullable()->after('niveau_propose');
            $table->foreignId('pris_en_charge_par')->nullable()->after('pris_en_charge_at')
                ->constrained('users')->nullOnDelete();
            $table->text('note_prise_en_charge')->nullable()->after('pris_en_charge_par');
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pris_en_charge_par');
            $table->dropColumn(['pris_en_charge_at', 'note_prise_en_charge']);
        });
    }
};
