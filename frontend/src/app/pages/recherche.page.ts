import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { SalleResume } from '../core/models';

@Component({
  selector: 'app-recherche',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>Trouver une salle de sport</h1>

    <form class="carte recherche" [formGroup]="form" (ngSubmit)="chercher()">
      <label>Ville
        <input type="text" formControlName="ville" placeholder="Ixelles, Uccle…" />
      </label>
      <label>Discipline
        <select formControlName="discipline">
          <option value="">Toutes</option>
          @for (d of disciplines; track d) {
            <option [value]="d">{{ d }}</option>
          }
        </select>
      </label>
      <button class="btn" type="submit">Rechercher</button>
    </form>

    @if (chargement()) {
      <p role="status">Chargement…</p>
    } @else if (erreur()) {
      <p class="erreur" role="alert">{{ erreur() }}</p>
    } @else {
      <p class="compteur">{{ salles().length }} salle(s) trouvée(s)</p>
      <div class="grille">
        @for (s of salles(); track s.id) {
          <a class="carte salle" [routerLink]="['/salles', s.id]">
            <div class="photo" aria-hidden="true">photo</div>
            <h2>{{ s.nom }}</h2>
            <p class="meta">{{ s.ville }} · {{ s.disciplines ?? 'Aucune séance à venir' }}</p>
            <p class="ligne">
              <span class="note">
                @if (s.noteMoyenne) { ★ {{ s.noteMoyenne }} <small>({{ s.nbAvis }} avis)</small> }
                @else { Pas encore d'avis }
              </span>
              @if (s.prixMin) { <span>dès <strong>{{ s.prixMin }} €</strong></span> }
            </p>
          </a>
        } @empty {
          <p>Aucune salle ne correspond à votre recherche.</p>
        }
      </div>
    }
  `,
})
export class RecherchePage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly disciplines = ['Yoga', 'Pilates', 'Boxe', 'Musculation', 'Cardio'];
  protected readonly form = new FormGroup({
    ville: new FormControl('', { nonNullable: true }),
    discipline: new FormControl('', { nonNullable: true }),
  });
  protected readonly salles = signal<SalleResume[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal('');

  ngOnInit(): void { this.chercher(); }

  protected chercher(): void {
    const { ville, discipline } = this.form.getRawValue();
    this.chargement.set(true);
    this.erreur.set('');
    this.api.salles(ville, discipline).subscribe({
      next: (l) => { this.salles.set(l); this.chargement.set(false); },
      error: (e) => { this.erreur.set(messageErreur(e)); this.chargement.set(false); },
    });
  }
}
