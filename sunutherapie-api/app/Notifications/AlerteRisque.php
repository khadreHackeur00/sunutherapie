<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

// E-mail sans donnée clinique : les détails ne sont visibles qu'une fois connecté.
class AlerteRisque extends Notification
{
    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Alerte SunuThérapie : un étudiant à recontacter en priorité')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Un étudiant vient de signaler un risque dans un questionnaire d'évaluation.")
            ->line('Merci de le recontacter en priorité, puis d\'indiquer la prise en charge dans votre espace.')
            ->action('Ouvrir mon espace', 'https://app.sunutherapi.com')
            ->salutation("L'équipe SunuThérapie");
    }
}
