import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

export const site = 'https://www.uncoupdepousse.fr';
const source = 'https://gestion.uncoupdepousse.fr/newsletter-publique/';
const keyFormat = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const formatted = new Intl.DateTimeFormat('fr-FR',{dateStyle:'long',timeZone:'Europe/Paris'});
const run = promisify(execFile);
const maxPdfBytes = 20 * 1024 * 1024;
const pdfUrl = edition => source + edition.key + '.pdf';

export async function readPublicEditions(send = fetch) {
  const editions = [], keys = new Set();
  let cursor = '';
  do {
    const url = new URL('editions.json',source);
    if(cursor) url.searchParams.set('after',cursor);
    const response = await send(url,{redirect:'error',signal:AbortSignal.timeout(25000)});
    if(!response.ok) throw Error('Flux des éditions indisponible ('+response.status+').');
    const page = await response.json();
    if(page.format!==1 || !Array.isArray(page.editions)) throw Error('Format du flux inconnu.');
    for(const e of page.editions) {
      if(typeof e.key!=='string'||!keyFormat.test(e.key)||keys.has(e.key)||typeof e.title!=='string'||!e.title||typeof e.body!=='string'||
          !Number.isSafeInteger(e.date)||!Number.isFinite(new Date(e.date).getTime())||typeof e.pdf!=='boolean') throw Error('Édition invalide.');
      keys.add(e.key);
      editions.push({key:e.key,date:e.date,title:e.title,body:e.body,pdf:e.pdf});
    }
    if(page.next!==null && (!keyFormat.test(page.next)||page.next<=cursor||page.next!==page.editions.at(-1)?.key)) throw Error('Pagination invalide.');
    cursor=page.next;
  } while(cursor);
  return editions.sort((a,b)=>b.date-a.date || a.key.localeCompare(b.key,'en'));
}

