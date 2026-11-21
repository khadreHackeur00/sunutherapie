<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rappels de réévaluation, chaque jour à 10 h (heure de Dakar = UTC).
Schedule::command('evaluations:rappels')->dailyAt('10:00');
