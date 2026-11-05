import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Favori, MonAvis, Reservation } from '../core/models';

@Component({
  selector: 'app-mes-reservations',
  imports: [DatePipe, RouterLink, FormsModule],
  styles: `
    .espace { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 1.5rem; align-items: start; }
    .menu { padding: .7rem; display: grid; gap: .2rem; }
    .menu button { font: inherit; font-weight: 600; text-align: left; padding: .75rem 1rem; border: 0; border-radius: 12px; background: transparent; color: var(--ink); cursor: pointer; }
    .menu button:hover { background: var(--grey); }
    .menu button.actif { background: var(--chip); color: var(--dgr); font-weight: 800; }
    h1 { margin-top: 0; }
    .avis-bloc { margin-top: 1.5rem; padding: 1.2rem; }
    .avis-bloc h2 { margin-top: 0; font-size: 1.15rem; }
    .etoiles { display: flex; gap: .2rem; margin: .5rem 0; }
    .etoiles button { font-size: 1.7rem; line-height: 1; border: 0; background: transparent; cursor: pointer; color: var(--bor); padding: 0 .1rem; }
    .etoiles button.on { color: var(--ora); }
    .avis-bloc select, .avis-bloc textarea, .profil input { font: inherit; width: 100%; padding: .6rem .8rem; border: 1px solid var(--bor); border-radius: 10px; box-sizing: border-box; }
    .avis-bloc label, .profil label { display: block; font-weight: 700; margin: .8rem 0 .3rem; }
    .cibles { display: flex; gap: 1.2rem; margin: .4rem 0; }
    .cibles label { font-weight: 600; margin: 0; }
    .avis-item { padding: 1rem 1.2rem; }
    .avis-item .note { color: var(--ora); letter-spacing: .1em; }
    .profil { max-width: 420px; padding: 1.4rem; }
    .nom { font-weight: 700; }
    .table-res td, .table-res th { padding: .8rem .8rem; }
    .table-res .badge, .table-res .btn { white-space: nowrap; }
    .table-res .btn { padding: .4rem .9rem; }
    @media (max-width: 800px) { .espace { grid-template-columns: 1fr; } .menu { grid-auto-flow: column; overflow-x: auto; } }
  `,
  template: `
    <div class="espace">
      <aside class="carte menu" aria-label="Menu de mon compte">
        <button type="button" [class.actif]="section() === 'reservations'" (click)="section.set('reservations')">Mes réservations</button>
        <button type="button" [class.actif]="section() === 'favoris'" (click)="section.set('favoris')">Mes favoris</button>
        <button type="button" [class.actif]="section() === 'avis'" (click)="section.set('avis')">Mes avis</button>
        <button type="button" [class.actif]="section() === 'profil'" (click)="section.set('profil')">Mon profil</button>
      </aside>

      <section>
        @if (message()) {
          <p [class]="ok() ? 'succes' : 'erreur'" role="status">{{ message() }}</p>
        }

        @if (section() === 'profil') {
          <h1>Mon profil</h1>
          <form class="carte profil" (ngSubmit)="enregistrerProfil()">
            <label for="p-prenom">Prénom</label>
            <input id="p-prenom" name="prenom" [(ngModel)]="prenom" required minlength="2" maxlength="80" />
            <label for="p-nom">Nom</label>
            <input id="p-nom" name="nom" [(ngModel)]="nom" required minlength="2" maxlength="80" />
            <label for="p-email">E-mail</label>
            <input id="p-email" [value]="auth.user()?.email" disabled />
            <p class="aide">L'adresse e-mail ne peut pas être modifiée.</p>
            <button type="submit" class="btn">Enregistrer</button>
          </form>
        } @else if (section() === 'avis') {
          <h1>Mes avis</h1>
          <div class="liste">
            @for (a of mesAvis(); track a.id) {
              <div class="carte avis-item">
                <strong>{{ a.cible }}</strong> <span class="aide">({{ a.type === 'salle' ? 'salle' : 'coach' }}) · {{ a.dateAvis | date: 'd MMM y' }}</span>
                <div class="note" [attr.aria-label]="a.note + ' sur 5'">{{ '★'.repeat(a.note) }}{{ '☆'.repeat(5 - a.note) }}</div>
                @if (a.commentaire) { <p>{{ a.commentaire }}</p> }
                @if (!a.visible) { <span class="aide">Masqué par la modération.</span> }
              </div>
            } @empty {
              <p>Vous n'avez pas encore publié d'avis.</p>
            }
          </div>
        } @else if (section() === 'favoris') {
          <h1>Mes favoris</h1>
          <div class="liste">
            @for (f of favoris(); track f.id) {
              <a class="carte seance" [routerLink]="['/salles', f.id]">
                <h3>{{ f.nom }}</h3><span class="meta">{{ f.ville }}</span>
              </a>
            } @empty {
              <p>Aucune salle en favori. <a routerLink="/salles">Trouver une salle</a></p>
            }
          </div>
        } @else {
          <h1>Mes réservations</h1>
          <div class="onglets" role="tablist">
            @for (o of onglets; track o.cle) {
              <button type="button" role="tab" [class.actif]="onglet() === o.cle" (click)="onglet.set(o.cle)">{{ o.libelle }}</button>
            }
          </div>

          <table class="tableau table-res">
            <thead><tr><th>Séance</th><th>Date</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody>
              @for (r of visibles(); track r.idSeance) {
                <tr>
                  <td><span class="nom">{{ r.titre }}</span> · {{ r.salle }}<br /><span class="aide">{{ r.ville }}</span></td>
                  <td>{{ r.dateDebut | date: 'EEE d MMM · HH:mm' }}</td>
                  <td>
                    <span class="badge" [class.ok]="r.statut === 'confirmee'" [class.attente]="r.statut === 'en_attente'" [class.complet]="r.statut === 'annulee'">
                      {{ libelleStatut(r.statut) }}
                    </span>
                  </td>
                  <td>
                    @if (r.statut !== 'annulee' && futur(r)) {
                      <button type="button" class="btn btn-contour" (click)="annuler(r.idSeance)">Annuler</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4">Aucune réservation dans cette catégorie. <a routerLink="/salles">Trouver une salle</a></td></tr>
              }
            </tbody>
          </table>

          <div class="carte avis-bloc">
            <h2>Donner son avis</h2>
            @if (avisPossibles().length === 0) {
              <p class="aide">Vous pourrez donner votre avis après une séance confirmée et terminée.</p>
            } @else {
              <label for="a-seance">Séance suivie</label>
              <select id="a-seance" [ngModel]="choix()" (ngModelChange)="choix.set(+$event)" name="seance">
                @for (r of avisPossibles(); track r.idSeance) {
                  <option [value]="r.idSeance">{{ r.titre }} · {{ r.salle }} ({{ r.dateDebut | date: 'd MMM' }})</option>
                }
              </select>
              <div class="cibles" role="radiogroup" aria-label="Avis sur">
                <label><input type="radio" name="cible" value="salle" [ngModel]="cible()" (ngModelChange)="cible.set($event)" /> La salle</label>
                <label><input type="radio" name="cible" value="coach" [ngModel]="cible()" (ngModelChange)="cible.set($event)" /> Le coach</label>
              </div>
              <div class="etoiles" role="radiogroup" aria-label="Note">
                @for (n of [1, 2, 3, 4, 5]; track n) {
                  <button type="button" [class.on]="n <= note()" (click)="note.set(n)" [attr.aria-label]="n + ' sur 5'">★</button>
                }
              </div>
              <label for="a-comm">Commentaire</label>
              <textarea id="a-comm" name="commentaire" rows="3" maxlength="1000" [ngModel]="commentaire()" (ngModelChange)="commentaire.set($event)"></textarea>
              <p><button type="button" class="btn" [disabled]="note() < 1" (click)="publier()">Publier l'avis</button></p>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class MesReservationsPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly favoris = signal<Favori[]>([]);
  protected readonly section = signal<'reservations' | 'favoris' | 'avis' | 'profil'>('reservations');
  protected readonly mesAvis = signal<MonAvis[]>([]);
  protected readonly choix = signal(0);
  protected readonly cible = signal<'salle' | 'coach'>('salle');
  protected readonly note = signal(0);
  protected readonly commentaire = signal('');
  protected prenom = this.auth.user()?.prenom ?? '';
  protected nom = this.auth.user()?.nom ?? '';
  protected readonly onglet = signal<'avenir' | 'passees' | 'annulees'>('avenir');
  protected readonly message = signal('');
  protected readonly ok = signal(true);
  protected readonly onglets = [
    { cle: 'avenir' as const, libelle: 'À venir' },
    { cle: 'passees' as const, libelle: 'Passées' },
    { cle: 'annulees' as const, libelle: 'Annulées' },
  ];

  ngOnInit(): void {
    this.charger();
    this.api.favoris().subscribe((l) => this.favoris.set(l));
    this.chargerAvis();
  }

  private chargerAvis(): void { this.api.mesAvis().subscribe((l) => this.mesAvis.set(l)); }

  /** Réservations confirmées et déjà passées : seules celles-ci ouvrent droit à un avis. */
  protected avisPossibles(): Reservation[] {
    return this.reservations().filter((r) => r.statut === 'confirmee' && !this.futur(r));
  }

  protected publier(): void {
    const r = this.avisPossibles().find((x) => x.idSeance === (this.choix() || this.avisPossibles()[0]?.idSeance));
    if (!r) return;
    const appel = this.cible() === 'coach'
      ? this.api.publierAvisCoach(r.idCoach, this.note(), this.commentaire())
      : this.api.publierAvis(r.idSalle, this.note(), this.commentaire());
    appel.subscribe({
      next: (rep) => {
        this.message.set(rep.message ?? 'Avis publié.'); this.ok.set(true);
        this.note.set(0); this.commentaire.set(''); this.chargerAvis();
      },
      error: (e) => { this.message.set(messageErreur(e)); this.ok.set(false); },
    });
  }

  protected enregistrerProfil(): void {
    this.api.majProfil(this.nom.trim(), this.prenom.trim()).subscribe({
      next: (u) => { this.auth.user.set(u); this.message.set('Profil mis à jour.'); this.ok.set(true); },
      error: (e) => { this.message.set(messageErreur(e)); this.ok.set(false); },
    });
  }

  protected futur(r: Reservation): boolean { return new Date(r.dateDebut).getTime() > Date.now(); }
  protected libelleStatut(s: string): string {
    return ({ confirmee: 'Confirmée', en_attente: 'En attente', annulee: 'Annulée' } as Record<string, string>)[s] ?? s;
  }

  protected visibles(): Reservation[] {
    const o = this.onglet();
    return this.reservations().filter((r) =>
      o === 'annulees' ? r.statut === 'annulee'
        : o === 'avenir' ? r.statut !== 'annulee' && this.futur(r)
          : r.statut !== 'annulee' && !this.futur(r));
  }

  private charger(): void {
    this.api.mesReservations().subscribe({
      next: (l) => this.reservations.set(l),
      error: (e) => { this.message.set(messageErreur(e)); this.ok.set(false); },
    });
  }

  protected annuler(idSeance: number): void {
    this.api.annuler(idSeance).subscribe({
      next: (r) => { this.message.set(r.message ?? 'Réservation annulée.'); this.ok.set(true); this.charger(); },
      error: (e) => { this.message.set(messageErreur(e)); this.ok.set(false); },
    });
  }
}
