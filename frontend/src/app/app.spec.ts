import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/auth.service';
import { messageErreur } from './core/api.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('FitBook – application', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it("affiche le nom FitBook et les liens de connexion quand personne n'est connecté", async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.match('/api/me').forEach((r) => r.flush({}, { status: 401, statusText: 'Unauthorized' }));
    http.match('/api/sauvegardes').forEach((r) => r.flush({ total: 1, message: 'Sauvegarde n°1', sauvegardes: [] }));
    await fixture.whenStable();
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('FitBook');
    expect(html).toContain('Connexion');
    expect(html).toContain("S'inscrire");
    expect(html).not.toContain('Déconnexion');
  });

  it('AuthService : est sportif uniquement avec le rôle sportif', () => {
    const auth = TestBed.inject(AuthService);
    auth.user.set({ id: 1, nom: 'A', prenom: 'B', email: 'a@b.be', role: 'sportif' });
    expect(auth.estSportif()).toBe(true);
    auth.user.set({ id: 2, nom: 'A', prenom: 'B', email: 'a@b.be', role: 'admin' });
    expect(auth.estSportif()).toBe(false);
  });

  it("messageErreur : privilégie le message renvoyé par l'API", () => {
    const e = new HttpErrorResponse({ status: 409, error: { code: 'COMPLETE', message: 'Cette séance est complète.' } });
    expect(messageErreur(e)).toBe('Cette séance est complète.');
    expect(messageErreur(new HttpErrorResponse({ status: 0 }))).toContain("Impossible de joindre l'API");
  });
});
