import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import {
  Avis, AvisGestionnaire, Disponibilite, Favori, FormSalle, FormSeance, OptionsCoach, Reservation, ReponseApi, SalleFiche, SalleGestionnaire,
  AvisSignale, CoachResume, Discipline, MonAvis, Utilisateur, ReservationGestionnaire, SalleAdmin, SalleResume, SauvegardeJournal, Seance, SeanceCalendrier, SeanceCoach, UtilisateurAdmin,
} from './models';

/** "2026-11-07 10:00:00" (MySQL) -> "2026-11-07T10:00:00" (lisible par le DatePipe). */
const iso = (s: string): string => (s ?? '').replace(' ', 'T');

/** Extrait un message lisible d'une erreur HTTP de l'API. */
export function messageErreur(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const b = e.error as { message?: string; erreur?: string; error?: string; details?: Record<string, string> } | null;
    const details = b?.details ? ' ' + Object.values(b.details).join(' ') : '';
    if (b?.message) return b.message;
    if (b?.erreur) return b.erreur + details;
    if (b?.error) return b.error;
    if (e.status === 0) return "Impossible de joindre l'API. Le serveur est-il démarré ?";
    return `Erreur ${e.status}`;
  }
  return 'Erreur inattendue.';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  salles(ville: string, discipline: string) {
    let params = new HttpParams();
    if (ville.trim()) params = params.set('ville', ville.trim());
    if (discipline) params = params.set('discipline', discipline);
    return this.http.get<SalleResume[]>('/api/salles', { params });
  }

  salle(id: number) {
    return this.http.get<SalleFiche>(`/api/salles/${id}`).pipe(
      map((s) => ({
        ...s,
        seances: s.seances.map((x: Seance) => ({ ...x, dateDebut: iso(x.dateDebut), dateFin: iso(x.dateFin) })),
        avis: s.avis.map((a: Avis) => ({ ...a, dateAvis: iso(a.dateAvis) })),
      })),
    );
  }

  reserver(idSeance: number) { return this.http.post<ReponseApi>('/api/reservations', { idSeance }); }
  annuler(idSeance: number) { return this.http.delete<ReponseApi>(`/api/reservations/${idSeance}`); }
  mesReservations() {
    return this.http.get<Reservation[]>('/api/reservations').pipe(
      map((l) => l.map((r) => ({ ...r, dateDebut: iso(r.dateDebut), dateReservation: iso(r.dateReservation) }))),
    );
  }

  publierAvis(idSalle: number, note: number, commentaire: string) {
    return this.http.post<ReponseApi>('/api/avis', { idSalle, note, commentaire: commentaire || null });
  }

  publierAvisCoach(idCoach: number, note: number, commentaire: string) {
    return this.http.post<ReponseApi>('/api/avis', { idCoach, note, commentaire: commentaire || null });
  }
  mesAvis() {
    return this.http.get<MonAvis[]>('/api/mes-avis').pipe(map((l) => l.map((a) => ({ ...a, dateAvis: iso(a.dateAvis) }))));
  }
  majProfil(nom: string, prenom: string) { return this.http.put<Utilisateur>('/api/me', { nom, prenom }); }

  favoris() { return this.http.get<Favori[]>('/api/favoris/salles'); }
  ajouterFavori(id: number) { return this.http.post<ReponseApi>(`/api/favoris/salles/${id}`, {}); }
  retirerFavori(id: number) { return this.http.delete<ReponseApi>(`/api/favoris/salles/${id}`); }

  contact(nom: string, email: string, message: string) {
    return this.http.post<ReponseApi>('/api/contact', { nom, email, message });
  }
  sauvegardes() {
    return this.http.get<SauvegardeJournal>('/api/sauvegardes').pipe(
      map((j) => ({ ...j, sauvegardes: j.sauvegardes.map((s) => ({ ...s, date: iso(s.date) })) })),
    );
  }
  supprimerUtilisateur(id: number) { return this.http.delete<ReponseApi>(`/api/admin/utilisateurs/${id}`); }
  adminUtilisateurs() { return this.http.get<UtilisateurAdmin[]>('/api/admin/utilisateurs'); }
  signalerAvis(id: number) { return this.http.post<ReponseApi>(`/api/avis/${id}/signalement`, {}); }
  adminAvisSignales() { return this.http.get<AvisSignale[]>('/api/admin/avis-signales'); }
  modererAvis(id: number, decision: 'masquer' | 'conserver') {
    return this.http.patch<ReponseApi>(`/api/admin/avis/${id}/moderation`, { decision });
  }
  adminDisciplines() { return this.http.get<Discipline[]>('/api/admin/disciplines'); }
  creerDiscipline(libelle: string) { return this.http.post<ReponseApi>('/api/admin/disciplines', { libelle }); }
  renommerDiscipline(id: number, libelle: string) { return this.http.put<ReponseApi>(`/api/admin/disciplines/${id}`, { libelle }); }
  supprimerDiscipline(id: number) { return this.http.delete<ReponseApi>(`/api/admin/disciplines/${id}`); }
  adminSalles() { return this.http.get<SalleAdmin[]>('/api/admin/salles'); }
  validerSalle(id: number, statut: 'validee' | 'refusee') {
    return this.http.patch<ReponseApi>(`/api/admin/salles/${id}/validation`, { statut });
  }
  gestionnaireSalles() { return this.http.get<SalleGestionnaire[]>('/api/gestionnaire/salles'); }
  creerSalle(f: FormSalle) { return this.http.post<ReponseApi>('/api/gestionnaire/salles', f); }
  modifierSalle(id: number, f: FormSalle) { return this.http.put<ReponseApi>(`/api/gestionnaire/salles/${id}`, f); }
  supprimerSalle(id: number) { return this.http.delete<ReponseApi>(`/api/gestionnaire/salles/${id}`); }
  gestionnaireReservations() {
    return this.http.get<ReservationGestionnaire[]>('/api/gestionnaire/reservations').pipe(
      map((l) => l.map((r) => ({ ...r, dateDebut: iso(r.dateDebut), dateReservation: iso(r.dateReservation) }))),
    );
  }
  gestionnaireAvis() {
    return this.http.get<AvisGestionnaire[]>('/api/gestionnaire/avis').pipe(
      map((l) => l.map((a) => ({ ...a, dateAvis: iso(a.dateAvis) }))),
    );
  }

  coachsPublics() { return this.http.get<CoachResume[]>('/api/coachs'); }

  /** Calendrier public : séances ouvertes entre deux dates (début inclus, fin exclue, AAAA-MM-JJ). */
  calendrier(debut: string, fin: string) {
    const params = new HttpParams().set('debut', debut).set('fin', fin);
    return this.http.get<SeanceCalendrier[]>('/api/calendrier', { params }).pipe(
      map((l) => l.map((x) => ({ ...x, dateDebut: iso(x.dateDebut), dateFin: iso(x.dateFin) }))),
    );
  }

  // Espace coach
  coachOptions() { return this.http.get<OptionsCoach>('/api/coach/options'); }
  coachSeances() {
    return this.http.get<SeanceCoach[]>('/api/coach/seances').pipe(
      map((l) => l.map((x) => ({ ...x, dateDebut: iso(x.dateDebut), dateFin: iso(x.dateFin) }))),
    );
  }
  creerSeance(f: FormSeance) { return this.http.post<ReponseApi>('/api/coach/seances', f); }
  modifierSeance(id: number, f: FormSeance) { return this.http.put<ReponseApi>(`/api/coach/seances/${id}`, f); }
  supprimerSeance(id: number) { return this.http.delete<ReponseApi>(`/api/coach/seances/${id}`); }
  disponibilites() {
    return this.http.get<Disponibilite[]>('/api/coach/disponibilites').pipe(
      map((l) => l.map((x) => ({ ...x, dateDebut: iso(x.dateDebut), dateFin: iso(x.dateFin) }))),
    );
  }
  ajouterDisponibilite(dateDebut: string, dateFin: string) {
    return this.http.post<ReponseApi>('/api/coach/disponibilites', { dateDebut, dateFin });
  }
  supprimerDisponibilite(id: number) { return this.http.delete<ReponseApi>(`/api/coach/disponibilites/${id}`); }
}
