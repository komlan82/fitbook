import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';

const LIBELLE_ROLE: Record<string, string> = {
  coach: 'Coach',
  gestionnaire: 'Gestionnaire de salle',
  admin: 'Administration',
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  host: { '(document:click)': 'clicDehors($event)', '(document:keydown.escape)': 'menuOuvert.set(false)' },
  styles: `
    .compte { position: relative; }
    .badge-role { background: var(--chip); color: var(--dgr); font-weight: 700; font-size: .85rem; padding: .25rem .8rem; border-radius: 999px; white-space: nowrap; }
    .nom { font-weight: 600; }
    .avatar { width: 42px; height: 42px; border-radius: 50%; border: 0; background: var(--chip); color: var(--dgr); font: inherit; font-weight: 800; cursor: pointer; display: grid; place-items: center; }
    .avatar:hover { filter: brightness(.96); }
    .menu { position: absolute; right: 0; top: calc(100% + .5rem); min-width: 210px; padding: .4rem; display: grid; gap: .1rem; z-index: 10; box-shadow: 0 10px 28px rgba(0, 0, 0, .12); }
    .menu a, .menu button { font: inherit; font-weight: 600; text-align: left; padding: .6rem .8rem; border: 0; border-radius: 10px; background: transparent; color: var(--ink); text-decoration: none; cursor: pointer; }
    .menu a:hover, .menu button:hover { background: var(--grey); }
    .menu .identite { padding: .5rem .8rem .6rem; border-bottom: 1px solid var(--bor); margin-bottom: .3rem; }
    .menu .identite small { display: block; }
    .liens-pied { display: flex; justify-content: center; gap: 1.2rem; margin: 0 0 .5rem; }
    @media (max-width: 700px) { .nom { display: none; } }
  `,
  template: `
    <header class="entete">
      <a class="logo" routerLink="/salles" aria-label="FitBook, accueil">
        <span class="logo-pastille">F</span><span class="logo-nom">FitBook</span>
      </a>
      <nav aria-label="Navigation principale">
        <a routerLink="/salles" [class.actif]="rubrique() === 'salles'">Salles</a>
        <a routerLink="/salles" [queryParams]="{ onglet: 'coachs' }" [class.actif]="rubrique() === 'coachs'">Coachs</a>
        <a routerLink="/salles" [queryParams]="{ onglet: 'seances' }" [class.actif]="rubrique() === 'seances'">Séances</a>
      </nav>
      <div class="compte">
        @if (auth.user(); as u) {
          @if (libelleRole()) { <span class="badge-role">{{ libelleRole() }}</span> }
          <span class="nom">{{ u.prenom }} {{ u.nom }}</span>
          <button type="button" class="avatar" aria-haspopup="menu" [attr.aria-expanded]="menuOuvert()"
                  [attr.aria-label]="'Menu du compte de ' + u.prenom" (click)="menuOuvert.set(!menuOuvert())">{{ initiales() }}</button>
          @if (menuOuvert()) {
            <div class="carte menu" role="menu" (click)="menuOuvert.set(false)">
              <div class="identite"><strong>{{ u.prenom }} {{ u.nom }}</strong><small>{{ u.email }}</small></div>
              @if (u.role === 'sportif') { <a role="menuitem" routerLink="/mes-reservations">Mes réservations</a> }
              @if (u.role === 'coach') { <a role="menuitem" routerLink="/coach">Mes séances</a> }
              @if (u.role === 'admin' || u.role === 'gestionnaire') { <a role="menuitem" routerLink="/espace">Mon espace</a> }
              <button type="button" role="menuitem" (click)="deconnexion()">Déconnexion</button>
            </div>
          }
        } @else {
          <a class="btn btn-contour" routerLink="/connexion">Connexion</a>
          <a class="btn" routerLink="/inscription">S'inscrire</a>
        }
      </div>
    </header>

    <main class="page"><router-outlet /></main>

    <footer class="pied">
      <p class="liens-pied">
        <a routerLink="/calendrier" routerLinkActive="actif">Calendrier</a>
        <a routerLink="/contact" routerLinkActive="actif">Contact</a>
      </p>
      <p class="petit">FitBook · projet UAA MI08 · Angular 21 + Symfony 7.4 + MySQL 8</p>
    </footer>
  `,
})
export class App implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly menuOuvert = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), map((e) => e.urlAfterRedirects)),
    { initialValue: this.router.url },
  );

  /** Rubrique active de la navigation : se déduit de l'adresse (onglet de la recherche ou fiche d'une salle). */
  protected readonly rubrique = computed(() => {
    const u = this.url();
    if (!/^\/salles(\/|\?|$)/.test(u)) return '';
    const o = /[?&]onglet=(coachs|seances)/.exec(u);
    return o ? o[1] : 'salles';
  });

  protected readonly initiales = computed(() => {
    const u = this.auth.user();
    return u ? ((u.prenom[0] ?? '') + (u.nom[0] ?? '')).toUpperCase() : '';
  });
  protected readonly libelleRole = computed(() => LIBELLE_ROLE[this.auth.user()?.role ?? ''] ?? '');

  ngOnInit(): void {
    this.auth.charger().subscribe();
  }

  protected clicDehors(e: Event): void {
    if (this.menuOuvert() && !(e.target as HTMLElement).closest('.compte')) this.menuOuvert.set(false);
  }

  protected deconnexion(): void {
    this.auth.deconnexion().subscribe(() => this.router.navigateByUrl('/salles'));
  }
}
