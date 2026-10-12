// Gera data/imdb-movies.json a partir dos conjuntos de dados oficiais do IMDb
// (https://developer.imdb.com/non-commercial-datasets/ — uso pessoal e não comercial).
// Uso: node scripts/build-imdb.mjs [saida.json]
// Variáveis: MIN_VOTES (padrão 5000); MAX_LINES (só para teste: lê o começo de cada arquivo).
import { createGunzip } from 'node:zlib';
import { Readable } from 'node:stream';
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://datasets.imdbws.com/';
const MIN_VOTES = Number(process.env.MIN_VOTES || 5000);
const MAX_LINES = Number(process.env.MAX_LINES || 0);
const OUT = process.argv[2] || 'data/imdb-movies.json';
const NONE = '\\N';
// Gêneros que não interessam para uma sessão de cinema com os amigos.
const SKIP_GENRES = new Set(['Adult', 'News', 'Talk-Show', 'Game-Show', 'Reality-TV']);

async function* rows(file) {
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(file + ': HTTP ' + res.status);
  const stream = Readable.fromWeb(res.body).pipe(createGunzip());
  stream.on('error', () => { /* interrompido de propósito com MAX_LINES */ });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let n = 0;
  try {
    for await (const line of rl) {
      if (n++ === 0) continue; // cabeçalho
      yield line.split('\t');
      if (MAX_LINES && n > MAX_LINES) break;
    }
  } finally {
    rl.close();
    stream.destroy();
  }
}

const t0 = Date.now();
const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);

// 1. Notas: só títulos com votos suficientes.
const ratings = new Map();
for await (const [id, avg, votes] of rows('title.ratings.tsv.gz')) {
  const v = Number(votes);
  if (v >= MIN_VOTES) ratings.set(id, [Math.round(Number(avg) * 10), v]);
}
log('notas com', MIN_VOTES, '+ votos:', ratings.size);

// 2. Filmes (não adultos) entre esses títulos.
const genreIndex = new Map();
const genres = [];
const movies = new Map();
for await (const [id, type, primary, original, isAdult, year, , runtime, gen] of rows('title.basics.tsv.gz')) {
  if (type !== 'movie' || isAdult === '1' || !ratings.has(id)) continue;
  const g = [];
  for (const name of gen === NONE ? [] : gen.split(',')) {
    if (SKIP_GENRES.has(name)) continue;
    if (!genreIndex.has(name)) { genreIndex.set(name, genres.length); genres.push(name); }
    g.push(genreIndex.get(name));
  }
  const [r, v] = ratings.get(id);
  movies.set(id, {
    id, primary, orig: original !== primary ? original : '',
    year: year === NONE ? 0 : Number(year), min: runtime === NONE ? 0 : Number(runtime),
    g, r, v, br: '', brScore: -1, brOrder: 1e9,
  });
}
log('filmes:', movies.size);

// 3. Título no Brasil. Preferência: o de exibição do IMDb, depois o sem tipo; nunca o "de trabalho".
const SCORE = (types) => (types === NONE ? 2 : types.includes('imdbDisplay') ? 3 : types.includes('working') ? -1 : 1);
for await (const [id, ordering, title, region, , types] of rows('title.akas.tsv.gz')) {
  if (region !== 'BR') continue;
  const m = movies.get(id);
  if (!m) continue;
  const s = SCORE(types);
  const o = Number(ordering);
  if (s > m.brScore || (s === m.brScore && o < m.brOrder)) { m.br = title; m.brScore = s; m.brOrder = o; }
}
log('com título no Brasil:', [...movies.values()].filter((m) => m.br && m.brScore >= 0).length);

// 4. Saída compacta: uma linha por filme (diff menor no git), ordenada por votos.
const list = [...movies.values()].sort((a, b) => b.v - a.v);
const lines = list.map((m) => JSON.stringify([
  Number(m.id.slice(2)),
  m.br && m.brScore >= 0 && m.br !== m.primary ? m.br : '',
  m.primary,
  m.orig,
  m.year,
  m.min,
  m.g,
  m.r,
  m.v,
]));
const head = {
  v: 1,
  source: 'IMDb Non-Commercial Datasets',
  updated: new Date().toISOString().slice(0, 10),
  minVotes: MIN_VOTES,
  genres,
  cols: ['id', 'br', 'title', 'orig', 'year', 'min', 'g', 'r10', 'votes'],
};
const json = JSON.stringify(head).slice(0, -1) + ',"rows":[\n' + lines.join(',\n') + '\n]}\n';
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, json);
log('gravado', OUT, (json.length / 1e6).toFixed(2) + ' MB,', list.length, 'filmes');
