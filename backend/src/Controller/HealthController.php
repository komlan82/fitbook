<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class HealthController extends ApiController
{
    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function health(Connection $db): JsonResponse
    {
        return new JsonResponse(['api' => 'ok', 'base' => $db->fetchOne('SELECT 1') == 1 ? 'ok' : 'ko']);
    }
}
