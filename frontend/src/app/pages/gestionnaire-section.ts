import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, messageErreur } from '../core/api.service';
import { AvisGestionnaire, ReservationGestionnaire, SalleGestionnaire } from '../core/models';

/** Espace du gestionnaire : ses salles (création et modification), les réservations et les avis reçus. */
@Component({
  selector: 'app-gestionnaire-section',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
    @if (message()) { <p class="succes" role="status">{{ message() }}</p> }

    <h2>Mes salles</h2>
    <table class="tableau">
      <thead><tr><th>Salle</th><th>Ville</th><th>Validation</th><th>Action</th></tr></thead>
      <tbody>
        @for (s of salles(); track s.id) {
          <tr>
            <td>{{ s.nom }}<br /><span class="aide">{{ s.adresse }}, {{ s.codePostal }}</span></td>
            <td>{{ s.ville }}</td>
            <td><span class="badge" [class.ok]="s.statutValidation === 'validee'" [class.attente]="s.statutValidation === 'en_attente'">{{ libelle(s.statutValidation) }}</span></td>
            <td class="action">
              <button type="button" class="btn btn-contour" (click)="modifier(s)">Modifier</button>
              @if (aSupprimer() === s.id) {
                <button type="button" class="btn" (click)="supprimer(s)">Confirmer la suppression</button>
                <button type="button" class="btn btn-contour" (click)="aSupprimer.set(null)">Annuler</button>
              } @else {
                <button type="button" class="btn btn-contour" (click)="aSupprimer.set(s.id)">Supprimer</button>
              }
            </td>
          </tr>
        } @empty {
          <tr><td colspan="4">Vous n'avez pas encore de salle. Ajoutez-en une ci-dessous.</td></tr>
        }
      </tbody>
    </table>

    <h2>{{ enEdition() ? 'Modifier la salle' : 'Ajouter une salle' }}</h2>
    <form class="carte formulaire etroit" [formGroup]="form" (ngSubmit)="enregistrer()">
      <label>Nom de la salle
        <input type="text" formControlName="nom" maxlength="100" />
        @if (form.controls.nom.touched && form.controls.nom.invalid) { <span class="aide erreur">Le nom est obligatoire (100 caractères maximum).</span> }
      </label>
      <label>Adresse
        <input type="text" formControlName="adresse" maxlength="150" autocomplete="street-address" />
        @if (form.controls.adresse.touched && form.controls.adresse.invalid) { <span class="aide erreur">L'adresse est obligatoire (150 caractères maximum).</span> }
      </label>
      <label>Ville
        <input type="text" formControlName="ville" maxlength="60" />
        @if (form.controls.ville.touched && form.controls.ville.invalid) { <span class="aide erreur">La ville est obligatoire (60 caractères maximum).</span> }
      </label>
      <label>Code postal
        <input type="text" formControlName="codePostal" inputmode="numeric" maxlength="4" />
        @if (form.controls.codePostal.touched && form.controls.codePostal.invalid) { <span class="aide erreur">Le code postal comporte 4 chiffres.</span> }
      </label>
      @if (!enEdition()) { <p class="petit">Une nouvelle salle est visible des sportifs seulement après validation par un administrateur.</p> }
      <div class="action">
        <button class="btn" type="submit" [disabled]="envoi()">{{ enEdition() ? 'Enregistrer les modifications' : 'Ajouter la salle' }}</button>
        @if (enEdition()) { <button class="btn btn-contour" type="button" (click)="annulerEdition()">Annuler</button> }
      </div>
    </form>

    <h2>Réservations de mes salles</h2>
    <table class="tableau">
      <thead><tr><th>Séance</th><th>Salle</th><th>Date</th><th>Sportif</th><th>Statut</th></tr></thead>
      <tbody>
        @for (r of reservations(); track $index) {
          <tr>
            <td>{{ r.titre }}</td>
            <td>{{ r.salle }}</td>
            <td>{{ r.dateDebut | date: 'EEE d MMM · HH:mm' }}</td>
            <td>{{ r.sportif }}</td>
            <td><span class="badge" [class.ok]="r.statut === 'confirmee'" [class.attente]="r.statut === 'en_attente'">{{ libelleReservation(r.statut) }}</span></td>
          </tr>
        } @empty {
          <tr><td colspan="5">Aucune réservation pour le moment.</td></tr>
        }
      </tbody>
    </table>

    <h2>Avis reçus</h2>
    @for (a of avis(); track $index) {
      <div class="carte">
        <strong>{{ a.salle }}</strong> · ★ {{ a.note }}/5 · <span class="petit">{{ a.auteur }}, le {{ a.dateAvis | date: 'd MMM y' }}</span>
        @if (a.commentaire) { <p>{{ a.commentaire }}</p> }
      </div>
    } @empty {
      <p>Aucun avis pour le moment.</p>
    }
  `,
})
export class GestionnaireSection implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly salles = signal<SalleGestionnaire[]>([]);
  protected readonly reservations = signal<ReservationGestionnaire[]>([]);
  protected readonly avis = signal<AvisGestionnaire[]>([]);
  protected readonly enEdition = signal<number | null>(null);
  protected readonly aSupprimer = signal<number | null>(null);
  protected readonly message = signal('');
  protected readonly erreur = signal('');
  protected readonly envoi = signal(false);

  // Mêmes règles que le serveur (le serveur reste la vraie barrière de sécurité).
  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    adresse: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    ville: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    codePostal: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{4}$/)] }),
  });

  ngOnInit(): void {
    this.charger();
  }

  protected libelle(statut: string): string {
    return statut === 'validee' ? 'Validée' : statut === 'refusee' ? 'Refusée' : 'En attente';
  }

  protected libelleReservation(statut: string): string {
    return statut === 'confirmee' ? 'Confirmée' : statut === 'annulee' ? 'Annulée' : 'En attente';
  }

  protected modifier(s: SalleGestionnaire): void {
    this.message.set('');
    this.erreur.set('');
    this.aSupprimer.set(null);
    this.enEdition.set(s.id);
    this.form.reset({ nom: s.nom, adresse: s.adresse, ville: s.ville, codePostal: s.codePostal });
  }

  protected supprimer(s: SalleGestionnaire): void {
    this.erreur.set('');
    this.message.set('');
    this.api.supprimerSalle(s.id).subscribe({
      next: (r) => {
        this.message.set(r.message ?? 'Salle supprimée.');
        this.aSupprimer.set(null);
        if (this.enEdition() === s.id) this.annulerEdition();
        this.charger();
      },
      error: (e) => { this.erreur.set(messageErreur(e)); this.aSupprimer.set(null); },
    });
  }

  protected annulerEdition(): void {
    this.enEdition.set(null);
    this.form.reset({ nom: '', adresse: '', ville: '', codePostal: '' });
  }

  protected enregistrer(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const valeurs = this.form.getRawValue();
    const id = this.enEdition();
    this.envoi.set(true);
    this.erreur.set('');
    this.message.set('');
    const appel = id === null ? this.api.creerSalle(valeurs) : this.api.modifierSalle(id, valeurs);
    appel.subscribe({
      next: (r) => {
        this.message.set(r.message ?? 'Enregistré.');
        this.envoi.set(false);
        this.annulerEdition();
        this.form.markAsUntouched();
        this.charger();
      },
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }

  private charger(): void {
    const erreur = (e: unknown) => this.erreur.set(messageErreur(e));
    this.api.gestionnaireSalles().subscribe({ next: (l) => this.salles.set(l), error: erreur });
    this.api.gestionnaireReservations().subscribe({ next: (l) => this.reservations.set(l), error: erreur });
    this.api.gestionnaireAvis().subscribe({ next: (l) => this.avis.set(l), error: erreur });
  }
}
