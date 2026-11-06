import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SalleFiche, Seance } from '../core/models';

@Component({
  selector: 'app-fiche-salle',
  imports: [DatePipe],
  styles: `
    .grille { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 1.5rem; align-items: start; }
    .photo { height: 280px; border-radius: 22px; background: #cfe8df; display: grid; place-items: center; color: var(--mut); font-weight: 700; }
    .identite { padding: 1.4rem 1.6rem; margin-top: 1rem; }
    .identite .haut { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .identite h1 { margin: 0 0 .3rem; }
    .note-moy { color: #c2410c; font-weight: 800; }
    .puces { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .7rem; }
    .puces span { background: var(--chip); color: var(--dgr); font-weight: 700; padding: .35rem .9rem; border-radius: 999px; }
    h2 { margin: 1.6rem 0 .8rem; }
    .ligne-seance { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.2rem; margin-bottom: .7rem; }
    .ligne-seance h3 { margin: 0 0 .2rem; }
    .droite { display: flex; align-items: center; gap: .8rem; white-space: nowrap; }
    .reservation { padding: 1.4rem; position: sticky; top: 1rem; }
    .reservation h2 { margin: 0 0 .6rem; }
    .reservation select { font: inherit; width: 100%; padding: .8rem 1rem; border: 1px solid var(--bor); border-radius: 14px; background: #fff; margin-bottom: .8rem; box-sizing: border-box; }
    .places { color: var(--dgr); font-weight: 800; margin: .4rem 0 .9rem; }
    .reservation .btn { width: 100%; padding: 1rem; font-size: 1.05rem; }
    .avis-carte { display: grid; grid-template-columns: 46px 1fr; gap: .8rem; padding: 1rem 1.2rem; margin-bottom: .8rem; }
    .avatar { width: 46px; height: 46px; border-radius: 50%; background: var(--chip); color: var(--dgr); font-weight: 800; display: grid; place-items: center; }
    .avis-tete { display: flex; justify-content: space-between; gap: .5rem; }
    .etoiles { color: #c2410c; letter-spacing: .08em; }
    .lien { background: none; border: 0; padding: 0; font: inherit; font-weight: 700; color: var(--mut); cursor: pointer; }
    .lien:hover { color: var(--ink); text-decoration: underline; }
    @media (max-width: 900px) { .grille { grid-template-columns: 1fr; } .reservation { position: static; } }
  `,
  template: `
    @if (erreur()) {
      <p class="erreur" role="alert">{{ erreur() }}</p>
    } @else if (salle(); as s) {
      @if (message()) {
        <p [class]="messageOk() ? 'succes' : 'erreur'" role="status">{{ message() }}</p>
      }
      <div class="grille">
        <div>
          <div class="photo" role="img" aria-label="Photo de la salle">photo de la salle</div>

          <section class="carte identite">
            <div class="haut">
              <div>
                <h1>{{ s.nom }}</h1>
                <p class="meta">{{ s.adresse }} · {{ s.codePostal }} {{ s.ville }}</p>
                <p>
                  @if (s.noteMoyenne) { <span class="note-moy">★ {{ s.noteMoyenne }}</span> <small>({{ s.nbAvis }} avis)</small> }
                  @else { <small>Pas encore d'avis</small> }
                </p>
              </div>
              @if (auth.estSportif()) {
                <button type="button" class="btn btn-contour" (click)="basculerFavori()">
                  {{ favori() ? '♥ Favori' : '♡ Favori' }}
                </button>
              }
            </div>
            @if (disciplines().length) {
              <div class="puces">@for (d of disciplines(); track d) { <span>{{ d }}</span> }</div>
            }
          </section>

          <h2>Prochaines séances</h2>
          @for (se of s.seances; track se.id) {
            <article class="carte ligne-seance">
              <div>
                <h3>{{ se.titre }}</h3>
                <p class="meta">{{ se.dateDebut | date: 'EEE d MMM · HH:mm' }} – {{ se.dateFin | date: 'HH:mm' }}<br />avec {{ prenom(se.coach) }}</p>
              </div>
              <div class="droite">
                @if (se.placesRestantes > 0) {
                  <span class="badge ok">{{ se.placesRestantes }} places</span>
                  <button type="button" class="btn" (click)="reserver(se.id)">Réserver</button>
                } @else {
                  <span class="badge complet">Complet</span>
                  <button type="button" class="btn" disabled>Réserver</button>
                }
              </div>
            </article>
          } @empty {
            <p>Aucune séance à venir pour le moment.</p>
          }
        </div>

        <aside>
          <section class="carte reservation" aria-label="Réservation">
            <h2>Réservation</h2>
            <p><strong>Prix de la séance : {{ choisie() ? choisie()!.prix + ' €' : prixDe(s.seances) }}</strong></p>
            <select aria-label="Date" [value]="jour()" (change)="choisirJour($any($event.target).value)">
              <option value="">Date</option>
              @for (j of jours(); track j.cle) { <option [value]="j.cle">{{ j.cle | date: 'EEE d MMM' }}</option> }
            </select>
            <select aria-label="Créneau / séance" [value]="idChoisie()" (change)="choisirCreneau(+$any($event.target).value)">
              <option value="0">Créneau / séance</option>
              @for (se of seancesDuJour(); track se.id) {
                <option [value]="se.id">{{ se.dateDebut | date: (jour() ? 'HH:mm' : 'EEE d MMM · HH:mm') }} · {{ se.titre }}</option>
              }
            </select>
            @if (choisie(); as c) { <p class="places">Places restantes : {{ c.placesRestantes }}</p> }
            <button type="button" class="btn" [disabled]="!choisie() || choisie()!.placesRestantes < 1" (click)="reserver(choisie()!.id)">Réserver</button>
          </section>

          <h2>Avis des sportifs</h2>
          @for (a of s.avis; track a.id) {
            <article class="carte avis-carte">
              <div class="avatar" aria-hidden="true">{{ initiales(a.auteur) }}</div>
              <div>
                <div class="avis-tete">
                  <div><strong>{{ a.auteur }}</strong><br /><span class="aide">{{ a.dateAvis | date: 'd MMM y' }}</span></div>
                  <span class="etoiles" [attr.aria-label]="a.note + ' sur 5'">{{ etoiles(a.note) }}</span>
                </div>
                @if (a.commentaire) { <p>{{ a.commentaire }}</p> }
                @if (auth.estSportif()) { <button type="button" class="lien" (click)="signaler(a.id)">Signaler</button> }
              </div>
            </article>
          } @empty {
            <p>Aucun avis pour le moment.</p>
          }
        </aside>
      </div>
    } @else {
      <p role="status">Chargement…</p>
    }
  `,
})
export class FicheSallePage {
  readonly id = input.required<string>();
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly salle = signal<SalleFiche | null>(null);
  protected readonly erreur = signal('');
  protected readonly message = signal('');
  protected readonly messageOk = signal(true);
  protected readonly favori = signal(false);
  protected readonly jour = signal('');
  protected readonly idChoisie = signal(0);

