<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Espace coach : CRUD de ses séances et de ses disponibilités.
 * Toutes les requêtes sont préparées et limitées aux données du coach connecté.
 */
#[IsGranted('ROLE_COACH')]
class CoachController extends ApiController
{
    // ---------- Options des formulaires ----------

    #[Route('/api/coach/options', name: 'api_coach_options', methods: ['GET'])]
    public function options(Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }

        return new JsonResponse([
            'salles' => $db->fetchAllAssociative("SELECT id_salle AS id, nom, ville FROM salle WHERE statut_validation = 'validee' ORDER BY nom"),
            'disciplines' => $db->fetchAllAssociative('SELECT id_discipline AS id, libelle FROM discipline ORDER BY libelle'),
        ]);
    }

    // ---------- Séances ----------

    #[Route('/api/coach/seances', name: 'api_coach_seances', methods: ['GET'])]
    public function seances(Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }

        return new JsonResponse($db->fetchAllAssociative(
            "SELECT se.id_seance AS id, se.titre, se.type_seance AS typeSeance, se.date_debut AS dateDebut, se.date_fin AS dateFin,
                    se.prix, se.places_max AS placesMax, se.statut, se.id_salle AS idSalle, s.nom AS salle,
                    se.id_discipline AS idDiscipline, d.libelle AS discipline,
                    (SELECT COUNT(*) FROM reserver r WHERE r.id_seance = se.id_seance AND r.statut <> 'annulee') AS nbReservations
             FROM seance se
             JOIN salle s ON s.id_salle = se.id_salle
             JOIN discipline d ON d.id_discipline = se.id_discipline
             WHERE se.id_coach = :c ORDER BY se.date_debut",
            ['c' => $idCoach],
        ));
    }

    #[Route('/api/coach/seances', name: 'api_coach_seance_creer', methods: ['POST'])]
    public function creer(Request $request, Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }
        [$erreurs, $s] = $this->valider($this->body($request), $db, $idCoach, null);
        if ($erreurs) {
            return $this->erreur('Formulaire invalide.', 422, $erreurs);
        }
        if ($this->chevauche($db, $idCoach, $s['debut'], $s['fin'], 0)) {
            return $this->erreur('Vous avez déjà une séance sur ce créneau.', 409);
        }

        $db->executeStatement(
            'INSERT INTO seance (id_coach, id_salle, id_discipline, titre, type_seance, date_debut, date_fin, prix, places_max)
             VALUES (:c, :salle, :disc, :titre, :type, :debut, :fin, :prix, :places)',
            [
                'c' => $idCoach,
                'salle' => $s['idSalle'],
                'disc' => $s['idDiscipline'],
                'titre' => $s['titre'],
                'type' => $s['type'],
                'debut' => $s['debut'],
                'fin' => $s['fin'],
                'prix' => $s['prix'],
                'places' => $s['places']
            ],
        );

        return new JsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Séance créée.'], 201);
    }

    #[Route('/api/coach/seances/{id}', name: 'api_coach_seance_modifier', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function modifier(int $id, Request $request, Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }
        $seance = $db->fetchAssociative('SELECT statut, date_debut FROM seance WHERE id_seance = :id AND id_coach = :c', ['id' => $id, 'c' => $idCoach]);
        if (!$seance) {
            return $this->erreur('Séance introuvable.', 404);
        }
        if ($seance['statut'] !== 'ouverte' || new \DateTimeImmutable($seance['date_debut']) <= new \DateTimeImmutable()) {
            return $this->erreur('Seule une séance ouverte et à venir peut être modifiée.', 409);
        }

        [$erreurs, $s] = $this->valider($this->body($request), $db, $idCoach, $id);
        if ($erreurs) {
            return $this->erreur('Formulaire invalide.', 422, $erreurs);
        }
        $inscrits = (int) $db->fetchOne("SELECT COUNT(*) FROM reserver WHERE id_seance = :id AND statut <> 'annulee'", ['id' => $id]);
        if ($s['places'] < $inscrits) {
            return $this->erreur("Il y a déjà $inscrits réservation(s) : le nombre de places ne peut pas être inférieur.", 409);
        }
        if ($this->chevauche($db, $idCoach, $s['debut'], $s['fin'], $id)) {
            return $this->erreur('Vous avez déjà une séance sur ce créneau.', 409);
        }

        $db->executeStatement(
            'UPDATE seance SET id_salle = :salle, id_discipline = :disc, titre = :titre, type_seance = :type,
                    date_debut = :debut, date_fin = :fin, prix = :prix, places_max = :places
             WHERE id_seance = :id AND id_coach = :c',
            [
                'salle' => $s['idSalle'],
                'disc' => $s['idDiscipline'],
                'titre' => $s['titre'],
                'type' => $s['type'],
                'debut' => $s['debut'],
                'fin' => $s['fin'],
                'prix' => $s['prix'],
                'places' => $s['places'],
                'id' => $id,
                'c' => $idCoach
            ],
        );

        return new JsonResponse(['message' => 'Séance modifiée.']);
    }

    /** Supprime la séance ; si elle a déjà des réservations, elle est annulée (et les réservations aussi) pour garder l'historique. */
    #[Route('/api/coach/seances/{id}', name: 'api_coach_seance_supprimer', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function supprimer(int $id, Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }
        if (!$db->fetchOne('SELECT 1 FROM seance WHERE id_seance = :id AND id_coach = :c', ['id' => $id, 'c' => $idCoach])) {
            return $this->erreur('Séance introuvable.', 404);
        }

        $historique = (int) $db->fetchOne('SELECT COUNT(*) FROM reserver WHERE id_seance = :id', ['id' => $id]);
        $db->beginTransaction();
        try {
            if ($historique > 0) {
                $db->executeStatement("UPDATE reserver SET statut = 'annulee' WHERE id_seance = :id", ['id' => $id]);
                $db->executeStatement("UPDATE seance SET statut = 'annulee' WHERE id_seance = :id", ['id' => $id]);
                $message = 'Séance annulée : les réservations existantes ont été annulées.';
            } else {
                $db->executeStatement('DELETE FROM seance WHERE id_seance = :id', ['id' => $id]);
                $message = 'Séance supprimée.';
            }
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();

            return $this->erreur('Impossible de supprimer la séance.', 500);
        }

        return new JsonResponse(['message' => $message]);
    }

    // ---------- Disponibilités ----------

    #[Route('/api/coach/disponibilites', name: 'api_coach_dispo', methods: ['GET'])]
    public function disponibilites(Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }

        return new JsonResponse($db->fetchAllAssociative(
            'SELECT id_disponibilite AS id, date_debut AS dateDebut, date_fin AS dateFin FROM disponibilite WHERE id_coach = :c ORDER BY date_debut',
            ['c' => $idCoach],
        ));
    }

    #[Route('/api/coach/disponibilites', name: 'api_coach_dispo_ajouter', methods: ['POST'])]
    public function ajouterDisponibilite(Request $request, Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }
        $b = $this->body($request);
        $debut = $this->dateHeure($b['dateDebut'] ?? null);
        $fin = $this->dateHeure($b['dateFin'] ?? null);
        $erreurs = [];
        if (!$debut) {
            $erreurs['dateDebut'] = 'Date de début invalide.';
        }
        if (!$fin) {
            $erreurs['dateFin'] = 'Date de fin invalide.';
        }
        if ($debut && $fin && $fin <= $debut) {
            $erreurs['dateFin'] = 'La fin doit être après le début.';
        }
        if ($erreurs) {
            return $this->erreur('Formulaire invalide.', 422, $erreurs);
        }

        $db->executeStatement(
            'INSERT INTO disponibilite (id_coach, date_debut, date_fin) VALUES (:c, :d, :f)',
            ['c' => $idCoach, 'd' => $debut->format('Y-m-d H:i:s'), 'f' => $fin->format('Y-m-d H:i:s')],
        );

        return new JsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Disponibilité ajoutée.'], 201);
    }

    #[Route('/api/coach/disponibilites/{id}', name: 'api_coach_dispo_supprimer', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function supprimerDisponibilite(int $id, Connection $db): JsonResponse
    {
        $idCoach = $this->idCoach($db);
        if ($idCoach === null) {
            return $this->erreur('Profil coach introuvable.', 403);
        }
        $n = $db->executeStatement('DELETE FROM disponibilite WHERE id_disponibilite = :id AND id_coach = :c', ['id' => $id, 'c' => $idCoach]);

        return $n ? new JsonResponse(['message' => 'Disponibilité supprimée.']) : $this->erreur('Disponibilité introuvable.', 404);
    }

    // ---------- Outils internes ----------

    private function idCoach(Connection $db): ?int
    {
        $id = $db->fetchOne('SELECT id_coach FROM coach WHERE id_utilisateur = :u', ['u' => $this->userId()]);

        return $id === false ? null : (int) $id;
    }

    /** Accepte "2026-11-20T18:00", "2026-11-20 18:00" ou avec les secondes. */
    private function dateHeure(mixed $valeur): ?\DateTimeImmutable
    {
        if (!is_string($valeur)) {
            return null;
        }
        $texte = str_replace('T', ' ', trim($valeur));
        if (strlen($texte) === 16) {
            $texte .= ':00';
        }
        $d = \DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $texte);
        $e = \DateTimeImmutable::getLastErrors();

        return ($d && (!$e || ($e['warning_count'] === 0 && $e['error_count'] === 0))) ? $d : null;
    }

    private function chevauche(Connection $db, int $idCoach, string $debut, string $fin, int $exclure): bool
    {
        return (int) $db->fetchOne(
            "SELECT COUNT(*) FROM seance WHERE id_coach = :c AND statut <> 'annulee' AND id_seance <> :x AND date_debut < :fin AND date_fin > :debut",
            ['c' => $idCoach, 'x' => $exclure, 'fin' => $fin, 'debut' => $debut],
        ) > 0;
    }

    /** @return array{0: array<string,string>, 1: array<string,mixed>} [erreurs par champ, valeurs nettoyées] */
    private function valider(array $b, Connection $db, int $idCoach, ?int $idSeance): array
    {
        $e = [];
        $titre = is_string($b['titre'] ?? null) ? trim($b['titre']) : '';
        if (mb_strlen($titre) < 2 || mb_strlen($titre) > 100) {
            $e['titre'] = 'Le titre doit contenir de 2 à 100 caractères.';
        }

        $idSalle = filter_var($b['idSalle'] ?? null, FILTER_VALIDATE_INT);
        if ($idSalle === false || !$db->fetchOne("SELECT 1 FROM salle WHERE id_salle = :s AND statut_validation = 'validee'", ['s' => $idSalle])) {
            $e['idSalle'] = 'Choisissez une salle validée.';
        }

        $idDiscipline = filter_var($b['idDiscipline'] ?? null, FILTER_VALIDATE_INT);
        if ($idDiscipline === false || !$db->fetchOne('SELECT 1 FROM discipline WHERE id_discipline = :d', ['d' => $idDiscipline])) {
            $e['idDiscipline'] = 'Choisissez une discipline.';
        }

        $type = $b['typeSeance'] ?? 'collective';
        if (!in_array($type, ['collective', 'individuelle'], true)) {
            $e['typeSeance'] = "Le type doit valoir 'collective' ou 'individuelle'.";
        }

        $debut = $this->dateHeure($b['dateDebut'] ?? null);
        $fin = $this->dateHeure($b['dateFin'] ?? null);
        if (!$debut) {
            $e['dateDebut'] = 'Date de début invalide.';
        }
        if (!$fin) {
            $e['dateFin'] = 'Date de fin invalide.';
        }
        if ($debut && $fin) {
            if ($fin <= $debut) {
                $e['dateFin'] = 'La fin doit être après le début.';
            } elseif ($debut <= new \DateTimeImmutable()) {
                $e['dateDebut'] = 'La séance doit commencer dans le futur.';
            } elseif ($fin->getTimestamp() - $debut->getTimestamp() > 8 * 3600) {
                $e['dateFin'] = 'Une séance dure 8 heures au maximum.';
            }
        }

        $prix = $b['prix'] ?? null;
        if (!is_numeric($prix) || $prix < 0 || $prix > 500) {
            $e['prix'] = 'Le prix doit être compris entre 0 et 500 €.';
        }

        $places = filter_var($b['placesMax'] ?? null, FILTER_VALIDATE_INT);
        if ($places === false || $places < 1 || $places > 500) {
            $e['placesMax'] = 'Le nombre de places doit être compris entre 1 et 500.';
        }

        return [$e, [
            'titre' => $titre,
            'idSalle' => $idSalle,
            'idDiscipline' => $idDiscipline,
            'type' => $type,
            'debut' => $debut?->format('Y-m-d H:i:s'),
            'fin' => $fin?->format('Y-m-d H:i:s'),
            'prix' => is_numeric($prix) ? round((float) $prix, 2) : 0,
            'places' => $places,
        ]];
    }
}
