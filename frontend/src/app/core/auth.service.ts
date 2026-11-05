import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, finalize, map, of, tap } from 'rxjs';
import { Utilisateur } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<Utilisateur | null>(null);
  readonly pret = signal(false);
  readonly estSportif = computed(() => this.user()?.role === 'sportif');

  charger() {
    return this.http.get<Utilisateur>('/api/me').pipe(
      tap((u) => this.user.set(u)),
      catchError(() => { this.user.set(null); return of(null); }),
      finalize(() => this.pret.set(true)),
    );
  }
  connexion(email: string, password: string) {
    return this.http.post<Utilisateur>('/api/login', { email, password }).pipe(tap((u) => this.user.set(u)));
  }
  inscription(nom: string, prenom: string, email: string, password: string, role: string) {
    return this.http.post<{ message: string; lienConfirmationDev?: string }>('/api/register', { nom, prenom, email, password, role });
  }
  deconnexion() {
    return this.http.post('/api/logout', {}).pipe(tap(() => this.user.set(null)));
  }
}

/** Réserve une route aux utilisateurs connectés (sinon redirection vers /connexion). */
export const connecteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const verdict = () => (auth.user() ? true : router.createUrlTree(['/connexion']));
  return auth.pret() ? verdict() : auth.charger().pipe(map(() => verdict()));
};
