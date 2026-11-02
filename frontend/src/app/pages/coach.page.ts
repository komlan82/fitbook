import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Disponibilite, FormSeance, OptionsCoach, SeanceCoach } from '../core/models';

@Component({
  selector: 'app-coach',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <h1>Mes séances</h1>
    @if (auth.user()?.role !== 'coach') {
      <p class="erreur" role="alert">Cet espace est réservé aux coachs.</p>
    } @else {
      @if (message()) { <p [class]="ok() ? 'succes' : 'erreur'" role="status">{{ message() }}</p> }

      <h2>{{ enEdition() ? 'Modifier la séance' : 'Créer une séance' }}</h2>
      <form class="carte formulaire" [formGroup]="form" (ngSubmit)="valider()">
        <div class="grille-form">
          <label>Titre
            <input type="text" formControlName="titre" />
            @if (form.controls.titre.touched && form.controls.titre.invalid) { <span class="aide erreur">2 à 100 caractères.</span> }
          </label>
          <label>Salle
            <select formControlName="idSalle">
              <option value="" disabled>Choisir…</option>
              @for (s of options().salles; track s.id) { <option [value]="s.id">{{ s.nom }} ({{ s.ville }})</option> }
            </select>
          </label>
          <label>Discipline
            <select formControlName="idDiscipline">
              <option value="" disabled>Choisir…</option>
              @for (d of options().disciplines; track d.id) { <option [value]="d.id">{{ d.libelle }}</option> }
            </select>
          </label>
          <label>Type
            <select formControlName="typeSeance">
              <option value="collective">Collective</option>
              <option value="individuelle">Individuelle</option>
            </select>
          </label>
          <label>Début
            <input type="datetime-local" formControlName="dateDebut" />
          </label>
          <label>Fin
            <input type="datetime-local" formControlName="dateFin" />
          </label>
          <label>Prix (€)
            <input type="number" min="0" max="500" step="0.5" formControlName="prix" />
          </label>
          <label>Places
            <input type="number" min="1" max="500" formControlName="placesMax" />
          </label>
        </div>
        <div class="action">
          <button class="btn" type="submit" [disabled]="form.invalid || envoi()">{{ enEdition() ? 'Enregistrer' : 'Créer la séance' }}</button>
          @if (enEdition()) { <button class="btn btn-contour" type="button" (click)="annulerEdition()">Annuler la modification</button> }
        </div>
      </form>

      <h2>Mon planning</h2>
      <div class="defilant">
        <table class="tableau">
          <thead><tr><th>Date</th><th>Séance</th><th>Salle</th><th>Réservations</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            @for (s of seances(); track s.id) {
              <tr>
                <td>{{ s.dateDebut | date: 'EEE d MMM · HH:mm' }}</td>
                <td>{{ s.titre }}<br /><small>{{ s.discipline }} · {{ s.prix }} €</small></td>
                <td>{{ s.salle }}</td>
                <td>{{ s.nbReservations }} / {{ s.placesMax }}</td>
                <td><span class="badge" [class.ok]="s.statut === 'ouverte'" [class.complet]="s.statut !== 'ouverte'">{{ s.statut }}</span></td>
                <td><div class="action">
                  @if (s.statut === 'ouverte' && futur(s.dateDebut)) {
                    <button type="button" class="btn btn-contour" (click)="editer(s)">Modifier</button>
                  }
                  @if (s.statut !== 'annulee') {
                    <button type="button" class="btn btn-contour" (click)="supprimer(s)">{{ s.nbReservations > 0 ? 'Annuler' : 'Supprimer' }}</button>
                  }
                </div></td>
              </tr>
            } @empty {
              <tr><td colspan="6">Aucune séance pour le moment.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <h2>Mes disponibilités</h2>
      <form class="carte formulaire" [formGroup]="formDispo" (ngSubmit)="ajouterDispo()">
        <div class="grille-form">
          <label>Du <input type="datetime-local" formControlName="dateDebut" /></label>
          <label>Au <input type="datetime-local" formControlName="dateFin" /></label>
        </div>
        <div class="action"><button class="btn" type="submit" [disabled]="formDispo.invalid">Ajouter la disponibilité</button></div>
      </form>
      <div class="liste">
        @for (d of dispos(); track d.id) {
          <article class="carte seance">
            <span>{{ d.dateDebut | date: 'EEEE d MMMM · HH:mm' }} → {{ d.dateFin | date: 'HH:mm (d MMM)' }}</span>
            <button type="button" class="btn btn-contour" (click)="supprimerDispo(d)">Retirer</button>
          </article>
        } @empty {
          <p>Aucune disponibilité enregistrée.</p>
        }
      </div>
    }
  `,
})
export class CoachPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  protected readonly options = signal<OptionsCoach>({ salles: [], disciplines: [] });
  protected readonly seances = signal<SeanceCoach[]>([]);
  protected readonly dispos = signal<Disponibilite[]>([]);
  protected readonly enEdition = signal<number | null>(null);
  protected readonly message = signal('');
  protected readonly ok = signal(true);
  protected readonly envoi = signal(false);

  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    idSalle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    idDiscipline: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    typeSeance: new FormControl('collective', { nonNullable: true }),
    dateDebut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dateFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    prix: new FormControl(12, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(500)] }),
    placesMax: new FormControl(10, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(500)] }),
  });
  protected readonly formDispo = new FormGroup({
    dateDebut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dateFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    if (this.auth.user()?.role !== 'coach') return;
    this.api.coachOptions().subscribe({ next: (o) => this.options.set(o), error: (e) => this.retour(messageErreur(e), false) });
    this.charger();
  }

  protected futur(date: string): boolean { return new Date(date).getTime() > Date.now(); }

  protected editer(s: SeanceCoach): void {
    this.enEdition.set(s.id);
    this.form.setValue({
      titre: s.titre, idSalle: String(s.idSalle), idDiscipline: String(s.idDiscipline), typeSeance: s.typeSeance,
      dateDebut: s.dateDebut.slice(0, 16), dateFin: s.dateFin.slice(0, 16), prix: Number(s.prix), placesMax: s.placesMax,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected annulerEdition(): void {
    this.enEdition.set(null);
    this.form.reset({ typeSeance: 'collective', prix: 12, placesMax: 10 });
  }

  protected valider(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const donnees: FormSeance = {
      titre: v.titre, idSalle: Number(v.idSalle), idDiscipline: Number(v.idDiscipline), typeSeance: v.typeSeance,
      dateDebut: v.dateDebut, dateFin: v.dateFin, prix: Number(v.prix), placesMax: Number(v.placesMax),
    };
    const id = this.enEdition();
    this.envoi.set(true);
    (id ? this.api.modifierSeance(id, donnees) : this.api.creerSeance(donnees)).subscribe({
      next: (r) => { this.envoi.set(false); this.retour(r.message ?? 'Enregistré.', true); this.annulerEdition(); this.charger(); },
      error: (e) => { this.envoi.set(false); this.retour(messageErreur(e), false); },
    });
  }

  protected supprimer(s: SeanceCoach): void {
    const texte = s.nbReservations > 0
      ? `Annuler « ${s.titre} » ? Les ${s.nbReservations} réservation(s) seront annulées.`
      : `Supprimer « ${s.titre} » ?`;
    if (!confirm(texte)) return;
    this.api.supprimerSeance(s.id).subscribe({
      next: (r) => { this.retour(r.message ?? 'Fait.', true); this.charger(); },
      error: (e) => this.retour(messageErreur(e), false),
    });
  }

  protected ajouterDispo(): void {
    const v = this.formDispo.getRawValue();
    this.api.ajouterDisponibilite(v.dateDebut, v.dateFin).subscribe({
      next: (r) => { this.retour(r.message ?? 'Ajoutée.', true); this.formDispo.reset(); this.charger(); },
      error: (e) => this.retour(messageErreur(e), false),
    });
  }

  protected supprimerDispo(d: Disponibilite): void {
    this.api.supprimerDisponibilite(d.id).subscribe({
      next: (r) => { this.retour(r.message ?? 'Retirée.', true); this.charger(); },
      error: (e) => this.retour(messageErreur(e), false),
    });
  }

  private charger(): void {
    this.api.coachSeances().subscribe((l) => this.seances.set(l));
    this.api.disponibilites().subscribe((l) => this.dispos.set(l));
  }

  private retour(texte: string, ok: boolean): void { this.message.set(texte); this.ok.set(ok); }
}
