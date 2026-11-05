<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Zones protégées par rôle (gestionnaire / administrateur) : démontrent le contrôle des permissions. */
class EspaceController extends ApiController
{
    #[Route('/api/gestionnaire/salles', name: 'api_gestionnaire_salles', methods: ['GET'])]
    #[IsGranted('ROLE_GESTIONNAIRE')]
    public function sallesDuGestionnaire(Connection $db): JsonResponse
    {
        return new JsonResponse($db->fetchAllAssociative(
            'SELECT id_salle AS id, nom, ville, statut_validation AS statutValidation FROM salle WHERE id_gestionnaire = :u ORDER BY nom',
            ['u' => $this->userId()],
        ));
    }

    #[Route('/api/admin/utilisateurs', name: 'api_admin_utilisateurs', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function utilisateurs(Connection $db): JsonResponse
    {
        // Jamais de colonne mot_de_passe dans une réponse.
        return new JsonResponse($db->fetchAllAssociative(
            'SELECT id_utilisateur AS id, nom, prenom, email, role, email_confirme AS emailConfirme FROM utilisateur ORDER BY id_utilisateur',
        ));
    }

    #[Route('/api/admin/salles', name: 'api_admin_salles', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function sallesAdmin(Connection $db): JsonResponse
    {
        // Toutes les salles, celles à valider (en attente) en premier.
        return new JsonResponse($db->fetchAllAssociative(
            "SELECT s.id_salle AS id, s.nom, s.adresse, s.ville, s.statut_validation AS statutValidation,
                    CONCAT(u.prenom, ' ', u.nom) AS gestionnaire
             FROM salle s JOIN utilisateur u ON u.id_utilisateur = s.id_gestionnaire
             ORDER BY FIELD(s.statut_validation, 'en_attente', 'validee', 'refusee'), s.nom",
        ));
    }

    #[Route('/api/admin/salles/{id}/validation', name: 'api_admin_validation', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function valider(int $id, Request $request, Connection $db): JsonResponse
    {
        $statut = $this->body($request)['statut'] ?? null;
        if (!in_array($statut, ['validee', 'refusee'], true)) {
            return $this->erreur("statut doit valoir 'validee' ou 'refusee'.", 422);
        }
        $n = $db->executeStatement('UPDATE salle SET statut_validation = :s WHERE id_salle = :id', ['s' => $statut, 'id' => $id]);

        return $n ? new JsonResponse(['message' => 'Statut mis à jour.']) : $this->erreur('Salle introuvable.', 404);
    }
}
