import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { messageErreur } from '../core/api.service';

const NOM = /^[\p{L}\p{M}' \-]{2,80}$/u;
type Role = 'sportif' | 'coach' | 'gestionnaire';

@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, RouterLink],
  styles: `
    .page { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: 1.2rem; align-items: start; }
    .carte-form, .etape { padding: 1.6rem 1.6rem; }
    h1 { margin: 0 0 .3rem; font-size: 2rem; }
    .roles-titre { font-weight: 700; margin: 1.4rem 0 .6rem; color: var(--mut); }
    .roles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .6rem; }
    .role { font: inherit; text-align: left; padding: .8rem .8rem; min-width: 0; border: 2px solid var(--bor); border-radius: 16px; background: #fff; color: var(--ink); cursor: pointer; display: grid; gap: .25rem; align-content: start; }
    .role strong { font-size: .95rem; overflow-wrap: anywhere; }
    .role span { color: var(--mut); font-size: .85rem; }
    .role.actif { border-color: var(--dgr); background: var(--chip); }
    .role.actif strong { color: var(--dgr); }
    .deux { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
    .champ { display: grid; gap: .3rem; margin-top: .9rem; font-weight: 700; }
    .champ input { font: inherit; font-weight: 400; padding: .9rem 1rem; border: 1px solid var(--bor); border-radius: 16px; width: 100%; box-sizing: border-box; }
    .champ input:focus { outline: 2px solid var(--grn); }
    .btn-large { width: 100%; padding: 1rem; font-size: 1.1rem; margin-top: 1.4rem; }
    .cgu { text-align: center; color: var(--mut); font-size: .92rem; margin-top: 1rem; }
    .etape h2 { margin: 0 0 .2rem; }
    .mail { margin-top: 1.2rem; border: 1px solid var(--bor); border-radius: 20px; padding: 1.2rem 1.4rem; background: var(--bg); }
    .mail .marque { display: flex; align-items: center; gap: .6rem; font-weight: 800; font-size: 1.1rem; margin-bottom: 1rem; }
    .mail .logo { width: 34px; height: 34px; border-radius: 10px; background: var(--grn); color: #fff; display: grid; place-items: center; font-weight: 800; }
    .mail h3 { margin: 0 0 .4rem; }
    .mail .btn { display: block; text-align: center; width: 100%; box-sizing: border-box; margin: 1rem 0; padding: .9rem; }
    .mail .btn[aria-disabled=true] { opacity: .55; pointer-events: none; }
    @media (max-width: 900px) { .page { grid-template-columns: 1fr; } .roles { grid-template-columns: 1fr; } }
  `,
  template: `
    <div class="page">
      <section class="carte carte-form">
        <h1>Créer mon compte</h1>
        <p>Déjà inscrit ? <a routerLink="/connexion"><strong>Se connecter</strong></a></p>

        @if (succes(); as s) {
          <p class="succes" role="status">{{ s }}</p>
          <p>Regardez votre boîte mail (ou le panneau à droite) pour confirmer votre adresse, puis connectez-vous.</p>
          <a class="btn" routerLink="/connexion">Aller à la connexion</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="valider()">
            <p class="roles-titre" id="roles-lib">Je m'inscris en tant que</p>
            <div class="roles" role="radiogroup" aria-labelledby="roles-lib">
              @for (r of roles; track r.cle) {
                <button type="button" class="role" role="radio" [class.actif]="role() === r.cle" [attr.aria-checked]="role() === r.cle" (click)="role.set(r.cle)">
                  <strong>{{ r.titre }}</strong><span>{{ r.texte }}</span>
                </button>
              }
            </div>

            <div class="deux">
              <label class="champ">Prénom
                <input type="text" formControlName="prenom" autocomplete="given-name" placeholder="Prénom" />
                @if (form.controls.prenom.touched && form.controls.prenom.invalid) {
                  <span class="aide erreur">2 à 80 lettres (espaces, apostrophes et tirets autorisés).</span>
                }
              </label>
              <label class="champ">Nom
                <input type="text" formControlName="nom" autocomplete="family-name" placeholder="Nom" />
                @if (form.controls.nom.touched && form.controls.nom.invalid) {
                  <span class="aide erreur">2 à 80 lettres (espaces, apostrophes et tirets autorisés).</span>
                }
              </label>
            </div>
            <label class="champ">Adresse email
              <input type="email" formControlName="email" autocomplete="email" placeholder="Adresse email" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <span class="aide erreur">Adresse email invalide.</span>
              }
            </label>
            <label class="champ">Mot de passe
              <input type="password" formControlName="password" autocomplete="new-password" placeholder="Mot de passe" />
              <span class="aide">10 caractères minimum, avec au moins une lettre et un chiffre.</span>
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <span class="aide erreur">Mot de passe trop faible.</span>
              }
            </label>
            @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
            <button class="btn btn-large" type="submit" [disabled]="envoi()">Créer mon compte</button>
            <p class="cgu">En vous inscrivant, vous acceptez les conditions d'utilisation.</p>
          </form>
        }
      </section>

      <aside class="carte etape" aria-label="Étape suivante">
        <h2>Étape suivante</h2>
        <p class="aide">Confirmation par email</p>
        <div class="mail">
          <div class="marque"><span class="logo" aria-hidden="true">F</span> FitBook</div>
          <h3>Confirmez votre adresse email</h3>
          <p class="aide">Bonjour, cliquez sur le bouton ci-dessous pour activer votre compte FitBook.</p>
          <a class="btn" [href]="lienDev() || null" [attr.aria-disabled]="lienDev() ? null : 'true'">Confirmer mon email</a>
          <p class="aide">Ce lien est valable 1 heure.</p>
        </div>
      </aside>
    </div>
  `,
})
export class InscriptionPage {
  private readonly http = inject(HttpClient);
  protected readonly erreur = signal('');
  protected readonly succes = signal('');
  protected readonly lienDev = signal('');
  protected readonly envoi = signal(false);
  protected readonly role = signal<Role>('sportif');
  protected readonly roles: { cle: Role; titre: string; texte: string }[] = [
    { cle: 'sportif', titre: 'Sportif', texte: 'Je réserve des séances' },
    { cle: 'coach', titre: 'Coach', texte: 'Je propose des séances' },
    { cle: 'gestionnaire', titre: 'Gestionnaire de salle', texte: 'Je gère mes salles' },
  ];
  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(NOM)] }),
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(NOM)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(180)] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(72), Validators.pattern(/^(?=.*\p{L})(?=.*\d).+$/u)],
    }),
  });

  protected valider(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.envoi.set(true);
    this.erreur.set('');
    this.http.post<{ message: string; lienConfirmationDev?: string }>('/api/register', { ...v, role: this.role() }).subscribe({
      next: (r) => { this.succes.set(r.message); this.lienDev.set(r.lienConfirmationDev ?? ''); },
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }
}
