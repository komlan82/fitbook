import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, messageErreur } from '../core/api.service';
import { CoachResume, SalleResume, SeanceCalendrier } from '../core/models';

type Onglet = 'salles' | 'coachs' | 'seances';
type Dispo = '' | 'semaine' | 'weekend';

const TAILLE_PAGE = 4;
const pad = (n: number): string => String(n).padStart(2, '0');
const jourLocal = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

@Component({
  selector: 'app-recherche',
  imports: [DatePipe, RouterLink],
  styles: `
    .barre { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: .8rem; padding: 1rem; align-items: end; }
    .barre label { font-weight: 700; display: grid; gap: .3rem; }
    .barre select, .barre input { font: inherit; padding: .75rem 1rem; border: 1px solid var(--bor); border-radius: 14px; background: #fff; box-sizing: border-box; width: 100%; }
    .barre .btn { padding: .85rem 1.6rem; }
    .onglets-rech { display: flex; gap: .6rem; margin: 1.1rem 0; }
    .onglets-rech button { font: inherit; font-weight: 700; padding: .7rem 1.4rem; border-radius: 14px; border: 1px solid var(--bor); background: #fff; color: var(--ink); cursor: pointer; }
    .onglets-rech button.actif { background: var(--ink); color: #fff; border-color: var(--ink); }
    .corps { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 1.5rem; align-items: start; }
    .filtres { padding: 1.1rem 1.2rem; }
    .filtres h2 { margin: 0 0 .8rem; font-size: 1.15rem; }
    .filtres h3 { margin: 1rem 0 .4rem; font-size: .92rem; }
    .filtres input[type=range] { width: 100%; accent-color: var(--grn); }
    .puces { display: flex; flex-wrap: wrap; gap: .4rem; }
    .puces button { font: inherit; font-weight: 600; font-size: .9rem; padding: .35rem .8rem; border-radius: 999px; border: 1px solid var(--bor); background: var(--grey); color: var(--ink); cursor: pointer; }
    .puces button.actif { background: var(--chip); color: var(--dgr); border-color: var(--dgr); }
    .cartes { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .fiche { display: block; overflow: hidden; color: inherit; text-decoration: none; }
    .fiche .photo { height: 104px; display: grid; place-items: center; background: #cfe8df; color: var(--mut); font-weight: 600; }
    .fiche:nth-child(even) .photo { background: #f5dbcf; }
    .fiche .texte { padding: .9rem 1.1rem 1rem; }
    .fiche h2 { margin: 0 0 .2rem; font-size: 1.2rem; }
    .fiche .ligne { display: flex; justify-content: space-between; margin: .5rem 0 0; }
    .note-moy { color: #c2410c; font-weight: 800; }
    .pagination { display: flex; justify-content: center; gap: .5rem; margin-top: 1.4rem; }
    .pagination button { font: inherit; font-weight: 700; min-width: 2.6rem; height: 2.6rem; border-radius: 12px; border: 1px solid var(--bor); background: #fff; color: var(--ink); cursor: pointer; }
    .pagination button.actif { background: var(--grn); color: #fff; border-color: var(--grn); }
    .pagination button:disabled { opacity: .45; cursor: default; }
    @media (max-width: 900px) { .corps { grid-template-columns: 1fr; } .barre { grid-template-columns: 1fr; } }
    @media (max-width: 600px) { .cartes { grid-template-columns: 1fr; } }
  `,
  template: `
    <form class="carte barre" (submit)="$event.preventDefault(); rafraichir()">
      <label>Discipline
        <select [value]="discipline()" (change)="changer(() => discipline.set($any($event.target).value))">
          <option value="">Toutes</option>
          @for (d of disciplines; track d) { <option [value]="d">{{ d }}</option> }
        </select>
      </label>
      <label>Ville
        <select [value]="ville()" (change)="changer(() => ville.set($any($event.target).value))">
          <option value="">Toutes</option>
          @for (v of villes(); track v) { <option [value]="v">{{ v }}</option> }
        </select>
      </label>
      <label>Date
        <input type="date" [value]="date()" (change)="changer(() => date.set($any($event.target).value))" />
      </label>
      <button class="btn" type="submit">Rechercher</button>
    </form>

    <div class="onglets-rech" role="tablist">
      @for (o of onglets; track o.cle) {
        <button type="button" role="tab" [class.actif]="onglet() === o.cle" (click)="choisirOnglet(o.cle)">{{ o.libelle }}</button>
      }
    </div>

    @if (erreur()) {
      <p class="erreur" role="alert">{{ erreur() }}</p>
    } @else {
      <div class="corps">
        <aside class="carte filtres" aria-label="Filtres">
          <h2>Filtres</h2>
          @if (onglet() !== 'coachs') {
            <h3>Prix par séance</h3>
            <input type="range" [min]="bornes()[0]" [max]="bornes()[1]" [value]="prixEff()" (input)="changer(() => prixMax.set(+$any($event.target).value))" aria-label="Prix maximum" />
            <span class="aide">{{ bornes()[0] }} € – {{ prixEff() }} €</span>
          }
          @if (onglet() !== 'seances') {
            <h3>Note minimale</h3>
            <div class="puces">
              @for (n of [4, 3]; track n) {
                <button type="button" [class.actif]="noteMin() === n" (click)="changer(() => noteMin.set(noteMin() === n ? 0 : n))">★ {{ n }}+</button>
              }
            </div>
          }
          @if (onglet() !== 'coachs') {
            <h3>Disponibilité</h3>
            <div class="puces">
              <button type="button" [class.actif]="dispo() === 'semaine'" (click)="changer(() => dispo.set(dispo() === 'semaine' ? '' : 'semaine'))">Cette semaine</button>
              <button type="button" [class.actif]="dispo() === 'weekend'" (click)="changer(() => dispo.set(dispo() === 'weekend' ? '' : 'weekend'))">Ce week-end</button>
            </div>
          }
          <h3>Discipline</h3>
          <div class="puces">
            @for (d of disciplines; track d) {
              <button type="button" [class.actif]="discipline() === d" (click)="changer(() => discipline.set(discipline() === d ? '' : d))">{{ d }}</button>
            }
          </div>
        </aside>

        <section>
          @if (chargement()) {
            <p role="status">Chargement…</p>
          } @else {
            <p class="aide">{{ total() }} résultat(s)</p>
            <div class="cartes">
              @switch (onglet()) {
                @case ('salles') {
                  @for (s of pageSalles(); track s.id) {
                    <a class="carte fiche" [routerLink]="['/salles', s.id]">
                      <div class="photo" aria-hidden="true">photo</div>
                      <div class="texte">
                        <h2>{{ s.nom }}</h2>
                        <p class="meta">{{ s.ville }} · {{ s.disciplines ?? 'Aucune séance à venir' }}</p>
                        <p class="ligne">
                          @if (s.noteMoyenne) { <span class="note-moy">★ {{ s.noteMoyenne }}</span> } @else { <span class="aide">Pas encore d'avis</span> }
                          @if (s.prixMin) { <span>dès <strong>{{ s.prixMin }} €</strong></span> }
                        </p>
                      </div>
                    </a>
                  }
                }
                @case ('coachs') {
                  @for (c of pageCoachs(); track c.id) {
                    <div class="carte fiche">
                      <div class="photo" aria-hidden="true">photo</div>
                      <div class="texte">
                        <h2>{{ c.nom }}</h2>
                        <p class="meta">{{ c.disciplines ?? 'Disciplines non renseignées' }}</p>
                        <p class="ligne">
                          @if (c.noteMoyenne) { <span class="note-moy">★ {{ c.noteMoyenne }}</span> } @else { <span class="aide">Pas encore d'avis</span> }
                          <span><strong>{{ c.tarif }} €</strong> / h</span>
                        </p>
                      </div>
                    </div>
                  }
                }
                @case ('seances') {
                  @for (se of pageSeances(); track se.id) {
                    <a class="carte fiche" [routerLink]="['/salles', se.idSalle]">
                      <div class="photo" aria-hidden="true">{{ se.discipline }}</div>
                      <div class="texte">
                        <h2>{{ se.titre }}</h2>
                        <p class="meta">{{ se.dateDebut | date: 'EEE d MMM · HH:mm' }}<br />{{ se.salle }} · {{ se.ville }} · avec {{ prenom(se.coach) }}</p>
                        <p class="ligne">
                          @if (se.placesRestantes > 0) { <span class="badge ok">{{ se.placesRestantes }} places</span> } @else { <span class="badge complet">Complet</span> }
                          <strong>{{ se.prix }} €</strong>
                        </p>
                      </div>
                    </a>
                  }
                }
              }
            </div>
            @if (total() === 0) { <p>Aucun résultat ne correspond à votre recherche.</p> }
            @if (nbPages() > 1) {
              <nav class="pagination" aria-label="Pagination">
                <button type="button" [disabled]="page() === 1" (click)="page.set(page() - 1)" aria-label="Page précédente">‹</button>
                @for (n of numeros(); track n) {
                  <button type="button" [class.actif]="n === page()" (click)="page.set(n)">{{ n }}</button>
                }
                <button type="button" [disabled]="page() === nbPages()" (click)="page.set(page() + 1)" aria-label="Page suivante">›</button>
              </nav>
            }
          }
        </section>
      </div>
    }
  `,
})
export class RecherchePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly disciplines = ['Yoga', 'Pilates', 'Boxe', 'Musculation', 'Cardio'];
  protected readonly onglets: { cle: Onglet; libelle: string }[] = [
    { cle: 'salles', libelle: 'Salles' }, { cle: 'coachs', libelle: 'Coachs' }, { cle: 'seances', libelle: 'Séances' },
  ];

  protected readonly salles = signal<SalleResume[]>([]);
  protected readonly coachs = signal<CoachResume[]>([]);
  protected readonly seances = signal<SeanceCalendrier[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal('');

  protected readonly onglet = signal<Onglet>('salles');
  protected readonly discipline = signal('');
  protected readonly ville = signal('');
  protected readonly date = signal('');
  protected readonly prixMax = signal<number | null>(null);
  protected readonly noteMin = signal(0);
  protected readonly dispo = signal<Dispo>('');
  protected readonly page = signal(1);

  protected readonly villes = computed(() => [...new Set(this.salles().map((s) => s.ville))].sort());
  protected readonly bornes = computed<[number, number]>(() => {
    const prix = [...this.salles().map((s) => Number(s.prixMin)), ...this.seances().map((s) => Number(s.prix))].filter((n) => n > 0);
    return prix.length ? [Math.floor(Math.min(...prix)), Math.ceil(Math.max(...prix))] : [0, 50];
  });
  protected readonly prixEff = computed(() => this.prixMax() ?? this.bornes()[1]);

  /** Séances de la période qui respectent la date choisie et la disponibilité (cette semaine / ce week-end). */
  private readonly seancesDansPeriode = computed(() => {
    const d = this.date();
    const [debut, fin] = this.fenetre(this.dispo());
    return this.seances().filter((s) => {
      const t = new Date(s.dateDebut).getTime();
      return (!d || s.dateDebut.slice(0, 10) === d) && (!debut || (t >= debut && t < fin));
    });
  });

  private readonly sallesFiltrees = computed(() => {
    const ids = new Set(this.seancesDansPeriode().map((s) => s.idSalle));
    const filtreDate = !!this.date() || !!this.dispo();
    return this.salles().filter((s) =>
      (!this.ville() || s.ville === this.ville())
      && (!this.discipline() || (s.disciplines ?? '').includes(this.discipline()))
      && (!this.noteMin() || Number(s.noteMoyenne ?? 0) >= this.noteMin())
      && (s.prixMin === null || Number(s.prixMin) <= this.prixEff())
      && (!filtreDate || ids.has(s.id)));
  });
  private readonly coachsFiltres = computed(() =>
    this.coachs().filter((c) =>
      (!this.discipline() || (c.disciplines ?? '').includes(this.discipline()))
      && (!this.noteMin() || Number(c.noteMoyenne ?? 0) >= this.noteMin())));
  private readonly seancesFiltrees = computed(() =>
    this.seancesDansPeriode().filter((s) =>
      (!this.ville() || s.ville === this.ville())
      && (!this.discipline() || s.discipline === this.discipline())
      && Number(s.prix) <= this.prixEff()));

  protected readonly total = computed(() =>
    this.onglet() === 'salles' ? this.sallesFiltrees().length
      : this.onglet() === 'coachs' ? this.coachsFiltres().length : this.seancesFiltrees().length);
  protected readonly nbPages = computed(() => Math.max(1, Math.ceil(this.total() / TAILLE_PAGE)));
  protected readonly numeros = computed(() => Array.from({ length: this.nbPages() }, (_, i) => i + 1));
  private tranche<T>(l: T[]): T[] { const d = (this.page() - 1) * TAILLE_PAGE; return l.slice(d, d + TAILLE_PAGE); }
  protected readonly pageSalles = computed(() => this.tranche(this.sallesFiltrees()));
  protected readonly pageCoachs = computed(() => this.tranche(this.coachsFiltres()));
  protected readonly pageSeances = computed(() => this.tranche(this.seancesFiltrees()));

  ngOnInit(): void {
    // L'onglet vit dans l'adresse (?onglet=coachs) : l'en-tête et la page restent synchronisés.
    this.route.queryParamMap.subscribe((q) => {
      const o = q.get('onglet');
      this.onglet.set(o === 'coachs' || o === 'seances' ? o : 'salles');
      this.page.set(1);
    });
    this.rafraichir();
  }

  protected prenom(nomComplet: string): string { return nomComplet.split(' ')[0]; }
  protected changer(action: () => void): void { action(); this.page.set(1); }
  protected choisirOnglet(o: Onglet): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { onglet: o === 'salles' ? null : o }, queryParamsHandling: 'merge' });
  }

  /** Début et fin (en ms) de « cette semaine » ou « ce week-end » ; [0, 0] si aucun filtre. */
  private fenetre(d: Dispo): [number, number] {
    if (!d) return [0, 0];
    const maintenant = new Date();
    const jour = maintenant.getDay(); // 0 = dimanche
    const finSemaine = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + ((7 - jour) % 7) + 1);
    if (d === 'semaine') return [maintenant.getTime(), finSemaine.getTime()];
    const samedi = new Date(finSemaine.getFullYear(), finSemaine.getMonth(), finSemaine.getDate() - 2);
    return [Math.max(samedi.getTime(), maintenant.getTime()), finSemaine.getTime()];
  }

  protected rafraichir(): void {
    this.chargement.set(true);
    this.erreur.set('');
    const aujourdhui = new Date();
    const fin = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() + 60);
    let attendus = 3;
    const fini = () => { if (--attendus === 0) this.chargement.set(false); };
    const echec = (e: unknown) => { this.erreur.set(messageErreur(e)); this.chargement.set(false); };
    this.api.salles('', '').subscribe({ next: (l) => { this.salles.set(l); fini(); }, error: echec });
    this.api.coachsPublics().subscribe({ next: (l) => { this.coachs.set(l); fini(); }, error: echec });
    this.api.calendrier(jourLocal(aujourdhui), jourLocal(fin)).subscribe({ next: (l) => { this.seances.set(l); fini(); }, error: echec });
  }
}
