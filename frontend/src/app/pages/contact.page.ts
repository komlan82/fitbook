import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, messageErreur } from '../core/api.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  template: `
    <h1>Nous contacter</h1>
    <p>Ce formulaire est accessible sans connexion. Le message est enregistré en JSON et validé par un schéma JSON côté base de données.</p>
    <form class="carte formulaire etroit" [formGroup]="form" (ngSubmit)="envoyer()">
      <label>Nom
        <input type="text" formControlName="nom" />
        @if (form.controls.nom.touched && form.controls.nom.invalid) { <span class="aide erreur">2 à 80 caractères.</span> }
      </label>
      <label>Adresse email
        <input type="email" formControlName="email" />
        @if (form.controls.email.touched && form.controls.email.invalid) { <span class="aide erreur">Adresse email invalide.</span> }
      </label>
      <label>Message
        <textarea formControlName="message" rows="5"></textarea>
        @if (form.controls.message.touched && form.controls.message.invalid) { <span class="aide erreur">10 à 1000 caractères.</span> }
      </label>
      @if (retour()) { <p [class]="ok() ? 'succes' : 'erreur'" role="status">{{ retour() }}</p> }
      <button class="btn" type="submit">Envoyer</button>
    </form>
  `,
})
export class ContactPage {
  private readonly api = inject(ApiService);
  protected readonly retour = signal('');
  protected readonly ok = signal(true);
  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(1000)] }),
  });

  protected envoyer(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { nom, email, message } = this.form.getRawValue();
    this.api.contact(nom, email, message).subscribe({
      next: (r) => { this.retour.set(r.message ?? 'Message envoyé.'); this.ok.set(true); this.form.reset(); },
      error: (e) => { this.retour.set(messageErreur(e)); this.ok.set(false); },
    });
  }
}
