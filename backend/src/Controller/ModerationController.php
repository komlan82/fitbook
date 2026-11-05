<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Espace administrateur : modération des avis signalés et gestion des disciplines.
 * Toutes les routes sont réservées au rôle admin (access_control + #[IsGranted]).
 */
#[IsGranted('ROLE_ADMIN')]
class ModerationController extends ApiController
{
    #[Route('/api/admin/avis-signales', name: 'api_admin_avis_signales', methods: ['GET'])]
    public function avisSignales(Connection $db): JsonResponse
    {
        $liste = $db->fetchAllAssociative(
            "SELECT a.id_avis AS id, COALESCE(sa.nom, 'Coach') AS cible, a.note, a.commentaire, a.date_avis AS dateAvis,
                    CONCAT(u.prenom, ' ', LEFT(u.nom, 1), '.') AS auteur
             FROM avis a
             JOIN utilisateur u ON u.id_utilisateur = a.id_utilisateur
             LEFT JOIN salle sa ON sa.id_salle = a.id_salle
             WHERE a.signale = 1
             ORDER BY a.date_avis DESC",
        );
        foreach ($liste as &$a) {
            $a['id'] = (int) $a['id'];
            $a['note'] = (int) $a['note'];
        }

        return new JsonResponse($liste);
    }

    #[Route('/api/admin/avis/{id}/moderation', name: 'api_admin_avis_moderation', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function moderer(int $id, Request $request, Connection $db): JsonResponse
    {
        $decision = $this->body($request)['decision'] ?? null;
        if (!in_array($decision, ['masquer', 'conserver'], true)) {
            return $this->erreur('La décision doit être « masquer » ou « conserver ».', 422);
        }
        if (!$db->fetchOne('SELECT 1 FROM avis WHERE id_avis = :id AND signale = 1', ['id' => $id])) {
            return $this->erreur('Avis signalé introuvable.', 404);
        }
        // Masquer : l'avis disparaît du site (visible = 0). Conserver : il reste en ligne. Dans les deux cas le signalement est clos.
        if ($decision === 'masquer') {
            $db->executeStatement('UPDATE avis SET visible = 0, signale = 0 WHERE id_avis = :id', ['id' => $id]);
        } else {
            $db->executeStatement('UPDATE avis SET signale = 0 WHERE id_avis = :id', ['id' => $id]);
        }

        return new JsonResponse(['message' => $decision === 'masquer' ? 'Avis masqué.' : 'Avis conservé.']);
    }

    #[Route('/api/admin/disciplines', name: 'api_admin_disciplines', methods: ['GET'])]
    public function disciplines(Connection $db): JsonResponse
    {
        $liste = $db->fetchAllAssociative(
            'SELECT d.id_discipline AS id, d.libelle, COUNT(se.id_seance) AS nbSeances
             FROM discipline d LEFT JOIN seance se ON se.id_discipline = d.id_discipline
             GROUP BY d.id_discipline, d.libelle ORDER BY d.libelle',
        );
        foreach ($liste as &$d) {
            $d['id'] = (int) $d['id'];
            $d['nbSeances'] = (int) $d['nbSeances'];
        }

        return new JsonResponse($liste);
    }

    #[Route('/api/admin/disciplines', name: 'api_admin_discipline_creer', methods: ['POST'])]
    public function creerDiscipline(Request $request, Connection $db, ValidatorInterface $validator): JsonResponse
    {
        [$libelle, $erreurs] = $this->lireLibelle($request, $validator);
        if ($erreurs) {
            return $this->erreur('Données invalides.', 422, $erreurs);
        }
        try {
            $db->executeStatement('INSERT INTO discipline (libelle) VALUES (?)', [$libelle]);
        } catch (UniqueConstraintViolationException) {
            return $this->erreur('Cette discipline existe déjà.', 409);
        }

        return new JsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Discipline ajoutée.'], 201);
    }

    #[Route('/api/admin/disciplines/{id}', name: 'api_admin_discipline_modifier', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function modifierDiscipline(int $id, Request $request, Connection $db, ValidatorInterface $validator): JsonResponse
    {
        if (!$db->fetchOne('SELECT 1 FROM discipline WHERE id_discipline = :id', ['id' => $id])) {
            return $this->erreur('Discipline introuvable.', 404);
        }
        [$libelle, $erreurs] = $this->lireLibelle($request, $validator);
        if ($erreurs) {
            return $this->erreur('Données invalides.', 422, $erreurs);
        }
        try {
            $db->executeStatement('UPDATE discipline SET libelle = ? WHERE id_discipline = ?', [$libelle, $id]);
        } catch (UniqueConstraintViolationException) {
            return $this->erreur('Cette discipline existe déjà.', 409);
        }

        return new JsonResponse(['message' => 'Discipline renommée.']);
    }

    #[Route('/api/admin/disciplines/{id}', name: 'api_admin_discipline_supprimer', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function supprimerDiscipline(int $id, Connection $db): JsonResponse
    {
        if (!$db->fetchOne('SELECT 1 FROM discipline WHERE id_discipline = :id', ['id' => $id])) {
            return $this->erreur('Discipline introuvable.', 404);
        }
        try {
            $db->executeStatement('DELETE FROM discipline WHERE id_discipline = :id', ['id' => $id]);
        } catch (ForeignKeyConstraintViolationException) {
            // La base protège l'historique : une discipline utilisée par des séances ou des coachs ne peut pas disparaître.
            return $this->erreur('Impossible de supprimer une discipline utilisée par des séances ou des coachs.', 409);
        }

        return new JsonResponse(['message' => 'Discipline supprimée.']);
    }

    /** @return array{0: string, 1: array<string, string>} [libellé nettoyé, erreurs par champ] */
    private function lireLibelle(Request $request, ValidatorInterface $validator): array
    {
        $v = $this->body($request)['libelle'] ?? null;
        $libelle = is_string($v) ? trim($v) : $v;
        $violations = $validator->validate(['libelle' => $libelle], new Assert\Collection([
            'libelle' => [new Assert\NotBlank(message: 'Le nom est obligatoire.'), new Assert\Type('string'), new Assert\Length(min: 2, max: 60, minMessage: '2 caractères minimum.', maxMessage: '60 caractères maximum.')],
        ]));
        $erreurs = [];
        foreach ($violations as $viol) {
            $erreurs[trim($viol->getPropertyPath(), '[]')] = $viol->getMessage();
        }

        return [is_string($libelle) ? $libelle : '', $erreurs];
    }
}
