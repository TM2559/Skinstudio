/**
 * Po buildu vytvoří pro každou veřejnou stránku vlastní HTML (dist/kosmetika.html, …)
 * se správným <title>, description, canonical a OG tagy a se statickým obsahem
 * (nadpis, služby s cenami, kontakt) uvnitř #root.
 *
 * Proč: SPA vracela pro všechny adresy stejné index.html s canonical na homepage,
 * takže vyhledávače bez spuštění JS (Seznam) i Google v prvním průchodu viděly
 * podstránky jako duplikát úvodní stránky bez obsahu. React obsah #root po načtení
 * nahradí (createRoot), uživatel ho tak běžně nevidí.
 *
 * Firebase Hosting s "cleanUrls": true servíruje /kosmetika z kosmetika.html.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { SEO } from '../src/constants/seo.js'

const BASE = 'https://www.skinstudio.cz'

const PAGES = [
  { path: '/', file: 'index.html', seo: SEO.home, h1: 'Skin Studio – kosmetika a permanentní make-up v Uherském Brodě', categories: ['STANDARD', 'PMU'] },
  { path: '/kosmetika', file: 'kosmetika.html', seo: SEO.kosmetika, h1: 'Kosmetika Uherský Brod – ošetření pleti, laminace obočí, lashlifting', categories: ['STANDARD'] },
  { path: '/pmu', file: 'pmu.html', seo: SEO.pmu, h1: 'Permanentní make-up Uherský Brod – obočí, rty, meziřasová linka', categories: ['PMU'] },
  { path: '/rezervace', file: 'rezervace.html', seo: SEO.rezervace, h1: 'Online rezervace – Skin Studio Uherský Brod', categories: ['STANDARD', 'PMU'] },
]

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim()

/** Veřejně čitelná kolekce services přes Firestore REST; při chybě build pokračuje bez ceníku. */
async function fetchServices(env) {
  const project = env.VITE_FIREBASE_PROJECT_ID
  const key = env.VITE_FIREBASE_API_KEY
  if (!project || !key) return []
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/services?pageSize=200&key=${key}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { documents = [] } = await res.json()
    const val = (f) => (f ? Object.values(f)[0] : undefined)
    return documents
      .map(({ fields: f = {} }) => ({
        name: clean(val(f.name)),
        category: val(f.category) || 'STANDARD',
        price: Number(val(f.price)) || 0,
        isStartingPrice: val(f.isStartingPrice) === true,
        order: Number(val(f.order)) || 0,
      }))
      .filter((s) => s.name)
      .sort((a, b) => a.order - b.order)
  } catch (err) {
    console.warn(`[seo-pages] Ceník se nepodařilo načíst (${err.message}), stránky budou bez něj.`)
    return []
  }
}

function setMeta(html, attr, name, value) {
  const re = new RegExp(`(<meta ${attr}="${name}" content=")[^"]*(")`)
  return html.replace(re, `$1${esc(value)}$2`)
}

function renderHead(html, page) {
  const { seo } = page
  const url = `${BASE}${page.path}`
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(seo.title)}</title>`)
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  out = setMeta(out, 'name', 'description', seo.description)
  out = setMeta(out, 'property', 'og:title', seo.ogTitle || seo.title)
  out = setMeta(out, 'property', 'og:description', seo.ogDescription || seo.description)
  out = setMeta(out, 'property', 'og:url', url)
  out = setMeta(out, 'name', 'twitter:title', seo.ogTitle || seo.title)
  out = setMeta(out, 'name', 'twitter:description', seo.ogDescription || seo.description)
  return out
}

function renderBody(page, services) {
  const list = services.filter((s) => page.categories.includes(s.category))
  const price = (s) => (s.price ? ` – ${s.isStartingPrice ? 'od ' : ''}${s.price.toLocaleString('cs-CZ')} Kč` : '')
  const servicesHtml = list.length
    ? `<h2>Služby a ceny</h2><ul>${list.map((s) => `<li>${esc(s.name)}${price(s)}</li>`).join('')}</ul>`
    : ''
  // Zobrazí se jen tehdy, když se aplikace nenačte do 2 s (jinak ji React nahradí dřív).
  return `<main data-prerender style="max-width:40rem;margin:0 auto;padding:4rem 1.5rem;font-family:Georgia,serif;color:#44403c;line-height:1.6;opacity:0;animation:ss-show .3s 2s forwards">
<style>@keyframes ss-show{to{opacity:1}}</style>
<h1>${esc(page.h1)}</h1>
<p>${esc(page.seo.description)}</p>
${servicesHtml}
<p><a href="/rezervace">Rezervovat termín online</a> · <a href="/kosmetika">Kosmetika</a> · <a href="/pmu">Permanentní make-up</a> · <a href="/">Úvod</a></p>
<p>Skin Studio – Lucie Metelková, Masarykovo nám. 72, 688 01 Uherský Brod · <a href="tel:+420724875558">+420 724 875 558</a> · <a href="mailto:lucie@skinstudio.cz">lucie@skinstudio.cz</a></p>
</main>`
}

export function seoPagesPlugin() {
  let env = {}
  let outDir = 'dist'
  return {
    name: 'seo-pages',
    apply: 'build',
    configResolved(config) {
      env = config.env
      outDir = config.build.outDir
    },
    async closeBundle() {
      const dir = join(process.cwd(), outDir)
      const template = readFileSync(join(dir, 'index.html'), 'utf8')
      const services = await fetchServices(env)
      for (const page of PAGES) {
        const html = renderHead(template, page).replace(
          '<div id="root"></div>',
          `<div id="root">${renderBody(page, services)}</div>`
        )
        writeFileSync(join(dir, page.file), html, 'utf8')
      }
      console.log(`[seo-pages] ${PAGES.length} stránek, ${services.length} služeb v ceníku`)
    },
  }
}
