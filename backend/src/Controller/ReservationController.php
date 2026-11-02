<?php

namespace App\Controller;

use App\Service\ProcedureCodes;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Réservations : réservé aux sportifs. La capacité est contrôlée dans la procédure stockée (transaction + verrou). */
#[IsGranted('ROLE_SPORTIF')]
class ReservationController extends ApiController
{
    #[Route('/api/reservations', name: 'api_reservations', methods: ['GET'])]
    public function mesReservations(Connection $db): JsonResponse
    {
        return new JsonResponse($db->fetchAllAssociative(
            "SELECT r.id_seance AS idSeance, r.statut, r.date_reservation AS dateReservation,
                    se.titre, se.date_debut AS dateDebut, sa.nom AS salle, sa.ville
             FROM reserver r
             JOIN seance se ON se.id_seance = r.id_seance
             JOIN salle sa ON sa.id_salle = se.id_salle
             WHERE r.id_utilisateur = :u ORDER BY se.date_debut",
            ['u' => $this->userId()],
        ));
    }

    #[Route('/api/reservations', name: 'api_reserver', methods: ['POST'])]
    public function reserver(Request $request, Connection $db): JsonResponse
    {
        $idSeance = $this->body($request)['idSeance'] ?? null;
        if (!is_int($idSeance) || $idSeance < 1) {
            return $this->erreur('idSeance (entier positif) est obligatoire.', 422);
        }
        $db->executeStatement('CALL sp_reserver_seance(?, ?, @code)', [$this->userId(), $idSeance]);
        $code = $db->fetchOne('SELECT @code');
        $status = ProcedureCodes::status($code);

        return new JsonResponse(['code' => $code, 'message' => ProcedureCodes::isOk($code) ? 'Réservation confirmée.' : ProcedureCodes::message($code)], $status);
    }

    #[Route('/api/reservations/{idSeance}', name: 'api_annuler', requirements: ['idSeance' => '\d+'], methods: ['DELETE'])]
    public function annuler(int $idSeance, Connection $db): JsonResponse
    {
        $db->executeStatement('CALL sp_annuler_reservation(?, ?, @code)', [$this->userId(), $idSeance]);
        $code = $db->fetchOne('SELECT @code');
        $status = ProcedureCodes::isOk($code) ? 200 : ProcedureCodes::status($code);

        return new JsonResponse(['code' => $code, 'message' => ProcedureCodes::isOk($code) ? 'Réservation annulée.' : ProcedureCodes::message($code)], $status);
    }
}