  protected readonly disciplines = computed(() => [...new Set((this.salle()?.seances ?? []).map((s) => s.discipline))]);
  protected readonly jours = computed(() => {
    const cles = [...new Set((this.salle()?.seances ?? []).map((s) => s.dateDebut.slice(0, 10)))];
    return cles.map((cle) => ({ cle }));
  });
  protected readonly seancesDuJour = computed(() => {
    const toutes = this.salle()?.seances ?? [];
    return this.jour() ? toutes.filter((s) => s.dateDebut.slice(0, 10) === this.jour()) : toutes;
  });
  protected readonly choisie = computed<Seance | null>(() => this.seancesDuJour().find((s) => s.id === this.idChoisie()) ?? null);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.charger(id);
      if (this.auth.estSportif()) {
        this.api.favoris().subscribe((l) => this.favori.set(l.some((f) => f.id === id)));
      }
    });
  }

  protected etoiles(n: number): string { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  protected prenom(coach: string): string { return coach.split(' ')[0]; }
  protected initiales(auteur: string): string { return auteur.split(' ').map((m) => m[0]).join('').replace('.', '').toUpperCase(); }
  protected prixDe(l: Seance[]): string {
    if (!l.length) return '—';
    return 'à partir de ' + Math.min(...l.map((s) => Number(s.prix))) + ' €';
  }

  protected choisirJour(cle: string): void { this.jour.set(cle); this.idChoisie.set(0); }
  protected choisirCreneau(id: number): void {
    this.idChoisie.set(id);
    const se = (this.salle()?.seances ?? []).find((x) => x.id === id);
    if (se) this.jour.set(se.dateDebut.slice(0, 10));
  }

  private charger(id: number): void {
    this.api.salle(id).subscribe({
      next: (s) => this.salle.set(s),
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }

  private afficher(texte: string, ok: boolean): void { this.message.set(texte); this.messageOk.set(ok); }

  protected reserver(idSeance: number): void {
    if (!this.auth.user()) { this.router.navigateByUrl('/connexion'); return; }
    this.api.reserver(idSeance).subscribe({
      next: (r) => { this.afficher(r.message ?? 'Réservation confirmée.', true); this.charger(Number(this.id())); },
      error: (e) => this.afficher(messageErreur(e), false),
    });
  }

  protected basculerFavori(): void {
    const id = Number(this.id());
    const appel = this.favori() ? this.api.retirerFavori(id) : this.api.ajouterFavori(id);
    appel.subscribe({
      next: () => this.favori.update((v) => !v),
      error: (e) => this.afficher(messageErreur(e), false),
    });
  }

  protected signaler(idAvis: number): void {
    this.api.signalerAvis(idAvis).subscribe({
      next: (r) => this.afficher(r.message ?? 'Avis signalé.', true),
      error: (e) => this.afficher(messageErreur(e), false),
    });
  }
}
