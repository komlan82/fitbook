import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { SeanceCalendrier } from '../core/models';

/** AAAA-MM-JJ en heure locale (toISOString décalerait la date selon le fuseau). */
const formater = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const ajouterJours = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/** Lundi (00:00) de la semaine contenant la date donnée. */
const lundi = (d: Date): Date => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
};

@Component({
  selector: 'app-calendrier',
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Calendrier des séances</h1>
    <p class="meta">Toutes les séances ouvertes à la réservation, semaine par semaine.</p>

    <div class="cal-nav">
      <button type="button" class="btn btn-contour" (click)="decaler(-7)">← Semaine précédente</button>
      <strong>Semaine du {{ debut() | date: 'd MMMM y' }}</strong>
      <button type="button" class="btn btn-contour" (click)="aujourdhui()">Aujourd'hui</button>
      <button type="button" class="btn btn-contour" (click)="decaler(7)">Semaine suivante →</button>
    </div>

    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }

    <div class="cal-grille">
      @for (j of jours(); track j.getTime()) {
        <section class="cal-jour" [class.aujourdhui]="estAujourdhui(j)" [attr.aria-label]="(j | date: 'EEEE d MMMM')">
          <h3>{{ j | date: 'EEEE d' }}</h3>
          @for (s of seancesDuJour(j); track s.id) {
            <a class="carte cal-seance" [routerLink]="['/salles', s.idSalle]">
              <strong>{{ s.dateDebut | date: 'HH:mm' }} · {{ s.titre }}</strong>
              <span class="meta">{{ s.salle }} ({{ s.ville }})</span>
              <span class="meta">{{ s.coach }} · {{ s.prix }} €</span>
              <span class="badge" [class.ok]="s.placesRestantes > 0" [class.complet]="s.placesRestantes <= 0">
                {{ s.placesRestantes > 0 ? s.placesRestantes + ' place(s)' : 'Complet' }}
              </span>
            </a>
          } @empty {
            <p class="petit">Aucune séance</p>
          }
        </section>
      }
    </div>
  `,
})
export class CalendrierPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly debut = signal(lundi(new Date()));
  protected readonly seances = signal<SeanceCalendrier[]>([]);
  protected readonly erreur = signal('');
  protected readonly jours = computed(() => Array.from({ length: 7 }, (_, i) => ajouterJours(this.debut(), i)));

  ngOnInit(): void { this.charger(); }

  protected decaler(jours: number): void {
    this.debut.set(ajouterJours(this.debut(), jours));
    this.charger();
  }

  protected aujourdhui(): void {
    this.debut.set(lundi(new Date()));
    this.charger();
  }

  protected estAujourdhui(j: Date): boolean { return formater(j) === formater(new Date()); }

  protected seancesDuJour(j: Date): SeanceCalendrier[] {
    const cle = formater(j);
    return this.seances().filter((s) => s.dateDebut.startsWith(cle));
  }

  private charger(): void {
    this.erreur.set('');
    this.api.calendrier(formater(this.debut()), formater(ajouterJours(this.debut(), 7))).subscribe({
      next: (l) => this.seances.set(l),
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }
}
