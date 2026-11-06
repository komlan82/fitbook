<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class UtilisateurAdminController extends ApiController
{
    /** Supprime un compte. Refusé pour soi-même et pour un autre administrateur ; 409 si des données y sont liées. */
    #[Route('/api/admin/utilisateurs/{id}', name: 'api_admin_utilisateur_supprimer', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function supprimer(int $id, Connection $db): JsonResponse
    {
        $role = $db->fetchOne('SELECT role FROM utilisateur WHERE id_utilisateur = ?', [$id]);
        if ($role === false) {
            return $this->erreur('Utilisateur introuvable.', 404);
        }
        if ($id === $this->userId()) {
            return $this->erreur('Vous ne pouvez pas supprimer votre propre compte.', 403);
        }
        if ($role === 'admin') {
            return $this->erreur('Un compte administrateur ne peut pas être supprimé.', 403);
        }
        try {
            $db->executeStatement('DELETE FROM utilisateur WHERE id_utilisateur = ?', [$id]);
        } catch (ForeignKeyConstraintViolationException) {
            return $this->erreur('Suppression impossible : des réservations, avis, séances ou salles sont liés à ce compte.', 409);
        }

        return new JsonResponse(['message' => 'Utilisateur supprimé.']);
    }
}
