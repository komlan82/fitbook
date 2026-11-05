<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Service\ProcedureCodes;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
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
                    se.titre, se.date_debut AS dateDebut, se.id_salle AS idSalle, se.id_coach AS idCoach, sa.nom AS salle, sa.ville
             FROM reserver r
             JOIN seance se ON se.id_seance = r.id_seance
             JOIN salle sa ON sa.id_salle = se.id_salle
             WHERE r.id_utilisateur = :u ORDER BY se.date_debut",
            ['u' => $this->userId()],
        ));
    }

    #[Route('/api/reservations', name: 'api_reserver', methods: ['POST'])]
    public function reserver(Request $request, Connection $db, MailerInterface $mailer, #[CurrentUser] Utilisateur $user): JsonResponse
    {
        $idSeance = $this->body($request)['idSeance'] ?? null;
        if (!is_int($idSeance) || $idSeance < 1) {
            return $this->erreur('idSeance (entier positif) est obligatoire.', 422);
        }
        $db->executeStatement('CALL sp_reserver_seance(?, ?, @code)', [$this->userId(), $idSeance]);
        $code = $db->fetchOne('SELECT @code');
        $status = ProcedureCodes::status($code);

        if (ProcedureCodes::isOk($code)) {
            $this->envoyerMail($mailer, $db, $user, $idSeance, false);
        }

        return new JsonResponse(['code' => $code, 'message' => ProcedureCodes::isOk($code) ? 'Réservation confirmée.' : ProcedureCodes::message($code)], $status);
    }

    #[Route('/api/reservations/{idSeance}', name: 'api_annuler', requirements: ['idSeance' => '\d+'], methods: ['DELETE'])]
    public function annuler(int $idSeance, Connection $db, MailerInterface $mailer, #[CurrentUser] Utilisateur $user): JsonResponse
    {
        $db->executeStatement('CALL sp_annuler_reservation(?, ?, @code)', [$this->userId(), $idSeance]);
        $code = $db->fetchOne('SELECT @code');
        $status = ProcedureCodes::isOk($code) ? 200 : ProcedureCodes::status($code);

        if (ProcedureCodes::isOk($code)) {
            $this->envoyerMail($mailer, $db, $user, $idSeance, true);
        }

        return new JsonResponse(['code' => $code, 'message' => ProcedureCodes::isOk($code) ? 'Réservation annulée.' : ProcedureCodes::message($code)], $status);
    }

    /**
     * Notification email (réservation confirmée ou annulée).
     * Un problème d'envoi ne doit JAMAIS faire échouer la réservation : on ignore l'erreur (comme à l'inscription).
     */
    private function envoyerMail(MailerInterface $mailer, Connection $db, Utilisateur $user, int $idSeance, bool $annulation): void
    {
        try {
            $s = $db->fetchAssociative(
                'SELECT se.titre, se.date_debut, sa.nom AS salle, sa.ville
                 FROM seance se JOIN salle sa ON sa.id_salle = se.id_salle
                 WHERE se.id_seance = :s',
                ['s' => $idSeance],
            );
            if (!$s) {
                return;
            }
            $quand = (new \DateTimeImmutable($s['date_debut']))->format('d/m/Y \à H:i');
            $prenom = $user->getPrenom();
            $verbe = $annulation ? 'annulée' : 'confirmée';
            $detail = "{$s['titre']} — le $quand — {$s['salle']} ({$s['ville']})";

            $h = fn (string $t): string => htmlspecialchars($t, ENT_QUOTES);
            $mailer->send((new Email())
                ->from('no-reply@fitbook.local')
                ->to($user->getEmail())
                ->subject($annulation ? 'FitBook : réservation annulée' : 'FitBook : réservation confirmée')
                ->text("Bonjour $prenom,\n\nVotre réservation est $verbe :\n$detail\n\nÀ bientôt sur FitBook.\n")
                ->html('<p>Bonjour ' . $h($prenom) . ',</p><p>Votre réservation est <strong>' . $verbe . '</strong> :</p><p>' . $h($detail) . '</p><p>À bientôt sur FitBook.</p>'));
        } catch (\Throwable) {
            // Messagerie indisponible : la réservation reste valide.
        }
    }
}
