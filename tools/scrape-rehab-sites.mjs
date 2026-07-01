import scrape from 'website-scraper';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultConfigPath = path.join(rootDir, 'research', 'rehab-sites.json');

const args = parseArgs(process.argv.slice(2));
const configPath = path.resolve(rootDir, args.config || defaultConfigPath);
const depth = Number.parseInt(args.depth || '1', 10);
const downloadAssets = Boolean(args.assets);
const maxSeedUrls = Number.parseInt(args.pages || '25', 10);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputRoot = path.resolve(
  rootDir,
  args.output || path.join('research', 'rehab-sites', 'scrapes', timestamp),
);

if (!Number.isInteger(depth) || depth < 0 || depth > 3) {
  throw new Error('Use --depth com valor entre 0 e 3. Para benchmark, 1 costuma ser suficiente.');
}

const blockedExtensions = [
  '.7z',
  '.avi',
  '.css',
  '.csv',
  '.doc',
  '.docx',
  '.eot',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.mov',
  '.mp3',
  '.mp4',
  '.ogg',
  '.pdf',
  '.png',
  '.ppt',
  '.pptx',
  '.rar',
  '.svg',
  '.ttf',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.xls',
  '.xlsx',
  '.zip',
];

const positiveSeedTerms = [
  'agendamento',
  'appointment',
  'atendimento',
  'avc',
  'brain',
  'care',
  'conditions',
  'condicoes',
  'consulta',
  'especialidade',
  'fisioterapia',
  'inpatient',
  'injury',
  'lesao',
  'medular',
  'neurolog',
  'ortopedia',
  'outpatient',
  'paciente',
  'parkinson',
  'patient',
  'program',
  'programa',
  'reabilitacao',
  'rehabilitation',
  'servico',
  'spinal',
  'stroke',
  'terapia',
  'therapy',
  'tratamento',
  'unidade',
];

const negativeSeedTerms = [
  'blog',
  'carreira',
  'career',
  'codigo',
  'curso',
  'donate',
  'doacao',
  'edital',
  'evento',
  'fellowship',
  'imprensa',
  'news',
  'noticia',
  'politica',
  'privacy',
  'publicacao',
  'termos',
  'trabalhe',
  'transparencia',
];

await mkdir(outputRoot, { recursive: true });

const sites = JSON.parse(await readFile(configPath, 'utf8'))
  .filter((site) => site.enabled !== false)
  .slice(0, args.limit ? Number.parseInt(args.limit, 10) : undefined);

const manifest = {
  createdAt: new Date().toISOString(),
  configPath,
  outputRoot,
  depth,
  maxSeedUrls,
  downloadAssets,
  sites: [],
};

for (const site of sites) {
  const slug = slugify(site.name || site.url);
  const siteDir = path.join(outputRoot, slug);
  const allowedHosts = normalizeHosts(site);
  const seedUrls = await collectSeedUrls(site.url, allowedHosts, maxSeedUrls);

  console.log(`\n[${site.name}] baixando ${seedUrls.length} paginas a partir de ${site.url}`);

  try {
    const resources = await scrape({
      urls: seedUrls,
      directory: siteDir,
      recursive: depth > 0 && Boolean(args.recursive),
      maxRecursiveDepth: depth,
      requestConcurrency: 2,
      ignoreErrors: true,
      filenameGenerator: 'bySiteStructure',
      sources: downloadAssets ? [
        { selector: 'link[rel="stylesheet"]', attr: 'href' },
        { selector: 'script', attr: 'src' },
      ] : [],
      request: {
        timeout: { request: 20000 },
        headers: {
          'User-Agent': 'Mozilla/5.0 ReabilityDados360Benchmark/1.0',
        },
      },
      urlFilter: (resourceUrl) => shouldKeepUrl(resourceUrl, allowedHosts),
    });

    const resourceCount = countResources(resources);
    const savedFileCount = await countFiles(siteDir);
    manifest.sites.push({
      name: site.name,
      url: site.url,
      slug,
      directory: siteDir,
      status: 'ok',
      resourceCount,
      savedFileCount,
      seedCount: seedUrls.length,
      allowedHosts: Array.from(allowedHosts),
    });

    console.log(`[${site.name}] ok: ${savedFileCount} arquivos salvos em ${siteDir}`);
  } catch (error) {
    manifest.sites.push({
      name: site.name,
      url: site.url,
      slug,
      directory: siteDir,
      status: 'error',
      error: error.message,
      seedCount: seedUrls.length,
      allowedHosts: Array.from(allowedHosts),
    });

    console.error(`[${site.name}] erro: ${error.message}`);
  }
}

