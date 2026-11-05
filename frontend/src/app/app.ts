import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="entete">
      <a class="logo" routerLink="/salles" aria-label="FitBook, accueil">
        <span class="logo-pastille">F</span><span class="logo-nom">FitBook</span>
      </a>
      <nav aria-label="Navigation principale">
        <a routerLink="/salles" routerLinkActive="actif">Salles</a>
        <a routerLink="/calendrier" routerLinkActive="actif">Calendrier</a>
        @if (auth.estSportif()) {
          <a routerLink="/mes-reservations" routerLinkActive="actif">Mes réservations</a>
        }
        @if (auth.user()?.role === 'coach') {
          <a routerLink="/coach" routerLinkActive="actif">Mes séances</a>
        }
        @if (auth.user()?.role === 'admin' || auth.user()?.role === 'gestionnaire') {
          <a routerLink="/espace" routerLinkActive="actif">Mon espace</a>
        }
        <a routerLink="/contact" routerLinkActive="actif">Contact</a>
      </nav>
      <div class="compte">
        @if (auth.user(); as u) {
          <span class="bonjour">{{ u.prenom }} <small>({{ u.role }})</small></span>
          <button class="btn btn-contour" type="button" (click)="deconnexion()">Déconnexion</button>
        } @else {
          <a class="btn btn-contour" routerLink="/connexion">Connexion</a>
          <a class="btn" routerLink="/inscription">S'inscrire</a>
        }
      </div>
    </header>

    <main class="page"><router-outlet /></main>

    <footer class="pied">
      <p class="petit">FitBook · projet UAA MI08 · Angular 21 + Symfony 7.4 + MySQL 8</p>
    </footer>
  `,
})
export class App implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  ngOnInit(): void {
    this.auth.charger().subscribe();
  }

  protected deconnexion(): void {
    this.auth.deconnexion().subscribe(() => this.router.navigateByUrl('/salles'));
  }
}
