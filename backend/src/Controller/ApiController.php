<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/** Base commune : lecture du corps JSON et réponses d'erreur homogènes. */
abstract class ApiController extends AbstractController
{
    protected function body(Request $request): array
    {
        $data = json_decode($request->getContent() ?: '[]', true);

        return is_array($data) ? $data : [];
    }

    protected function erreur(string $message, int $status = 400, array $details = []): JsonResponse
    {
        return new JsonResponse(['erreur' => $message] + ($details ? ['details' => $details] : []), $status);
    }

    protected function userId(): int
    {
        $u = $this->getUser();
        if (!$u instanceof Utilisateur) {
            throw $this->createAccessDeniedException();
        }

        return (int) $u->getId();
    }

    protected function userArray(Utilisateur $u): array
    {
        return [
            'id' => $u->getId(),
            'nom' => $u->getNom(),
            'prenom' => $u->getPrenom(),
            'email' => $u->getEmail(),
            'role' => $u->getRole(),
        ];
    }
}
