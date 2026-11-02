export interface Utilisateur { id: number; nom: string; prenom: string; email: string; role: 'sportif' | 'coach' | 'gestionnaire' | 'admin'; }

export interface SalleResume {
  id: number; nom: string; adresse: string; ville: string; codePostal: string;
  noteMoyenne: string | null; nbAvis: number; prixMin: string | null; disciplines: string | null;
}
export interface Seance {
  id: number; titre: string; dateDebut: string; dateFin: string; prix: string;
  placesMax: number; discipline: string; coach: string; placesRestantes: number;
}
export interface Avis { note: number; commentaire: string | null; dateAvis: string; auteur: string; }
export interface SalleFiche extends SalleResume { seances: Seance[]; avis: Avis[]; }

export interface Reservation {
  idSeance: number; statut: 'confirmee' | 'en_attente' | 'annulee'; dateReservation: string;
  titre: string; dateDebut: string; salle: string; ville: string;
}
export interface Favori { id: number; nom: string; ville: string; dateAjout: string; }
export interface SauvegardeJournal {
  total: number; message: string;
  sauvegardes: { numero: number; fichier: string; tailleOctets: number | null; date: string; statut: string }[];
}
export interface UtilisateurAdmin { id: number; nom: string; prenom: string; email: string; role: string; emailConfirme: number | boolean; }
export interface SalleGestionnaire { id: number; nom: string; ville: string; statutValidation: string; }
export interface ReponseApi { code?: string; message?: string; }
