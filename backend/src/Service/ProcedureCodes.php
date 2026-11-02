<?php

namespace App\Service;

/** Traduit les codes retournés par les procédures stockées en statut HTTP + message. */
final class ProcedureCodes
{
    private const MAP = [
        'OK' => [201, 'Opération réussie.'],
        'COMPLETE' => [409, 'Cette séance est complète.'],
        'DEJA_RESERVEE' => [409, 'Vous avez déjà réservé cette séance.'],
        'SEANCE_FERMEE' => [409, "Cette séance n'est plus ouverte à la réservation."],
        'SEANCE_INTROUVABLE' => [404, 'Séance introuvable.'],
        'TROP_TARD' => [409, "La séance a déjà commencé : l'annulation n'est plus possible."],
        'RESERVATION_INTROUVABLE' => [404, 'Réservation introuvable.'],
        'UNE_SEULE_CIBLE' => [422, 'Un avis porte sur une salle OU sur un coach, pas les deux.'],
        'NOTE_INVALIDE' => [422, 'La note doit être comprise entre 1 et 5.'],
        'SEANCE_NON_SUIVIE' => [403, 'Vous ne pouvez noter que ce dont vous avez suivi une séance.'],
        'ERREUR_SQL' => [500, 'Erreur interne lors du traitement.'],
    ];

    public static function status(?string $code): int
    {
        return self::MAP[$code ?? ''][0] ?? 500;
    }

    public static function message(?string $code): string
    {
        return self::MAP[$code ?? ''][1] ?? 'Erreur inconnue.';
    }

    public static function isOk(?string $code): bool
    {
        return $code === 'OK';
    }
}
