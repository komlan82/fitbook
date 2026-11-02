<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Consultation publique : recherche de salles et fiche d'une salle. Requêtes SQL préparées (anti-injection). */
class SalleController extends ApiController
{
    #[Route('/api/salles', name: 'api_salles', methods: ['GET'])]
    public function recherche(Request $request, Connection $db): JsonResponse
    {
        $ville = trim((string) $request->query->get('ville', ''));
        $discipline = trim((string) $request->query->get('discipline', ''));

        $sql = "SELECT s.id_salle AS id, s.nom, s.adresse, s.ville, s.code_postal AS codePostal,
                       ROUND(AVG(a.note), 1) AS noteMoyenne,
                       COUNT(DISTINCT a.id_avis) AS nbAvis,
                       MIN(se.prix) AS prixMin,
                       GROUP_CONCAT(DISTINCT d.libelle ORDER BY d.libelle SEPARATOR ', ') AS disciplines
                FROM salle s
                LEFT JOIN avis a ON a.id_salle = s.id_salle AND a.visible = 1
                LEFT JOIN seance se ON se.id_salle = s.id_salle AND se.statut = 'ouverte' AND se.date_debut > NOW()
                LEFT JOIN discipline d ON d.id_discipline = se.id_discipline
                WHERE s.statut_validation = 'validee'";
        $params = [];
        if ($ville !== '') {
            $sql .= ' AND s.ville LIKE :ville';
            $params['ville'] = '%' . addcslashes($ville, '%_\\') . '%';
        }
        if ($discipline !== '') {
            $sql .= ' AND EXISTS (SELECT 1 FROM seance x JOIN discipline dx ON dx.id_discipline = x.id_discipline
                                  WHERE x.id_salle = s.id_salle AND dx.libelle = :discipline)';
            $params['discipline'] = $discipline;
        }
        $sql .= ' GROUP BY s.id_salle ORDER BY s.nom';

        return new JsonResponse($db->fetchAllAssociative($sql, $params));
    }

    #[Route('/api/salles/{id}', name: 'api_salle', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function fiche(int $id, Connection $db): JsonResponse
    {
        $salle = $db->fetchAssociative(
            "SELECT s.id_salle AS id, s.nom, s.adresse, s.ville, s.code_postal AS codePostal,
                    ROUND((SELECT AVG(note) FROM avis WHERE id_salle = s.id_salle AND visible = 1), 1) AS noteMoyenne,
                    (SELECT COUNT(*) FROM avis WHERE id_salle = s.id_salle AND visible = 1) AS nbAvis
             FROM salle s WHERE s.id_salle = :id AND s.statut_validation = 'validee'",
            ['id' => $id],
        );
        if (!$salle) {
            return $this->erreur('Salle introuvable.', 404);
        }

        $salle['seances'] = $db->fetchAllAssociative(
            "SELECT se.id_seance AS id, se.titre, se.date_debut AS dateDebut, se.date_fin AS dateFin, se.prix,
                    se.places_max AS placesMax, d.libelle AS discipline,
                    CONCAT(u.prenom, ' ', u.nom) AS coach,
                    se.places_max - (SELECT COUNT(*) FROM reserver r WHERE r.id_seance = se.id_seance AND r.statut <> 'annulee') AS placesRestantes
             FROM seance se
             JOIN discipline d ON d.id_discipline = se.id_discipline
             JOIN coach c ON c.id_coach = se.id_coach
             JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
             WHERE se.id_salle = :id AND se.statut = 'ouverte' AND se.date_debut > NOW()
             ORDER BY se.date_debut",
            ['id' => $id],
        );
        $salle['avis'] = $db->fetchAllAssociative(
            "SELECT a.note, a.commentaire, a.date_avis AS dateAvis, CONCAT(u.prenom, ' ', LEFT(u.nom, 1), '.') AS auteur
             FROM avis a JOIN utilisateur u ON u.id_utilisateur = a.id_utilisateur
             WHERE a.id_salle = :id AND a.visible = 1 ORDER BY a.date_avis DESC",
            ['id' => $id],
        );

        return new JsonResponse($salle);
    }
}
