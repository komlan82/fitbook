<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Espace du gestionnaire de salle : créer et modifier SES salles, consulter les réservations et les avis.
 * Chaque requête est filtrée par id_gestionnaire = utilisateur connecté : un gestionnaire ne voit
 * et ne modifie jamais les salles d'un autre.
 */
#[IsGranted('ROLE_GESTIONNAIRE')]
class GestionnaireController extends ApiController
{
    #[Route('/api/gestionnaire/salles', name: 'api_gestionnaire_salle_creer', methods: ['POST'])]
    public function creer(Request $request, Connection $db, ValidatorInterface $validator): JsonResponse
    {
        [$input, $erreurs] = $this->lireSalle($request, $validator);
        if ($erreurs) {
            return $this->erreur('Données invalides.', 422, $erreurs);
        }
        // Une nouvelle salle est « en attente » (valeur par défaut) : l'administrateur doit la valider.
        $db->executeStatement(
            'INSERT INTO salle (id_gestionnaire, nom, adresse, ville, code_postal) VALUES (?, ?, ?, ?, ?)',
            [$this->userId(), $input['nom'], $input['adresse'], $input['ville'], $input['codePostal']],
        );

        return new JsonResponse([
            'id' => (int) $db->lastInsertId(),
            'message' => 'Salle créée. Elle sera visible des sportifs après validation par un administrateur.',
        ], 201);
    }

    #[Route('/api/gestionnaire/salles/{id}', name: 'api_gestionnaire_salle_modifier', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function modifier(int $id, Request $request, Connection $db, ValidatorInterface $validator): JsonResponse
    {
        // Propriétaire uniquement : une salle d'un autre gestionnaire répond « introuvable ».
        if (!$db->fetchOne('SELECT 1 FROM salle WHERE id_salle = :id AND id_gestionnaire = :u', ['id' => $id, 'u' => $this->userId()])) {
            return $this->erreur('Salle introuvable.', 404);
        }
        [$input, $erreurs] = $this->lireSalle($request, $validator);
        if ($erreurs) {
            return $this->erreur('Données invalides.', 422, $erreurs);
        }
        // Le statut de validation n'est JAMAIS modifiable ici (réservé à l'administrateur).
        $db->executeStatement(
            'UPDATE salle SET nom = ?, adresse = ?, ville = ?, code_postal = ? WHERE id_salle = ? AND id_gestionnaire = ?',
            [$input['nom'], $input['adresse'], $input['ville'], $input['codePostal'], $id, $this->userId()],
        );

        return new JsonResponse(['message' => 'Salle mise à jour.']);
    }

    #[Route('/api/gestionnaire/salles/{id}', name: 'api_gestionnaire_salle_supprimer', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function supprimer(int $id, Connection $db): JsonResponse
    {
        if (!$db->fetchOne('SELECT 1 FROM salle WHERE id_salle = :id AND id_gestionnaire = :u', ['id' => $id, 'u' => $this->userId()])) {
            return $this->erreur('Salle introuvable.', 404);
        }
        try {
            $db->executeStatement('DELETE FROM salle WHERE id_salle = :id AND id_gestionnaire = :u', ['id' => $id, 'u' => $this->userId()]);
        } catch (ForeignKeyConstraintViolationException) {
            // La base protège l'historique : pas de suppression si des séances, avis ou favoris existent.
            return $this->erreur('Impossible de supprimer une salle qui a déjà des séances, des avis ou des favoris.', 409);
        }

        return new JsonResponse(['message' => 'Salle supprimée.']);
    }

    #[Route('/api/gestionnaire/reservations', name: 'api_gestionnaire_reservations', methods: ['GET'])]
    public function reservations(Connection $db): JsonResponse
    {
        return new JsonResponse($db->fetchAllAssociative(
            "SELECT sa.nom AS salle, se.titre, se.date_debut AS dateDebut,
                    CONCAT(u.prenom, ' ', u.nom) AS sportif, r.statut, r.date_reservation AS dateReservation
             FROM reserver r
             JOIN seance se ON se.id_seance = r.id_seance
             JOIN salle sa ON sa.id_salle = se.id_salle
             JOIN utilisateur u ON u.id_utilisateur = r.id_utilisateur
             WHERE sa.id_gestionnaire = :u
             ORDER BY se.date_debut DESC, u.nom",
            ['u' => $this->userId()],
        ));
    }

    #[Route('/api/gestionnaire/avis', name: 'api_gestionnaire_avis', methods: ['GET'])]
    public function avis(Connection $db): JsonResponse
    {
        return new JsonResponse($db->fetchAllAssociative(
            "SELECT sa.nom AS salle, a.note, a.commentaire, a.date_avis AS dateAvis,
                    CONCAT(u.prenom, ' ', LEFT(u.nom, 1), '.') AS auteur
             FROM avis a
             JOIN salle sa ON sa.id_salle = a.id_salle
             JOIN utilisateur u ON u.id_utilisateur = a.id_utilisateur
             WHERE sa.id_gestionnaire = :u AND a.visible = 1
             ORDER BY a.date_avis DESC",
            ['u' => $this->userId()],
        ));
    }

    /**
     * Lit et valide le corps JSON d'une salle. Seuls les 4 champs prévus sont lus (pas d'id_gestionnaire,
     * pas de statut) : le client ne peut pas s'attribuer une salle ni se valider lui-même.
     *
     * @return array{0: array<string, string>, 1: array<string, string>} [champs nettoyés, erreurs par champ]
     */
    private function lireSalle(Request $request, ValidatorInterface $validator): array
    {
        $data = $this->body($request);
        $input = [];
        foreach (['nom', 'adresse', 'ville', 'codePostal'] as $champ) {
            $v = $data[$champ] ?? null;
            $input[$champ] = is_string($v) ? trim($v) : $v;
        }
        $violations = $validator->validate($input, new Assert\Collection([
            'nom' => [new Assert\NotBlank(message: 'Le nom est obligatoire.'), new Assert\Type('string'), new Assert\Length(max: 100, maxMessage: '100 caractères maximum.')],
            'adresse' => [new Assert\NotBlank(message: "L'adresse est obligatoire."), new Assert\Type('string'), new Assert\Length(max: 150, maxMessage: '150 caractères maximum.')],
            'ville' => [new Assert\NotBlank(message: 'La ville est obligatoire.'), new Assert\Type('string'), new Assert\Length(max: 60, maxMessage: '60 caractères maximum.')],
            'codePostal' => [new Assert\NotBlank(message: 'Le code postal est obligatoire.'), new Assert\Type('string'), new Assert\Regex(pattern: '/^\d{4}$/', message: 'Le code postal comporte 4 chiffres.')],
        ]));
        $erreurs = [];
        foreach ($violations as $v) {
            $erreurs[trim($v->getPropertyPath(), '[]')] = $v->getMessage();
        }

        return [$input, $erreurs];
    }
}
