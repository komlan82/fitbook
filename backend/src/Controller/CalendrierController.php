<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Calendrier public des séances : toutes les séances ouvertes d'une période, avec les places restantes.
 * Exemple : GET /api/calendrier?debut=2026-11-02&fin=2026-11-09 (début inclus, fin exclue).
 */
class CalendrierController extends ApiController
{
    private const MAX_JOURS = 62;

    #[Route('/api/calendrier', name: 'api_calendrier', methods: ['GET'])]
    public function calendrier(Request $request, Connection $db): JsonResponse
    {
        $brutDebut = (string) $request->query->get('debut', '');
        $brutFin = (string) $request->query->get('fin', '');
        $debut = $this->date($brutDebut);
        $fin = $this->date($brutFin);

        // Une date fournie mais invalide est refusée (et non ignorée).
        if (($brutDebut !== '' && $debut === null) || ($brutFin !== '' && $fin === null)) {
            return $this->erreur('Dates invalides : utilisez le format AAAA-MM-JJ.', 422);
        }

        // Par défaut : la semaine en cours (du lundi au lundi suivant).
        if ($brutDebut === '' && $brutFin === '') {
            $debut = new \DateTimeImmutable('monday this week 00:00');
            $fin = $debut->modify('+7 days');
        } elseif ($debut === null || $fin === null) {
            return $this->erreur("Les paramètres 'debut' et 'fin' (AAAA-MM-JJ) vont ensemble.", 422);
        }
        if ($fin <= $debut) {
            return $this->erreur("'fin' doit être postérieure à 'debut'.", 422);
        }
        if ($debut->diff($fin)->days > self::MAX_JOURS) {
            return $this->erreur('La période ne peut pas dépasser ' . self::MAX_JOURS . ' jours.', 422);
        }

        $lignes = $db->fetchAllAssociative(
            "SELECT se.id_seance AS id, se.titre, se.date_debut AS dateDebut, se.date_fin AS dateFin, se.prix,
                    d.libelle AS discipline, s.id_salle AS idSalle, s.nom AS salle, s.ville,
                    CONCAT(u.prenom, ' ', u.nom) AS coach,
                    se.places_max - (SELECT COUNT(*) FROM reserver r WHERE r.id_seance = se.id_seance AND r.statut <> 'annulee') AS placesRestantes
             FROM seance se
             JOIN salle s ON s.id_salle = se.id_salle AND s.statut_validation = 'validee'
             JOIN discipline d ON d.id_discipline = se.id_discipline
             JOIN coach c ON c.id_coach = se.id_coach
             JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
             WHERE se.statut = 'ouverte' AND se.date_debut >= :debut AND se.date_debut < :fin
             ORDER BY se.date_debut",
            ['debut' => $debut->format('Y-m-d H:i:s'), 'fin' => $fin->format('Y-m-d H:i:s')],
        );

        return new JsonResponse($lignes);
    }

    /** Lit une date AAAA-MM-JJ ; null si absente ou invalide. */
    private function date(string $texte): ?\DateTimeImmutable
    {
        $d = \DateTimeImmutable::createFromFormat('!Y-m-d', $texte);
        $erreurs = \DateTimeImmutable::getLastErrors();

        return ($d && (!$erreurs || ($erreurs['warning_count'] === 0 && $erreurs['error_count'] === 0))) ? $d : null;
    }
}
