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
export interface SalleGestionnaire { id: number; nom: string; adresse: string; ville: string; codePostal: string; statutValidation: 'en_attente' | 'validee' | 'refusee'; }
export interface FormSalle { nom: string; adresse: string; ville: string; codePostal: string; }
export interface ReservationGestionnaire { salle: string; titre: string; dateDebut: string; sportif: string; statut: 'confirmee' | 'en_attente' | 'annulee'; dateReservation: string; }
export interface AvisGestionnaire { salle: string; note: number; commentaire: string | null; dateAvis: string; auteur: string; }
export interface SalleAdmin { id: number; nom: string; adresse: string; ville: string; statutValidation: 'en_attente' | 'validee' | 'refusee'; gestionnaire: string; }
export interface ReponseApi { code?: string; message?: string; }

export interface SeanceCalendrier {
  id: number; titre: string; dateDebut: string; dateFin: string; prix: string; discipline: string;
  idSalle: number; salle: string; ville: string; coach: string; placesRestantes: number;
}
export interface SeanceCoach {
  id: number; titre: string; typeSeance: 'collective' | 'individuelle'; dateDebut: string; dateFin: string; prix: string;
  placesMax: number; statut: 'ouverte' | 'annulee' | 'terminee'; idSalle: number; salle: string;
  idDiscipline: number; discipline: string; nbReservations: number;
}
export interface FormSeance {
  titre: string; idSalle: number; idDiscipline: number; typeSeance: string; dateDebut: string; dateFin: string; prix: number; placesMax: number;
}
export interface OptionsCoach { salles: { id: number; nom: string; ville: string }[]; disciplines: { id: number; libelle: string }[]; }
export interface Disponibilite { id: number; dateDebut: string; dateFin: string; }
