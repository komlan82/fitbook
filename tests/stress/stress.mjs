// Test de charge FitBook : mesure la latence et le débit de l'API pour plusieurs niveaux d'utilisateurs simultanés.
// Utilisation : node tests\stress\stress.mjs   (l'API doit tourner sur http://127.0.0.1:8000)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8000';
const NIVEAUX = (process.env.NIVEAUX ?? '1,5,10,20,50').split(',').map(Number); // utilisateurs simultanés
const DUREE_S = Number(process.env.DUREE ?? 8);                                  // secondes par palier
const CIBLES = [
  { nom: 'Liste des salles', chemin: '/api/salles' },
  { nom: 'Fiche d\'une salle', chemin: '/api/salles/1' },
];

const centile = (tri, p) => tri.length ? tri[Math.min(tri.length - 1, Math.ceil((p / 100) * tri.length) - 1)] : 0;

async function palier(url, utilisateurs) {
  const latences = [];
  let erreurs = 0;
  const fin = performance.now() + DUREE_S * 1000;
  const debut = performance.now();

  async function utilisateur() {
    while (performance.now() < fin) {
      const t0 = performance.now();
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
        await r.arrayBuffer();
        if (r.status !== 200) erreurs++;
      } catch {
        erreurs++;
      }
      latences.push(performance.now() - t0);
    }
  }
  await Promise.all(Array.from({ length: utilisateurs }, utilisateur));

  const duree = (performance.now() - debut) / 1000;
  const tri = [...latences].sort((a, b) => a - b);
  const moy = latences.reduce((s, x) => s + x, 0) / (latences.length || 1);
  return {
    utilisateurs, requetes: latences.length, erreurs,
    reqParSeconde: +(latences.length / duree).toFixed(1),
    moyenneMs: +moy.toFixed(1), p50Ms: +centile(tri, 50).toFixed(1), p95Ms: +centile(tri, 95).toFixed(1),
    p99Ms: +centile(tri, 99).toFixed(1), maxMs: +(tri.at(-1) ?? 0).toFixed(1),
  };
}

const resultats = [];
console.log(`Test de charge sur ${BASE} : ${NIVEAUX.join(', ')} utilisateurs simultanés, ${DUREE_S} s par palier\n`);
for (const cible of CIBLES) {
  console.log(`== ${cible.nom} (${cible.chemin})`);
  for (const n of NIVEAUX) {
    const r = await palier(BASE + cible.chemin, n);
    resultats.push({ cible: cible.nom, chemin: cible.chemin, ...r });
    console.log(`  ${String(n).padStart(3)} util. : ${String(r.reqParSeconde).padStart(7)} req/s | moy ${r.moyenneMs} ms | p95 ${r.p95Ms} ms | max ${r.maxMs} ms | erreurs ${r.erreurs}/${r.requetes}`);
  }
}

const dossier = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(dossier, 'resultats.json'), JSON.stringify(resultats, null, 2));
const entetes = Object.keys(resultats[0]);
writeFileSync(join(dossier, 'resultats.csv'), [entetes.join(';'), ...resultats.map((r) => entetes.map((k) => r[k]).join(';'))].join('\n'));
console.log('\nTerminé. Fichiers écrits : tests\\stress\\resultats.json et resultats.csv');