async function readPdf(edition, send) {
  const response = await send(pdfUrl(edition), { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.body || !/^application\/pdf\b/i.test(response.headers.get('content-type') ?? '')) {
    await response.body?.cancel();
    throw Error('PDF indisponible');
  }

  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > maxPdfBytes) throw Error('PDF trop volumineux');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

export async function addPdfCovers(editions, send = fetch) {
  for (const edition of editions) {
    if (!edition.pdf) continue;
    let directory;
    try {
      const pdf = await readPdf(edition, send);
      directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ucdp-newsletter-'));
      const filename = path.join(directory, 'edition.pdf');
      await fs.writeFile(filename, pdf);
      const { stdout } = await run('pdftoppm', [
        '-f', '1', '-l', '1', '-singlefile', '-scale-to', '720',
        '-jpeg', '-jpegopt', 'quality=82', filename
      ], { encoding: 'buffer', timeout: 15000, maxBuffer: 1024 * 1024 });
      if (stdout[0] !== 0xff || stdout[1] !== 0xd8) throw Error('Vignette invalide');
      edition.cover = stdout.toString('base64');
    } catch {
      console.warn('Vignette indisponible pour l’édition ' + edition.key + '.');
    } finally {
      if (directory) await fs.rm(directory, { recursive: true, force: true });
    }
  }
}

const date = e => '<time datetime="'+new Date(e.date).toISOString()+'">'+formatted.format(e.date)+'</time>';
const css = `*{box-sizing:border-box}body{margin:0;color:#20372a;background:#faf9f3;font:1.06rem/1.6 Roboto,"Segoe UI",sans-serif}header,main,footer{max-width:54rem;margin:auto;padding:1.4rem clamp(1.2rem,5vw,3rem)}header{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid #cbd3c6;align-items:center}header a:first-child{font-weight:700}a{color:#245b42;text-underline-offset:.2em}h1,h2,h3{font-family:"PT Serif",Georgia,serif;line-height:1.14;text-wrap:balance}h1{font-size:clamp(2rem,6vw,3.6rem);margin:.6em 0}h2{font-size:1.7rem}section.feature{padding:1.4rem clamp(1rem,4vw,2rem);background:#e9efdf;border-left:.3rem solid #497943}time,footer{color:#526456}.text{white-space:pre-wrap;overflow-wrap:anywhere}ol{list-style:none;padding:0}li{padding:1rem 0;border-bottom:1px solid #cbd3c6}li a{display:block;font-weight:650}footer{margin-top:2rem}`;
const newsletterCss = `
  .newsletter-text { white-space: pre-wrap; overflow-wrap: anywhere; }
  .newsletter-content { display: grid; gap: 1rem; }
  .newsletter-archives ol { list-style: none; padding: 0; }
  .newsletter-archives li { padding: .65rem 0; }
  .newsletter-archives li + li { border-top: 1px solid var(--line); }
  .newsletter-archives time { display: block; }
  .newsletter-feature { display: grid; gap: .85rem; max-width: 52rem; }
  .newsletter-feature h2 { margin: .45rem 0 0; font-size: clamp(1.35rem, 3vw, 1.95rem); }
  .newsletter-feature > .newsletter-text { margin: 0; }
  .newsletter-date { margin: 0; font-size: .95rem; }
  .newsletter-pdf { justify-self: start; }
  .newsletter-preview {
    display: inline-grid; grid-template-columns: 5.5rem minmax(0, 1fr);
    align-items: center; gap: .75rem; font-weight: 650;
  }
  .newsletter-preview img {
    display: block; inline-size: 100%; block-size: auto; aspect-ratio: 3 / 4;
    object-fit: contain; box-shadow: 0 2px 8px rgb(32 55 42 / .12);
    border: 1px solid var(--line, #cbd3c6); border-radius: .35rem; background: #fff;
  }
  @media (max-width: 767px) {
    .newsletter-heading { gap: .65rem; margin-bottom: 1.25rem; }
    .newsletter-heading h1 { max-width: none; font-size: clamp(1.9rem, 8.2vw, 2.45rem); }
  }
  @media (min-width: 42rem) {
    .newsletter-feature-with-cover { grid-template-columns: minmax(0, 1fr) 9rem; }
    .newsletter-feature-with-cover > .newsletter-preview {
      grid-column: 2; grid-row: 1 / 3; grid-template-columns: 1fr;
      inline-size: 100%; justify-items: start; align-self: start;
    }
    .newsletter-feature-with-cover > .newsletter-text { grid-column: 1; grid-row: 2; }
  }
`;

function pdfLink(edition) {
  if (!edition.pdf) return '';
  const cover = edition.cover
    ? '<img src="/newsletter/' + edition.key + '/cover.jpg" width="108" height="144" alt="" loading="lazy" decoding="async">'
    : '';
  return '<a class="' + (cover ? 'newsletter-preview' : 'newsletter-pdf') + '" href="' + pdfUrl(edition) + '">' +
    cover + '<span>Lire le PDF</span></a>';
}

function doc(template, title, description, route, content, indexable = true) {
  const pageTitle = '<title>' + escape(title) + ' · Un Coup de Pousse</title>';
  const pageDescription = '<meta name="description" content="' + escape(description.slice(0, 200)) + '">';
  const canonical = '<link rel="canonical" href="' + site + route + '">';
  const robots = indexable ? '' : '<meta name="robots" content="noindex">';
  const stylesheet = '<link rel="stylesheet" href="/newsletter/style.css">';
  if (template) {
    return template
      .replace(/<title>[^<]*<\/title>/, () => pageTitle)
      .replace(/<meta name="description"[^>]*>/, () => pageDescription)
      .replace(/<meta name="robots" content="noindex">/, robots)
      .replace(/<link rel="canonical"[^>]*>/, canonical + stylesheet)
      .replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/, (_, start, end) => start + content + end);
  }
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    pageTitle + pageDescription + canonical + robots + stylesheet + '</head><body><header><a href="/">Un Coup de Pousse</a><a href="/newsletter/">Newsletter</a></header><main>' +
    content + '</main><footer>Romain · Entretien de jardins autour de Perpignan</footer></body></html>';
}

