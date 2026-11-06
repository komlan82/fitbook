<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** Liste publique des coachs (onglet « Coachs » de la recherche). Aucune donnée personnelle sensible : prénom + initiale du nom. */
class CoachPublicController extends ApiController
{
    #[Route('/api/coachs', name: 'api_coachs_public', methods: ['GET'])]
    public function liste(Connection $db): JsonResponse
    {
        return new JsonResponse($db->fetchAllAssociative(
            "SELECT c.id_coach AS id,
                    CONCAT(u.prenom, ' ', LEFT(u.nom, 1), '.') AS nom,
                    c.tarif_horaire AS tarif,
                    (SELECT GROUP_CONCAT(d.libelle ORDER BY d.libelle SEPARATOR ', ')
                       FROM specialiser sp JOIN discipline d ON d.id_discipline = sp.id_discipline
                      WHERE sp.id_coach = c.id_coach) AS disciplines,
                    ROUND((SELECT AVG(a.note) FROM avis a WHERE a.id_coach = c.id_coach AND a.visible = 1), 1) AS noteMoyenne,
                    (SELECT COUNT(*) FROM avis a WHERE a.id_coach = c.id_coach AND a.visible = 1) AS nbAvis
             FROM coach c
             JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
             ORDER BY u.prenom, u.nom",
        ));
    }
}
