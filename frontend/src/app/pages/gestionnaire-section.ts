import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, messageErreur } from '../core/api.service';
import { AvisGestionnaire, ReservationGestionnaire, SalleGestionnaire } from '../core/models';

/** Espace du gestionnaire : mes salles (cartes), réservations reçues et avis, selon la section choisie dans le menu. */
@Component({
  selector: 'app-gestionnaire-section',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule],
  styles: `
    .titre { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .titre h2 { margin: 0; font-size: 1.6rem; }
    h3 { margin: 1.8rem 0 .8rem; font-size: 1.15rem; }
    .chiffres { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .chiffre { padding: 1rem 1.2rem; }
    .chiffre span { display: block; color: var(--mut); font-weight: 600; font-size: .9rem; }
    .chiffre strong { font-size: 1.9rem; }
    .cartes { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .salle-carte { padding: 0; overflow: hidden; }
    .salle-carte .photo { height: 96px; display: grid; place-items: center; color: var(--mut); background: var(--chip); }
    .salle-carte .photo.attente { background: var(--warn); }
    .salle-carte .corps { padding: .9rem 1.1rem 1.1rem; display: grid; gap: .6rem; }
    .salle-carte .ligne-titre { display: flex; justify-content: space-between; align-items: center; gap: .6rem; }
    .salle-carte h4 { margin: 0; font-size: 1.15rem; }
    .salle-carte p { margin: 0; }
    .formulaire-carte { margin-top: 1.2rem; }
    .nom { font-weight: 700; }
    .avis-carte { margin-bottom: .8rem; }
  `,
  template: `
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
    @if (message()) { <p class="succes" role="status">{{ message() }}</p> }

    @switch (section()) {
      @case ('reservations') {
        <div class="titre"><h2>Réservations reçues</h2></div>
        <ng-container [ngTemplateOutlet]="tableReservations" [ngTemplateOutletContext]="{ liste: reservations() }" />
      }
      @case ('avis') {
        <div class="titre"><h2>Mes avis</h2></div>
        @for (a of avis(); track $index) {
          <div class="carte avis-carte">
            <strong>{{ a.salle }}</strong> · <span class="note">★ {{ a.note }}/5</span> · <span class="petit">{{ a.auteur }}, le {{ a.dateAvis | date: 'd MMM y' }}</span>
            @if (a.commentaire) { <p>{{ a.commentaire }}</p> }
          </div>
        } @empty {
          <p>Aucun avis pour le moment.</p>
        }
      }
      @default {
        <div class="titre">
          <h2>Mes salles</h2>
          <button type="button" class="btn" (click)="ouvrirAjout()">+ Ajouter une salle</button>
        </div>

        <div class="chiffres">
          <div class="carte chiffre"><span>Salles en ligne</span><strong>{{ nbEnLigne() }}</strong></div>
          <div class="carte chiffre"><span>Réservations à venir</span><strong>{{ nbAVenir() }}</strong></div>
          <div class="carte chiffre"><span>Note moyenne</span><strong>{{ noteMoyenne() }}</strong></div>
        </div>

        <h3>Mes salles</h3>
        <div class="cartes">
          @for (s of salles(); track s.id) {
            <article class="carte salle-carte">
              <div class="photo" [class.attente]="s.statutValidation !== 'validee'">photo</div>
              <div class="corps">
                <div class="ligne-titre">
                  <h4>{{ s.nom }}</h4>
                  <span class="badge" [class.ok]="s.statutValidation === 'validee'" [class.attente]="s.statutValidation === 'en_attente'">{{ libelle(s.statutValidation) }}</span>
                </div>
                <p class="aide">{{ s.adresse }} · {{ s.codePostal }} {{ s.ville }}</p>
                <div class="action">
                  <button type="button" class="btn btn-contour" (click)="modifier(s)">Modifier</button>
                  @if (aSupprimer() === s.id) {
                    <button type="button" class="btn" (click)="supprimer(s)">Confirmer la suppression</button>
                    <button type="button" class="btn btn-contour" (click)="aSupprimer.set(null)">Annuler</button>
                  } @else {
                    <button type="button" class="btn btn-contour" (click)="aSupprimer.set(s.id)">Supprimer</button>
                  }
                </div>
              </div>
            </article>
          } @empty {
            <p>Vous n'avez pas encore de salle. Cliquez sur « Ajouter une salle ».</p>
          }
        </div>

        @if (formulaireOuvert() || enEdition() !== null) {
          <h3>{{ enEdition() !== null ? 'Modifier la salle' : 'Ajouter une salle' }}</h3>
          <form class="carte formulaire etroit formulaire-carte" [formGroup]="form" (ngSubmit)="enregistrer()">
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
            @if (enEdition() === null) { <p class="petit">Une nouvelle salle est visible des sportifs seulement après validation par un administrateur.</p> }
            <div class="action">
              <button class="btn" type="submit" [disabled]="envoi()">{{ enEdition() !== null ? 'Enregistrer les modifications' : 'Ajouter la salle' }}</button>
              <button class="btn btn-contour" type="button" (click)="annulerEdition()">Annuler</button>
            </div>
          </form>
        }

        <h3>Réservations reçues</h3>
        <ng-container [ngTemplateOutlet]="tableReservations" [ngTemplateOutletContext]="{ liste: apercu() }" />
      }
    }

    <ng-template #tableReservations let-liste="liste">
      <table class="tableau">
        <thead><tr><th>Sportif</th><th>Séance</th><th>Date</th><th>Statut</th></tr></thead>
        <tbody>
          @for (r of liste; track $index) {
            <tr>
              <td class="nom">{{ r.sportif }}</td>
              <td>{{ r.titre }}<br /><span class="aide">{{ r.salle }}</span></td>
              <td>{{ r.dateDebut | date: 'EEE d MMM · HH:mm' }}</td>
              <td><span class="badge" [class.ok]="r.statut === 'confirmee'" [class.attente]="r.statut === 'en_attente'">{{ libelleReservation(r.statut) }}</span></td>
            </tr>
          } @empty {
            <tr><td colspan="4">Aucune réservation pour le moment.</td></tr>
          }
        </tbody>
      </table>
    </ng-template>
  `,
})
export class GestionnaireSection implements OnInit {
  /** Section choisie dans le menu de gauche : salles, reservations ou avis. */
  readonly section = input<string>('salles');