export async function writePages(dir,editions) {
  // Only a marked newsletter template may already be present in the fresh site output.
  const index = path.join(dir, 'index.html');
  let template;
  try {
    await fs.mkdir(dir);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    if (entries.length !== 1 || entries[0].name !== 'index.html' || !entries[0].isFile()) throw error;
    template = await fs.readFile(index, 'utf8');
    if (!template.includes('<!-- newsletter-pages-template -->')) throw error;
  }

  const [latest, ...archives] = editions;
  const editionLink = e => '/newsletter/' + e.key + '/';
  const featured = latest
    ? '<section class="card feature newsletter-feature' + (latest.cover ? ' newsletter-feature-with-cover' : '') +
      '" aria-label="Dernière édition"><div><p class="newsletter-date">Dernière édition · ' + date(latest) +
      '</p><h2><a href="' + editionLink(latest) + '">' + escape(latest.title) + '</a></h2></div>' +
      pdfLink(latest) + '<p class="newsletter-text">' + escape(latest.body) + '</p></section>'
    : '<section class="card prose"><h2>Dernières éditions</h2><p>Aucune édition publique pour le moment.</p></section>';
  const archive = archives.length
    ? '<section class="card prose newsletter-archives"><h2>Archives</h2><ol>' + archives.map(e => '<li>' + date(e) + ' <a href="' + editionLink(e) + '">' + escape(e.title) + '</a></li>').join('') + '</ol></section>'
    : '';
  const clientLink = template ? '/espace-client.html' : 'https://espace-client.uncoupdepousse.fr/espace-client/';
  const linkToClient = '<p>Vous êtes déjà client ? Retrouvez vos éditions dans votre <a href="' + clientLink + '">espace client</a>.</p>';
  const intro = 'Les conseils de saison de Romain, jardinier à Perpignan et aux alentours.';
  const archiveContent = '<div class="page-heading newsletter-heading"><h1>Newsletter jardinage</h1><p class="lead">' + intro + '</p></div><div class="newsletter-content">' + featured + archive + linkToClient + '</div>';
  await fs.writeFile(index, doc(template, 'Newsletter jardinage', intro, '/newsletter/', archiveContent, Boolean(latest)));
  await fs.writeFile(path.join(dir, 'style.css'), template ? newsletterCss : css + newsletterCss);

  for (const e of editions) {
    const target = path.join(dir, e.key);
    await fs.mkdir(target);
    if (e.cover) await fs.writeFile(path.join(target, 'cover.jpg'), Buffer.from(e.cover, 'base64'));
    const pdf = e.pdf ? '<p>' + pdfLink(e) + '</p>' : '';
    const article = '<article class="prose"><div class="page-heading">' + date(e) + '<h1>' + escape(e.title) + '</h1></div><p class="newsletter-text">' + escape(e.body) + '</p>' + pdf + '</article><p><a href="/newsletter/">Toutes les éditions</a></p>';
    await fs.writeFile(path.join(target, 'index.html'), doc(template, e.title, e.body, editionLink(e), article));
  }

  if (latest) {
    const urls = ['/newsletter/', ...editions.map(editionLink)];
    const sitemap = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(route => '<url><loc>' + site + route + '</loc></url>').join('') + '</urlset>';
    await fs.writeFile(path.join(dir, 'sitemap.xml'), sitemap);
    const robotsFile = path.join(dir, '..', 'robots.txt');
    let robots = '';
    try {
      robots = await fs.readFile(robotsFile, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const directive = 'Sitemap: ' + site + '/newsletter/sitemap.xml';
    if (!robots.split(/\r?\n/).includes(directive)) {
      await fs.writeFile(robotsFile, (robots ? robots.trimEnd() + '\n\n' : '') + directive + '\n');
    }
  }
  await fs.writeFile(path.join(dir, 'revision.txt'), revision(editions) + '\n');
}
const revision=editions=>createHash('sha256').update(JSON.stringify(editions)).digest('hex');

export async function linkMenu(indexFile, required = true) {
  const html=await fs.readFile(indexFile,'utf8');
  const link=/(<a\b[^>]*\bhref=(["']))(?:\/?index(?:-ca|-en)?\.html)?#newsletter(\2[^>]*>\s*Newsletter\s*<\/a>)/gi;
  if(link.test(html)) await fs.writeFile(indexFile,html.replace(link,'$1/newsletter/$3'));
  else if(required && !/href=["']\/?newsletter\/["']/.test(html)) throw Error('Menu Newsletter non reconnu. Relier le menu à /newsletter/ dans index.html.');
}

if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const [mode,out]=process.argv.slice(2);
  if(mode==='collect') {
    const editions=await readPublicEditions();
    await addPdfCovers(editions);
    await fs.writeFile(out,JSON.stringify(editions));
    let published='';
    if(process.env.GITHUB_EVENT_NAME==='schedule'){
      const response=await fetch(site+'/newsletter/revision.txt',{cache:'no-store',signal:AbortSignal.timeout(25000)});
      if(response.ok) published=(await response.text()).trim();
    }
    await fs.appendFile(process.env.GITHUB_OUTPUT,'changed='+(published!==revision(editions))+'\n');
  } else if(mode==='build'){
    const editions=JSON.parse(await fs.readFile(process.argv[4],'utf8'));
    for (const entry of await fs.readdir(out, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.html')) {
        await linkMenu(path.join(out, entry.name), entry.name === 'index.html');
      }
    }
    await writePages(path.join(out,'newsletter'),editions);
  } else throw Error('Commande attendue : collect ou build.');
}
