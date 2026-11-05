import { Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { messageErreur } from '../core/api.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>Connexion</h1>
    @if (confirme() === '1') {
      <p class="succes" role="status">Votre adresse email est confirmée. Vous pouvez vous connecter.</p>
    }
    <form class="carte formulaire etroit" [formGroup]="form" (ngSubmit)="valider()">
      <label>Adresse email
        <input type="email" formControlName="email" autocomplete="username" />
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <span class="aide erreur">Saisissez une adresse email valide.</span>
        }
      </label>
      <label>Mot de passe
        <input type="password" formControlName="password" autocomplete="current-password" />
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <span class="aide erreur">Le mot de passe est obligatoire.</span>
        }
      </label>
      @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
      <button class="btn" type="submit" [disabled]="envoi()">Se connecter</button>
      <p class="petit">Pas encore de compte ? <a routerLink="/inscription">S'inscrire</a></p>
    </form>
  `,
})
export class ConnexionPage {
  readonly confirme = input<string>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly erreur = signal('');
  protected readonly envoi = signal(false);
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected valider(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.envoi.set(true);
    this.erreur.set('');
    this.auth.connexion(email, password).subscribe({
      next: (u) => this.router.navigateByUrl(u.role === 'sportif' ? '/salles' : u.role === 'coach' ? '/coach' : '/espace'),
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }
}