  private readonly api = inject(ApiService);
  protected readonly salles = signal<SalleGestionnaire[]>([]);
  protected readonly reservations = signal<ReservationGestionnaire[]>([]);
  protected readonly avis = signal<AvisGestionnaire[]>([]);
  protected readonly enEdition = signal<number | null>(null);
  protected readonly formulaireOuvert = signal(false);
  protected readonly aSupprimer = signal<number | null>(null);
  protected readonly message = signal('');
  protected readonly erreur = signal('');
  protected readonly envoi = signal(false);

  // Les trois chiffres du haut sont calculés à partir des listes déjà chargées.
  protected readonly nbEnLigne = computed(() => this.salles().filter((s) => s.statutValidation === 'validee').length);
  protected readonly nbAVenir = computed(() => {
    const maintenant = Date.now();
    return this.reservations().filter((r) => r.statut !== 'annulee' && new Date(r.dateDebut).getTime() >= maintenant).length;
  });
  protected readonly noteMoyenne = computed(() => {
    const notes = this.avis().map((a) => a.note);
    if (notes.length === 0) return '—';
    return '★ ' + (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1).replace('.', ',');
  });
  protected readonly apercu = computed(() => this.reservations().slice(0, 5));

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
    return statut === 'validee' ? 'Validée' : statut === 'refusee' ? 'Refusée' : 'En attente de validation';
  }

  protected libelleReservation(statut: string): string {
    return statut === 'confirmee' ? 'Confirmée' : statut === 'annulee' ? 'Annulée' : 'En attente';
  }

  protected ouvrirAjout(): void {
    this.message.set('');
    this.erreur.set('');
    this.annulerEdition();
    this.formulaireOuvert.set(true);
  }

  protected modifier(s: SalleGestionnaire): void {
    this.message.set('');
    this.erreur.set('');
    this.aSupprimer.set(null);
    this.formulaireOuvert.set(true);
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
    this.formulaireOuvert.set(false);
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
