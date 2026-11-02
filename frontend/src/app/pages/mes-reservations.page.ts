import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { Favori, Reservation } from '../core/models';

@Component({
  selector: 'app-mes-reservations',
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Mes réservations</h1>
    @if (message()) {
      <p [class]="ok() ? 'succes' : 'erreur'" role="status">{{ message() }}</p>
    }
    <div class="onglets" role="tablist">
      @for (o of onglets; track o.cle) {
        <button type="button" role="tab" [class.actif]="onglet() === o.cle" (click)="onglet.set(o.cle)">{{ o.libelle }}</button>
      }
    </div>

    <div class="liste">
      @for (r of visibles(); track r.idSeance) {
        <article class="carte seance">
          <div>
            <h3>{{ r.titre }}</h3>
            <p class="meta">{{ r.dateDebut | date: 'EEEE d MMMM · HH:mm' }} · {{ r.salle }} ({{ r.ville }})</p>
          </div>
          <div class="action">
            <span class="badge" [class.ok]="r.statut === 'confirmee'" [class.attente]="r.statut === 'en_attente'" [class.complet]="r.statut === 'annulee'">
              {{ libelleStatut(r.statut) }}
            </span>
            @if (r.statut !== 'annulee' && futur(r)) {
              <button type="button" class="btn btn-contour" (click)="annuler(r.idSeance)">Annuler</button>
            }
          </div>
        </article>
      } @empty {
        <p>Aucune réservation dans cette catégorie. <a routerLink="/salles">Trouver une salle</a></p>
      }
    </div>

    <h2>Mes salles favorites</h2>
    <div class="liste">
      @for (f of favoris(); track f.id) {
        <a class="carte seance" [routerLink]="['/salles', f.id]">
          <h3>{{ f.nom }}</h3><span class="meta">{{ f.ville }}</span>
        </a>
      } @empty {
        <p>Aucune salle en favori.</p>
      }
    </div>
  `,
})
export class MesReservationsPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly favoris = signal<Favori[]>([]);
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
