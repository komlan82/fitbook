import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { AvisSignale, Discipline, SalleAdmin, UtilisateurAdmin } from '../core/models';
import { GestionnaireSection } from './gestionnaire-section';

@Component({
  selector: 'app-espace',
  imports: [GestionnaireSection, RouterLink, ReactiveFormsModule, DatePipe, NgTemplateOutlet],
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
    .avis-ligne { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: .8rem; }
    .avis-ligne p { margin: .3rem 0 0; }
    .discipline-form { display: flex; gap: .6rem; flex-wrap: wrap; align-items: flex-end; margin-top: 1rem; max-width: 520px; }
    .discipline-form label { flex: 1; min-width: 200px; }
    @media (max-width: 800px) { .espace { grid-template-columns: 1fr; } .menu { grid-auto-flow: column; overflow-x: auto; } }
  `,
  template: `
    @if (auth.user()?.role === 'admin' || auth.user()?.role === 'gestionnaire') {
      <div class="espace">
        <aside class="carte menu" aria-label="Menu de l'espace">
          @if (auth.user()?.role === 'admin') {
            <button type="button" [class.actif]="section() === 'salles'" (click)="section.set('salles')">Salles à valider</button>
            <button type="button" [class.actif]="section() === 'avis'" (click)="section.set('avis')">Avis à modérer</button>
            <button type="button" [class.actif]="section() === 'utilisateurs'" (click)="section.set('utilisateurs')">Utilisateurs</button>
            <button type="button" [class.actif]="section() === 'disciplines'" (click)="section.set('disciplines')">Disciplines</button>
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
              <div class="carte chiffre"><span>Avis signalés</span><strong>{{ avisSignales().length }}</strong></div>
              <div class="carte chiffre"><span>Utilisateurs actifs</span><strong>{{ nbActifs() }}</strong></div>
            </div>

            @switch (section()) {
              @case ('utilisateurs') {
              <h3>Utilisateurs de la plateforme</h3>
              <table class="tableau admin-table">
                <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Email confirmé</th><th>Actions</th></tr></thead>
                <tbody>
                  @for (u of utilisateurs(); track u.id) {
                    <tr>
                      <td class="nom">{{ u.prenom }} {{ u.nom }}</td><td>{{ u.email }}</td><td>{{ u.role }}</td><td>{{ u.emailConfirme ? 'oui' : 'non' }}</td>
                      <td>
                        @if (u.role !== 'admin') {
                          <div class="actions">
                            @if (utilisateurASupprimer() === u.id) {
                              <button type="button" class="btn" (click)="supprimerUtilisateur(u)">Confirmer la suppression</button>
                              <button type="button" class="btn btn-contour" (click)="utilisateurASupprimer.set(null)">Annuler</button>
                            } @else {
                              <button type="button" class="btn btn-contour" (click)="utilisateurASupprimer.set(u.id)">Supprimer</button>
                            }
                          </div>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              }
              @case ('avis') {
                <h3>Avis signalés</h3>
                <ng-container [ngTemplateOutlet]="listeAvis" />
              }
              @case ('disciplines') {
                <h3>Disciplines</h3>
                <table class="tableau admin-table">
                  <thead><tr><th>Discipline</th><th>Séances</th><th>Actions</th></tr></thead>
                  <tbody>
                    @for (d of disciplines(); track d.id) {
                      <tr>
                        <td class="nom">{{ d.libelle }}</td>
                        <td>{{ d.nbSeances }}</td>
                        <td><div class="actions">
                          <button type="button" class="btn btn-contour" (click)="modifierDiscipline(d)">Renommer</button>
                          @if (disciplineASupprimer() === d.id) {
                            <button type="button" class="btn" (click)="supprimerDiscipline(d)">Confirmer la suppression</button>
                            <button type="button" class="btn btn-contour" (click)="disciplineASupprimer.set(null)">Annuler</button>
                          } @else {
                            <button type="button" class="btn btn-contour" (click)="disciplineASupprimer.set(d.id)">Supprimer</button>
                          }
                        </div></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="3">Aucune discipline.</td></tr>
                    }
                  </tbody>
                </table>
                <form class="discipline-form" (ngSubmit)="enregistrerDiscipline()">
                  <label>{{ disciplineEnEdition() === null ? 'Nouvelle discipline' : 'Nouveau nom' }}
                    <input type="text" [formControl]="libelleDiscipline" maxlength="60" />
                    @if (libelleDiscipline.touched && libelleDiscipline.invalid) { <span class="aide erreur">Le nom comporte 2 à 60 caractères.</span> }
                  </label>
                  <button class="btn" type="submit">{{ disciplineEnEdition() === null ? 'Ajouter' : 'Enregistrer' }}</button>
                  @if (disciplineEnEdition() !== null) { <button class="btn btn-contour" type="button" (click)="annulerDiscipline()">Annuler</button> }
                </form>
              }
              @default {
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

                <h3>Avis signalés</h3>
                <ng-container [ngTemplateOutlet]="listeAvis" />
              }
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
    <ng-template #listeAvis>
      @for (a of avisSignales(); track a.id) {
        <div class="carte avis-ligne">
          <div>
            <strong>{{ a.auteur }} · {{ a.cible }}</strong> · <span class="note">★ {{ a.note }}</span> <span class="petit">· {{ a.dateAvis | date: 'd MMM y' }}</span>
            <p>{{ a.commentaire || '(sans commentaire)' }}</p>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-contour" (click)="moderer(a, 'masquer')">Masquer</button>
            <button type="button" class="btn" (click)="moderer(a, 'conserver')">Conserver</button>
          </div>
        </div>
      } @empty {
        <p>Aucun avis signalé pour le moment.</p>
      }
    </ng-template>
  `,
})
export class EspacePage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly section = signal('salles');
  protected readonly utilisateurs = signal<UtilisateurAdmin[]>([]);
  protected readonly sallesAdmin = signal<SalleAdmin[]>([]);
  protected readonly avisSignales = signal<AvisSignale[]>([]);
  protected readonly disciplines = signal<Discipline[]>([]);
  protected readonly utilisateurASupprimer = signal<number | null>(null);
  protected readonly disciplineEnEdition = signal<number | null>(null);
  protected readonly disciplineASupprimer = signal<number | null>(null);
  protected readonly libelleDiscipline = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)] });
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

  protected supprimerUtilisateur(u: UtilisateurAdmin): void {
    this.erreur.set('');
    this.message.set('');
    this.api.supprimerUtilisateur(u.id).subscribe({
      next: (r) => { this.message.set(r.message ?? 'Utilisateur supprimé.'); this.utilisateurASupprimer.set(null); this.chargerUtilisateurs(); },
      error: (er) => { this.erreur.set(messageErreur(er)); this.utilisateurASupprimer.set(null); },
    });
  }

  private chargerUtilisateurs(): void {
    this.api.adminUtilisateurs().subscribe({ next: (l) => this.utilisateurs.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  protected moderer(avis: AvisSignale, decision: 'masquer' | 'conserver'): void {
    this.erreur.set('');
    this.message.set('');
    this.api.modererAvis(avis.id, decision).subscribe({
      next: (r) => { this.message.set(r.message ?? 'Fait.'); this.chargerAvisSignales(); },
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }

  protected modifierDiscipline(d: Discipline): void {
    this.message.set('');
    this.erreur.set('');
    this.disciplineASupprimer.set(null);
    this.disciplineEnEdition.set(d.id);
    this.libelleDiscipline.setValue(d.libelle);
  }

  protected annulerDiscipline(): void {
    this.disciplineEnEdition.set(null);
    this.libelleDiscipline.reset('');
  }

  protected enregistrerDiscipline(): void {
    this.libelleDiscipline.markAsTouched();
    if (this.libelleDiscipline.invalid) return;
    const libelle = this.libelleDiscipline.value.trim();
    const id = this.disciplineEnEdition();
    this.erreur.set('');
    this.message.set('');
    const appel = id === null ? this.api.creerDiscipline(libelle) : this.api.renommerDiscipline(id, libelle);
    appel.subscribe({
      next: (r) => { this.message.set(r.message ?? 'Enregistré.'); this.annulerDiscipline(); this.chargerDisciplines(); },
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }

  protected supprimerDiscipline(d: Discipline): void {
    this.erreur.set('');
    this.message.set('');
    this.api.supprimerDiscipline(d.id).subscribe({
      next: (r) => { this.message.set(r.message ?? 'Discipline supprimée.'); this.disciplineASupprimer.set(null); this.chargerDisciplines(); },
      error: (e) => { this.erreur.set(messageErreur(e)); this.disciplineASupprimer.set(null); },
    });
  }

  private chargerAvisSignales(): void {
    this.api.adminAvisSignales().subscribe({ next: (l) => this.avisSignales.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  private chargerDisciplines(): void {
    this.api.adminDisciplines().subscribe({ next: (l) => this.disciplines.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  private chargerSallesAdmin(): void {
    this.api.adminSalles().subscribe({ next: (l) => this.sallesAdmin.set(l), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  ngOnInit(): void {
    if (this.auth.user()?.role === 'admin') {
      this.chargerSallesAdmin();
      this.chargerAvisSignales();
      this.chargerDisciplines();
      this.chargerUtilisateurs();
    }
  }
}
