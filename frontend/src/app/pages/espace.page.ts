import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SalleAdmin, UtilisateurAdmin } from '../core/models';
import { GestionnaireSection } from './gestionnaire-section';

@Component({
  selector: 'app-espace',
  imports: [GestionnaireSection, RouterLink],
  styles: `
    .espace { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 1.5rem; align-items: start; }
    .menu { padding: .7rem; display: grid; gap: .2rem; }
    .menu button, .menu a { font: inherit; font-weight: 600; text-align: left; text-decoration: none; padding: .75rem 1rem; border: 0; border-radius: 12px; background: transparent; color: var(--ink); cursor: pointer; }
    .menu button:hover, .menu a:hover { background: var(--grey); }
    .menu button.actif { background: var(--chip); color: var(--dgr); font-weight: 800; }
    .role { display: inline-block; margin-bottom: .6rem; }
    .titre { margin: 0 0 1rem; font-size: 1.6rem; }
    h3 { margin: 1.8rem 0 .8rem; font-size: 1.15rem; }
    .chiffres { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .chiffre { padding: 1rem 1.2rem; }
    .chiffre span { display: block; color: var(--mut); font-weight: 600; font-size: .9rem; }
    .chiffre strong { font-size: 1.9rem; }
    .nom { font-weight: 700; }
    .admin-table td, .admin-table th { padding: .7rem .6rem; }
    .admin-table .badge, .admin-table .actions .btn { white-space: nowrap; }
    .admin-table .actions { display: flex; gap: .4rem; flex-wrap: nowrap; align-items: center; }
    .admin-table .actions .btn { padding: .4rem .8rem; font-size: .9rem; }
    .admin-table .salle { min-width: 150px; }
    .admin-table .gest { white-space: nowrap; }
    @media (max-width: 800px) { .espace { grid-template-columns: 1fr; } .menu { grid-auto-flow: column; overflow-x: auto; } }
  `,
  template: `
    @if (auth.user()?.role === 'admin' || auth.user()?.role === 'gestionnaire') {
      <div class="espace">
        <aside class="carte menu" aria-label="Menu de l'espace">
          @if (auth.user()?.role === 'admin') {
            <button type="button" [class.actif]="section() === 'salles'" (click)="section.set('salles')">Salles à valider</button>
            <button type="button" [class.actif]="section() === 'utilisateurs'" (click)="section.set('utilisateurs')">Utilisateurs</button>
          } @else {
            <button type="button" [class.actif]="section() === 'salles'" (click)="section.set('salles')">Mes salles</button>
            <a routerLink="/calendrier">Calendrier</a>
            <button type="button" [class.actif]="section() === 'reservations'" (click)="section.set('reservations')">Réservations reçues</button>
            <button type="button" [class.actif]="section() === 'avis'" (click)="section.set('avis')">Mes avis</button>
          }
        </aside>

        <section>
          @if (auth.user()?.role === 'admin') {
            @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
            @if (message()) { <p class="succes" role="status">{{ message() }}</p> }
            <h2 class="titre">Administration</h2>
            <div class="chiffres">
              <div class="carte chiffre"><span>Salles en attente</span><strong>{{ nbEnAttente() }}</strong></div>
              <div class="carte chiffre"><span>Utilisateurs actifs</span><strong>{{ nbActifs() }}</strong></div>
            </div>

            @if (section() === 'utilisateurs') {
              <h3>Utilisateurs de la plateforme</h3>
              <table class="tableau">
                <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Email confirmé</th></tr></thead>
                <tbody>
                  @for (u of utilisateurs(); track u.id) {
                    <tr><td class="nom">{{ u.prenom }} {{ u.nom }}</td><td>{{ u.email }}</td><td>{{ u.role }}</td><td>{{ u.emailConfirme ? 'oui' : 'non' }}</td></tr>
                  }
                </tbody>
              </table>
            } @else {
              <h3>Salles à valider</h3>
              <table class="tableau admin-table">
                <thead><tr><th>Salle</th><th>Gestionnaire</th><th>Ville</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  @for (s of sallesAdmin(); track s.id) {
                    <tr>
                      <td class="nom salle">{{ s.nom }}<br /><span class="aide">{{ s.adresse }}</span></td>
                      <td class="gest">{{ s.gestionnaire }}</td>
                      <td>{{ s.ville }}</td>
                      <td><span class="badge" [class.ok]="s.statutValidation === 'validee'" [class.attente]="s.statutValidation === 'en_attente'">{{ libelle(s.statutValidation) }}</span></td>
                      <td><div class="actions">
                        @if (s.statutValidation === 'validee') {
                          <a class="btn btn-contour" [routerLink]="['/salles', s.id]">Voir</a>
                        } @else {
                          <button type="button" class="btn" (click)="decider(s, 'validee')">Valider</button>
                          @if (s.statutValidation !== 'refusee') { <button type="button" class="btn btn-contour" (click)="decider(s, 'refusee')">Refuser</button> }
                        }
                      </div></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5">Aucune salle.</td></tr>
                  }
                </tbody>
              </table>
            }
          } @else {
            <app-gestionnaire-section [section]="section()" />
          }
        </section>
      </div>
    } @else {
      <h1>Mon espace</h1>
      <p>Cet espace est réservé aux gestionnaires de salle et aux administrateurs.</p>
    }
  `,
})
export class EspacePage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly section = signal('salles');
  protected readonly utilisateurs = signal<UtilisateurAdmin[]>([]);
  protected readonly sallesAdmin = signal<SalleAdmin[]>([]);
  protected readonly message = signal('');
  protected readonly erreur = signal('');

  protected readonly nbEnAttente = computed(() => this.sallesAdmin().filter((s) => s.statutValidation === 'en_attente').length);
  protected readonly nbActifs = computed(() => this.utilisateurs().filter((u) => !!u.emailConfirme).length);

  protected libelle(statut: string): string {
    return statut === 'validee' ? 'Validée' : statut === 'refusee' ? 'Refusée' : 'En attente';
  }

  protected decider(salle: SalleAdmin, statut: 'validee' | 'refusee'): void {
    this.erreur.set('');
    this.message.set('');
    this.api.validerSalle(salle.id, statut).subscribe({
      next: () => {
        this.message.set(`La salle « ${salle.nom} » est maintenant ${statut === 'validee' ? 'validée' : 'refusée'}.`);
        this.chargerSallesAdmin();
      },
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }

  private chargerSallesAdmin(): void {
    this.api.adminSalles().subscribe({ next: (l) => this.sallesAdmin.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  ngOnInit(): void {
    if (this.auth.user()?.role === 'admin') {
      this.chargerSallesAdmin();
      this.api.adminUtilisateurs().subscribe({ next: (l) => this.utilisateurs.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
    }
  }
}
