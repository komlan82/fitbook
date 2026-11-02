import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SalleGestionnaire, UtilisateurAdmin } from '../core/models';

@Component({
  selector: 'app-espace',
  template: `
    <h1>Mon espace</h1>
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
    @switch (auth.user()?.role) {
      @case ('admin') {
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
        <h2>Mes salles</h2>
        <table class="tableau">
          <thead><tr><th>Salle</th><th>Ville</th><th>Validation</th></tr></thead>
          <tbody>
            @for (s of salles(); track s.id) {
              <tr><td>{{ s.nom }}</td><td>{{ s.ville }}</td><td>{{ s.statutValidation }}</td></tr>
            }
          </tbody>
        </table>
      }
      @default { <p>Cet espace est réservé aux gestionnaires de salle et aux administrateurs.</p> }
    }
  `,
})
export class EspacePage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly utilisateurs = signal<UtilisateurAdmin[]>([]);
  protected readonly salles = signal<SalleGestionnaire[]>([]);
  protected readonly erreur = signal('');

  ngOnInit(): void {
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      this.api.adminUtilisateurs().subscribe({ next: (l) => this.utilisateurs.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
    } else if (role === 'gestionnaire') {
      this.api.gestionnaireSalles().subscribe({ next: (l) => this.salles.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
    }
  }
}
