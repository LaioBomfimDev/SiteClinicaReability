import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));

async function main() {
  const scrapeRoot = args.input
    ? path.resolve(rootDir, args.input)
    : await findLatestScrapeRoot();
  const manifest = JSON.parse(await readFile(path.join(scrapeRoot, 'manifest.json'), 'utf8'));
  const analysisDir = path.join(rootDir, 'research', 'rehab-sites', 'analysis');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(analysisDir, `${timestamp}-analysis.md`);

  await mkdir(analysisDir, { recursive: true });

  const rows = [];

  for (const site of manifest.sites.filter((item) => item.status === 'ok')) {
    const htmlFiles = await findFiles(site.directory, '.html');
    const pages = [];

    for (const file of htmlFiles.slice(0, 80)) {
      const html = await readFile(file, 'utf8');
      pages.push(extractPageSignals(html, file, site.directory));
    }

    const combinedText = pages.map((page) => `${page.title}\n${page.metaDescription}\n${page.headings.join('\n')}\n${page.text}`).join('\n');
    const specialtyScore = scoreTerms(combinedText, specialtyTerms);
    const conditionScore = scoreTerms(combinedText, conditionTerms);
    const patientScore = scoreTerms(combinedText, patientTerms);
    const focus = classifyFocus(specialtyScore, conditionScore);
    const ctas = unique(pages.flatMap((page) => page.ctas)).slice(0, 10);
    const headings = unique(pages.flatMap((page) => page.headings)).slice(0, 14);

    rows.push({
      site,
      htmlCount: htmlFiles.length,
      focus,
      specialtyScore,
      conditionScore,
      patientScore,
      ctas,
      headings,
      titles: unique(pages.map((page) => page.title).filter(Boolean)).slice(0, 6),
    });
  }

  await writeFile(reportPath, renderReport(rows, manifest), 'utf8');
  console.log(`Analise salva em ${reportPath}`);
}

function parseArgs(values) {
  const parsed = {};

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (!value.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = value.slice(2).split('=');
    parsed[rawKey] = inlineValue ?? values[index + 1] ?? true;

    if (inlineValue === undefined && values[index + 1] && !values[index + 1].startsWith('--')) {
      index += 1;
    }
  }

  return parsed;
}

async function findLatestScrapeRoot() {
  const base = path.join(rootDir, 'research', 'rehab-sites', 'scrapes');
  const entries = await readdir(base, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(base, entry.name));

  if (dirs.length === 0) {
    throw new Error('Nenhum scrape encontrado. Rode npm run scrape:rehab primeiro.');
  }

  const withStats = await Promise.all(dirs.map(async (dir) => ({ dir, stats: await stat(dir) })));
  withStats.sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs);
  return withStats[0].dir;
}

async function findFiles(baseDir, extension) {
  const output = [];
  const entries = await readdir(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      output.push(...await findFiles(fullPath, extension));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
      output.push(fullPath);
    }
  }

  return output;
}