const manifestPath = path.join(outputRoot, 'manifest.json');
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`\nManifest salvo em ${manifestPath}`);

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

function normalizeHosts(site) {
  const hosts = site.allowedHosts?.length ? site.allowedHosts : [new URL(site.url).hostname];
  return new Set(hosts.flatMap((host) => {
    const clean = host.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const withoutWww = clean.replace(/^www\./, '');
    return [clean, withoutWww, `www.${withoutWww}`];
  }));
}

function shouldKeepUrl(resourceUrl, allowedHosts) {
  try {
    const parsed = new URL(resourceUrl);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    if (!allowedHosts.has(parsed.hostname.toLowerCase())) {
      return false;
    }

    return !blockedExtensions.some((extension) => parsed.pathname.toLowerCase().endsWith(extension));
  } catch {
    return false;
  }
}

async function collectSeedUrls(startUrl, allowedHosts, maxUrls) {
  const homeUrl = normalizeForSeed(startUrl);
  const candidates = new Map();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(startUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 ReabilityDados360Benchmark/1.0',
      },
    });
    const html = await response.text();

    for (const [order, link] of extractLinks(html).entries()) {
      const normalized = normalizeForSeed(link.href, startUrl);

      if (normalized && shouldKeepUrl(normalized, allowedHosts)) {
        const current = candidates.get(normalized);
        const candidate = {
          url: normalized,
          order,
          score: scoreSeedLink(normalized, link.text),
        };

        if (!current || candidate.score > current.score) {
          candidates.set(normalized, candidate);
        }
      }
    }
  } catch (error) {
    console.warn(`Nao consegui descobrir links internos de ${startUrl}: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const ranked = Array.from(candidates.values())
    .filter((candidate) => candidate.url !== homeUrl)
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .map((candidate) => candidate.url);

  return [homeUrl, ...ranked].slice(0, maxUrls);
}

function extractLinks(html) {
  return [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)]
    .map((match) => {
      const anchor = match[0];
      const href = anchor.match(/\bhref=(["'])(.*?)\1/i)?.[2];

      return {
        href,
        text: cleanLinkText(anchor),
      };
    })
    .filter((link) => link.href);
}

function scoreSeedLink(urlValue, text) {
  const haystack = normalizeSearchText(`${urlValue} ${text}`);
  const positiveScore = positiveSeedTerms.reduce((score, term) => (
    haystack.includes(normalizeSearchText(term)) ? score + 5 : score
  ), 0);
  const negativeScore = negativeSeedTerms.reduce((score, term) => (
    haystack.includes(normalizeSearchText(term)) ? score + 4 : score
  ), 0);

  return positiveScore - negativeScore;
}

function cleanLinkText(value) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeForSeed(value, baseUrl) {
  try {
    const parsed = baseUrl ? new URL(value, baseUrl) : new URL(value);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

async function countFiles(directory) {
  let count = 0;
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      count += await countFiles(fullPath);
    } else if (entry.isFile()) {
      count += 1;
    }
  }

  return count;
}

function countResources(resources) {
  let count = 0;
  const stack = [...resources];

  while (stack.length > 0) {
    const resource = stack.pop();
    count += 1;

    if (Array.isArray(resource.children)) {
      stack.push(...resource.children);
    }
  }

  return count;
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
