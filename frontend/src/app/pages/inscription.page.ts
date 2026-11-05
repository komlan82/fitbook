import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';

const NOM = /^[\p{L}\p{M}' \-]{2,80}$/u;

@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>Créer un compte</h1>
    @if (succes(); as s) {
      <div class="carte etroit">
        <p class="succes" role="status">{{ s }}</p>
        @if (lienDev()) {
          <p class="petit">Mode développement (pas de serveur mail) :
            <a [href]="lienDev()">cliquer ici pour confirmer l'adresse</a></p>
        }
        <a class="btn" routerLink="/connexion">Aller à la connexion</a>
      </div>
    } @else {
      <form class="carte formulaire etroit" [formGroup]="form" (ngSubmit)="valider()">
        <label>Nom
          <input type="text" formControlName="nom" autocomplete="family-name" />
          @if (form.controls.nom.touched && form.controls.nom.invalid) {
            <span class="aide erreur">2 à 80 lettres (espaces, apostrophes et tirets autorisés).</span>
          }
        </label>
        <label>Prénom
          <input type="text" formControlName="prenom" autocomplete="given-name" />
          @if (form.controls.prenom.touched && form.controls.prenom.invalid) {
            <span class="aide erreur">2 à 80 lettres (espaces, apostrophes et tirets autorisés).</span>
          }
        </label>
        <label>Adresse email
          <input type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="aide erreur">Adresse email invalide.</span>
          }
        </label>
        <label>Mot de passe
         <input [type]="voirMdp() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
          <span class="aide">8 caractères minimum, avec au moins une lettre et un chiffre.</span>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="aide erreur">Mot de passe trop faible.</span>
          }
        </label>
        <label class="petit"><input type="checkbox" (change)="voirMdp.set(!voirMdp())" /> Afficher le mot de passe</label>
        <label>Je m'inscris comme
          <select formControlName="role">
            <option value="sportif">Sportif : je réserve des séances</option>
            <option value="coach">Coach : je propose des séances</option>
            <option value="gestionnaire">Gestionnaire : je gère une salle</option>
          </select>
        </label>
        @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
        <button class="btn" type="submit" [disabled]="envoi()">Créer mon compte</button>
        <p class="petit">Déjà inscrit ? <a routerLink="/connexion">Se connecter</a></p>
      </form>
    }
  `,
})

export class InscriptionPage {
  private readonly auth = inject(AuthService);
  protected readonly erreur = signal('');
  protected readonly succes = signal('');
  protected readonly lienDev = signal('');
  protected readonly envoi = signal(false);
  protected readonly voirMdp = signal(false);
  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(NOM)] }),
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(NOM)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(180)] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*\p{L})(?=.*\d).+$/u)],
    }),
    role: new FormControl('sportif', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^(sportif|coach|gestionnaire)$/)] }),
  });

  protected valider(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.envoi.set(true);
    this.erreur.set('');
    this.auth.inscription(v.nom, v.prenom, v.email, v.password, v.role).subscribe({
      next: (r) => { this.succes.set(r.message); this.lienDev.set(r.lienConfirmationDev ?? ''); },
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }
}
