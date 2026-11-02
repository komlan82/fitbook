<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SPORTIF')]
class FavoriController extends ApiController
{
    #[Route('/api/favoris/salles', name: 'api_favoris', methods: ['GET'])]
    public function liste(Connection $db): JsonResponse
    {
        return new JsonResponse($db->fetchAllAssociative(
            'SELECT s.id_salle AS id, s.nom, s.ville, f.date_ajout AS dateAjout
             FROM favoriser_salle f JOIN salle s ON s.id_salle = f.id_salle
             WHERE f.id_utilisateur = :u ORDER BY f.date_ajout DESC',
            ['u' => $this->userId()],
        ));
    }

    #[Route('/api/favoris/salles/{id}', name: 'api_favori_ajouter', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function ajouter(int $id, Connection $db): JsonResponse
    {
        $existe = $db->fetchOne("SELECT COUNT(*) FROM salle WHERE id_salle = :id AND statut_validation = 'validee'", ['id' => $id]);
        if (!$existe) {
            return $this->erreur('Salle introuvable.', 404);
        }
        $db->executeStatement('INSERT IGNORE INTO favoriser_salle (id_utilisateur, id_salle) VALUES (:u, :s)', ['u' => $this->userId(), 's' => $id]);

        return new JsonResponse(['message' => 'Ajoutée aux favoris.'], 201);
    }

    #[Route('/api/favoris/salles/{id}', name: 'api_favori_retirer', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function retirer(int $id, Connection $db): JsonResponse
    {
        $db->executeStatement('DELETE FROM favoriser_salle WHERE id_utilisateur = :u AND id_salle = :s', ['u' => $this->userId(), 's' => $id]);

        return new JsonResponse(['message' => 'Retirée des favoris.']);
    }
}
