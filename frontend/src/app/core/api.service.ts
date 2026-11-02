import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import {
  Avis, Favori, Reservation, ReponseApi, SalleFiche, SalleGestionnaire, SalleResume,
  SauvegardeJournal, Seance, UtilisateurAdmin,
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
  adminUtilisateurs() { return this.http.get<UtilisateurAdmin[]>('/api/admin/utilisateurs'); }
  gestionnaireSalles() { return this.http.get<SalleGestionnaire[]>('/api/gestionnaire/salles'); }
}
