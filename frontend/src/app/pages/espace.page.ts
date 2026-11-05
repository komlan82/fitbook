import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SalleAdmin, UtilisateurAdmin } from '../core/models';
import { GestionnaireSection } from './gestionnaire-section';

@Component({
  selector: 'app-espace',
  imports: [GestionnaireSection],
  template: `
    <h1>Mon espace</h1>
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
    @switch (auth.user()?.role) {
      @case ('admin') {
        <h2>Validation des salles</h2>
        @if (message()) { <p class="succes" role="status">{{ message() }}</p> }
        <table class="tableau">
          <thead><tr><th>Salle</th><th>Ville</th><th>Gestionnaire</th><th>Statut</th><th>Action</th></tr></thead>
          <tbody>
            @for (s of sallesAdmin(); track s.id) {
              <tr>
                <td>{{ s.nom }}<br /><span class="aide">{{ s.adresse }}</span></td>
                <td>{{ s.ville }}</td>
                <td>{{ s.gestionnaire }}</td>
                <td><span class="badge" [class.ok]="s.statutValidation === 'validee'" [class.attente]="s.statutValidation === 'en_attente'">{{ libelle(s.statutValidation) }}</span></td>
                <td class="action">
                  @if (s.statutValidation !== 'validee') { <button type="button" class="btn" (click)="decider(s, 'validee')">Valider</button> }
                  @if (s.statutValidation !== 'refusee') { <button type="button" class="btn btn-contour" (click)="decider(s, 'refusee')">Refuser</button> }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5">Aucune salle.</td></tr>
            }
          </tbody>
        </table>
        <h2>Utilisateurs de la plateforme</h2>
        <table class="tableau">
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Email confirmé</th></tr></thead>
          <tbody>
            @for (u of utilisateurs(); track u.id) {
              <tr><td>{{ u.prenom }} {{ u.nom }}</td><td>{{ u.email }}</td><td>{{ u.role }}</td><td>{{ u.emailConfirme ? 'oui' : 'non' }}</td></tr>
            }
          </tbody>
        </table>
      }
      @case ('gestionnaire') {
        <app-gestionnaire-section />
      }
      @default { <p>Cet espace est réservé aux gestionnaires de salle et aux administrateurs.</p> }
    }
  `,
})
export class EspacePage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly utilisateurs = signal<UtilisateurAdmin[]>([]);
  protected readonly sallesAdmin = signal<SalleAdmin[]>([]);
  protected readonly message = signal('');
  protected readonly erreur = signal('');

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
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      this.chargerSallesAdmin();
      this.api.adminUtilisateurs().subscribe({ next: (l) => this.utilisateurs.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
    }
  }
}
