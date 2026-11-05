<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SPORTIF')]
class MesAvisController extends ApiController
{
    /** Les avis publiés par le sportif connecté (salles et coachs). */
    #[Route('/api/mes-avis', name: 'api_mes_avis', methods: ['GET'])]
    public function liste(Connection $db): JsonResponse
    {
        return new JsonResponse($db->fetchAllAssociative(
            "SELECT a.id_avis AS id,
                    IF(a.id_salle IS NOT NULL, 'salle', 'coach') AS type,
                    COALESCE(sa.nom, CONCAT(uc.prenom, ' ', uc.nom)) AS cible,
                    a.note, a.commentaire, a.date_avis AS dateAvis, a.visible
             FROM avis a
             LEFT JOIN salle sa ON sa.id_salle = a.id_salle
             LEFT JOIN coach c ON c.id_coach = a.id_coach
             LEFT JOIN utilisateur uc ON uc.id_utilisateur = c.id_utilisateur
             WHERE a.id_utilisateur = :u
             ORDER BY a.date_avis DESC, a.id_avis DESC",
            ['u' => $this->userId()],
        ));
    }
}
