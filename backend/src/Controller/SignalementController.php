<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Signalement d'un avis par un sportif (la modération est faite par l'administrateur). */
#[IsGranted('ROLE_SPORTIF')]
class SignalementController extends ApiController
{
    #[Route('/api/avis/{id}/signalement', name: 'api_avis_signaler', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function signaler(int $id, Connection $db): JsonResponse
    {
        if (!$db->fetchOne('SELECT 1 FROM avis WHERE id_avis = :id', ['id' => $id])) {
            return $this->erreur('Avis introuvable.', 404);
        }
        $db->executeStatement('UPDATE avis SET signale = 1 WHERE id_avis = :id', ['id' => $id]);

        return new JsonResponse(['message' => "Merci, l'avis a été signalé à l'administrateur."]);
    }
}
