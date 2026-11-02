import { Routes } from '@angular/router';
import { connecteGuard } from './core/auth.service';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'salles' },
  { path: 'salles', title: 'FitBook – Salles', loadComponent: () => import('./pages/recherche.page').then((m) => m.RecherchePage) },
  { path: 'salles/:id', title: 'FitBook – Salle', loadComponent: () => import('./pages/fiche-salle.page').then((m) => m.FicheSallePage) },
  { path: 'connexion', title: 'FitBook – Connexion', loadComponent: () => import('./pages/connexion.page').then((m) => m.ConnexionPage) },
  { path: 'inscription', title: 'FitBook – Inscription', loadComponent: () => import('./pages/inscription.page').then((m) => m.InscriptionPage) },
  { path: 'mes-reservations', title: 'FitBook – Mes réservations', canActivate: [connecteGuard], loadComponent: () => import('./pages/mes-reservations.page').then((m) => m.MesReservationsPage) },
  { path: 'espace', title: 'FitBook – Mon espace', canActivate: [connecteGuard], loadComponent: () => import('./pages/espace.page').then((m) => m.EspacePage) },
  { path: 'contact', title: 'FitBook – Contact', loadComponent: () => import('./pages/contact.page').then((m) => m.ContactPage) },
  { path: 'sauvegardes', title: 'FitBook – Sauvegardes', loadComponent: () => import('./pages/sauvegardes.page').then((m) => m.SauvegardesPage) },
  { path: '**', redirectTo: 'salles' },
];
