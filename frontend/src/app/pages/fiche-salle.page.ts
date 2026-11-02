import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SalleFiche } from '../core/models';

@Component({
  selector: 'app-fiche-salle',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/salles" class="retour">← Retour aux salles</a>

    @if (erreur()) {
      <p class="erreur" role="alert">{{ erreur() }}</p>
    } @else if (salle(); as s) {
      <div class="entete-salle">
        <div>
          <h1>{{ s.nom }}</h1>
          <p class="meta">{{ s.adresse }} · {{ s.codePostal }} {{ s.ville }}</p>
          <p class="note">
            @if (s.noteMoyenne) { ★ {{ s.noteMoyenne }} <small>({{ s.nbAvis }} avis)</small> }
            @else { Pas encore d'avis }
          </p>
        </div>
        @if (auth.estSportif()) {
          <button type="button" class="btn btn-contour" (click)="basculerFavori()">
            {{ favori() ? '♥ Dans mes favoris' : '♡ Ajouter aux favoris' }}
          </button>
        }
      </div>

      @if (message()) {
        <p [class]="messageOk() ? 'succes' : 'erreur'" role="status">{{ message() }}</p>
      }

      <h2>Prochaines séances</h2>
      <div class="liste">
        @for (se of s.seances; track se.id) {
          <article class="carte seance">
            <div>
              <h3>{{ se.titre }}</h3>
              <p class="meta">
                {{ se.dateDebut | date: 'EEEE d MMMM · HH:mm' }} – {{ se.dateFin | date: 'HH:mm' }}
                · avec {{ se.coach }} · {{ se.discipline }}
              </p>
            </div>
            <div class="action">
              <span class="prix">{{ se.prix }} €</span>
              @if (se.placesRestantes > 0) {
                <span class="badge ok">{{ se.placesRestantes }} place(s)</span>
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

      <h2>Avis des sportifs</h2>
      <div class="liste">
        @for (a of s.avis; track $index) {
          <article class="carte avis">
            <p class="ligne"><strong>{{ a.auteur }}</strong>
              <span class="note">{{ etoiles(a.note) }}</span></p>
            <p>{{ a.commentaire }}</p>
            <p class="meta">{{ a.dateAvis | date: 'd MMMM y' }}</p>
          </article>
        } @empty {
          <p>Aucun avis pour le moment.</p>
        }
      </div>

      @if (auth.estSportif()) {
        <h2>Donner mon avis</h2>
        <form class="carte formulaire" [formGroup]="formAvis" (ngSubmit)="publierAvis()">
          <label>Note
            <select formControlName="note">
              @for (n of [5, 4, 3, 2, 1]; track n) { <option [value]="n">{{ etoiles(n) }}</option> }
            </select>
          </label>
          <label>Commentaire (facultatif)
            <textarea formControlName="commentaire" rows="3" maxlength="1000"></textarea>
          </label>
          <button class="btn" type="submit">Publier l'avis</button>
        </form>
      }
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
  protected readonly formAvis = new FormGroup({
    note: new FormControl(5, { nonNullable: true, validators: [Validators.min(1), Validators.max(5)] }),
    commentaire: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
  });

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

  protected publierAvis(): void {
    const { note, commentaire } = this.formAvis.getRawValue();
    this.api.publierAvis(Number(this.id()), Number(note), commentaire).subscribe({
      next: (r) => { this.afficher(r.message ?? 'Avis publié.', true); this.charger(Number(this.id())); },
      error: (e) => this.afficher(messageErreur(e), false),
    });
  }
}
