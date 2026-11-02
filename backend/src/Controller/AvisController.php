<?php

namespace App\Controller;

use App\Service\ProcedureCodes;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SPORTIF')]
class AvisController extends ApiController
{
    #[Route('/api/avis', name: 'api_avis_creer', methods: ['POST'])]
    public function creer(Request $request, Connection $db): JsonResponse
    {
        $d = $this->body($request);
        $idSalle = $d['idSalle'] ?? null;
        $idCoach = $d['idCoach'] ?? null;
        $note = $d['note'] ?? null;
        $commentaire = $d['commentaire'] ?? null;

        if (($idSalle !== null && !is_int($idSalle)) || ($idCoach !== null && !is_int($idCoach)) || !is_int($note)) {
            return $this->erreur('idSalle/idCoach/note doivent être des entiers.', 422);
        }
        if ($commentaire !== null && (!is_string($commentaire) || mb_strlen($commentaire) > 1000)) {
            return $this->erreur('Le commentaire doit être un texte de 1000 caractères maximum.', 422);
        }
        $db->executeStatement('CALL sp_ajouter_avis(?, ?, ?, ?, ?, @code)', [$this->userId(), $idSalle, $idCoach, $note, $commentaire]);
        $code = $db->fetchOne('SELECT @code');

        return new JsonResponse(['code' => $code, 'message' => ProcedureCodes::isOk($code) ? 'Avis publié.' : ProcedureCodes::message($code)], ProcedureCodes::status($code));
    }
}
