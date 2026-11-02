import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { SauvegardeJournal } from '../core/models';

@Component({
  selector: 'app-sauvegardes',
  imports: [DatePipe],
  template: `
    <h1>Sauvegardes de la base de données</h1>
    @if (journal(); as j) {
      <p class="succes" role="status">💾 {{ j.message }}</p>
      <table class="tableau">
        <thead><tr><th>N°</th><th>Fichier</th><th>Date</th><th>État</th></tr></thead>
        <tbody>
          @for (s of j.sauvegardes; track s.numero) {
            <tr>
              <td>{{ s.numero }}</td>
              <td><code>database/backups/{{ s.fichier }}</code></td>
              <td>{{ s.date | date: 'd MMMM y, HH:mm' }}</td>
              <td>{{ s.statut }}</td>
            </tr>
          } @empty {
            <tr><td colspan="4">Aucune sauvegarde.</td></tr>
          }
        </tbody>
      </table>
    } @else {
      <p role="status">Chargement…</p>
    }
  `,
})
export class SauvegardesPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly journal = signal<SauvegardeJournal | null>(null);
  ngOnInit(): void { this.api.sauvegardes().subscribe((j) => this.journal.set(j)); }
}
