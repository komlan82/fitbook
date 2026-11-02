<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** Journal des sauvegardes : alimente le message visible côté client. */
class SauvegardeController extends ApiController
{
    #[Route('/api/sauvegardes', name: 'api_sauvegardes', methods: ['GET'])]
    public function liste(Connection $db): JsonResponse
    {
        $lignes = $db->fetchAllAssociative(
            'SELECT id_sauvegarde AS numero, fichier, taille_octets AS tailleOctets, date_sauvegarde AS date, statut
             FROM sauvegarde_journal ORDER BY id_sauvegarde DESC',
        );
        $derniere = $lignes[0] ?? null;

        return new JsonResponse([
            'total' => count($lignes),
            'message' => $derniere
                ? sprintf('Sauvegarde n°%d effectuée le %s (%s) — %d sauvegarde(s) au total.', $derniere['numero'], $derniere['date'], $derniere['fichier'], count($lignes))
                : 'Aucune sauvegarde effectuée.',
            'sauvegardes' => $lignes,
        ]);
    }
}