function extractPageSignals(html, file, baseDir) {
  const withoutNoise = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');
  const title = decodeEntities(matchFirst(withoutNoise, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const metaDescription = decodeEntities(matchFirst(withoutNoise, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i));
  const headings = matchAll(withoutNoise, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)
    .map((value) => cleanText(value))
    .filter(Boolean);
  const ctas = matchAll(withoutNoise, /<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi)
    .map((value) => cleanText(value))
    .filter((value) => value.length >= 3 && value.length <= 80)
    .filter((value) => ctaTerms.some((term) => value.toLowerCase().includes(term)));
  const text = cleanText(withoutNoise);

  return {
    file: path.relative(baseDir, file),
    title,
    metaDescription,
    headings,
    ctas,
    text,
  };
}

function matchFirst(value, regex) {
  return value.match(regex)?.[1] || '';
}

function matchAll(value, regex) {
  return [...value.matchAll(regex)].map((match) => match[1]);
}

function cleanText(value) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function scoreTerms(text, terms) {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return terms.reduce((score, term) => {
    const normalizedTerm = term
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const matches = normalized.match(new RegExp(`\\b${escapeRegExp(normalizedTerm)}\\b`, 'g'));
    return score + (matches?.length || 0);
  }, 0);
}

function classifyFocus(specialtyScore, conditionScore) {
  if (conditionScore > specialtyScore * 1.15) {
    return 'condicoes tratadas';
  }

  if (specialtyScore > conditionScore * 1.15) {
    return 'especialidades/servicos';
  }

  return 'hibrido';
}

function unique(values) {
  const seen = new Set();

  return values.filter((value) => {
    const normalized = value.toLowerCase();

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function renderReport(rows, manifest) {
  const lines = [
    '# Benchmark de sites de reabilitacao',
    '',
    `Scrape: ${manifest.createdAt}`,
    `Profundidade: ${manifest.depth}`,
    '',
    '## Leitura rapida',
    '',
    '| Site | HTMLs | Foco provavel | Especialidades | Condicoes | Linguagem do paciente |',
    '| --- | ---: | --- | ---: | ---: | ---: |',
  ];

  for (const row of rows) {
    lines.push(`| ${row.site.name} | ${row.htmlCount} | ${row.focus} | ${row.specialtyScore} | ${row.conditionScore} | ${row.patientScore} |`);
  }

  lines.push('', '## Sinais por site', '');

  for (const row of rows) {
    lines.push(`### ${row.site.name}`);
    lines.push('');
    lines.push(`- URL: ${row.site.url}`);
    lines.push(`- Foco provavel: ${row.focus}`);
    lines.push(`- CTAs encontrados: ${row.ctas.length ? row.ctas.join(' | ') : 'nao detectado'}`);
    lines.push(`- Titulos: ${row.titles.length ? row.titles.join(' | ') : 'nao detectado'}`);
    lines.push(`- Primeiros headings: ${row.headings.length ? row.headings.join(' | ') : 'nao detectado'}`);
    lines.push('');
  }

  lines.push(
    '## Como interpretar',
    '',
    '- especialidades/servicos: o site tende a organizar a oferta por areas internas, equipe ou recursos tecnicos.',
    '- condicoes tratadas: o site tende a falar a partir da dor, diagnostico ou situacao que o paciente reconhece.',
    '- hibrido: mistura os dois modelos; vale olhar a primeira dobra e o menu para decidir qual mensagem chega primeiro.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const specialtyTerms = [
  'especialidade',
  'especialidades',
  'servico',
  'servicos',
  'fisioterapia',
  'fisiatra',
  'fisiatria',
  'fonoaudiologia',
  'terapia ocupacional',
  'psicologia',
  'neuropsicologia',
  'ortopedia',
  'neurologia',
  'pediatria',
  'hidroterapia',
  'pilates',
  'occupational therapy',
  'physical therapy',
  'speech therapy',
  'therapy services',
  'specialties',
  'services',
];

const conditionTerms = [
  'tratamos',
  'tratamento',
  'tratamentos',
  'condicao',
  'condicoes',
  'diagnostico',
  'doenca',
  'doencas',
  'avc',
  'derrame',
  'parkinson',
  'alzheimer',
  'lesao medular',
  'traumatismo craniano',
  'paralisia cerebral',
  'dor',
  'amputacao',
  'esclerose multipla',
  'mobilidade',
  'stroke',
  'spinal cord injury',
  'brain injury',
  'cerebral palsy',
  'parkinson',
  'multiple sclerosis',
  'pain',
  'amputation',
  'conditions',
  'diagnosis',
  'injury',
];

const patientTerms = [
  'paciente',
  'pacientes',
  'familia',
  'cuidador',
  'consulta',
  'agendamento',
  'marcar',
  'atendimento',
  'internacao',
  'patient',
  'patients',
  'family',
  'appointment',
  'schedule',
  'referral',
  'care',
];

const ctaTerms = [
  'agend',
  'marcar',
  'consulta',
  'contato',
  'atendimento',
  'solicitar',
  'ligue',
  'whatsapp',
  'patient',
  'appointment',
  'schedule',
  'contact',
  'request',
  'refer',
  'donate',
];

await main();
