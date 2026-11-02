<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception as DbalException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Formulaire de contact (public, hors connexion).
 * Le document JSON est validé par MySQL via JSON_SCHEMA_VALID (contrainte CHECK de database/05_json_schema.sql).
 */
class ContactController extends ApiController
{
    #[Route('/api/contact', name: 'api_contact', methods: ['POST'])]
    public function envoyer(Request $request, Connection $db): JsonResponse
    {
        $d = $this->body($request);
        $doc = [
            'nom' => $d['nom'] ?? null,
            'email' => $d['email'] ?? null,
            'message' => $d['message'] ?? null,
        ];
        try {
            $db->executeStatement(
                'INSERT INTO message_contact (donnees) VALUES (:j)',
                ['j' => json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)],
            );
        } catch (DbalException) {
            return $this->erreur('Message refusé : nom (2-80), email valide et message (10-1000 caractères) sont obligatoires.', 422);
        }

        return new JsonResponse(['message' => 'Message envoyé, merci !'], 201);
    }
}
