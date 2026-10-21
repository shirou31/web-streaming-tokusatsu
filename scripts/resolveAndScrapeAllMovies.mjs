import fs from 'fs';

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tokusatsuindo.com/'
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

function extractEmbed(html) {
  if (!html) return null;
  const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
  for (const m of embedMatches) {
    try {
      const decoded = Buffer.from(m[1], 'base64').toString('utf8');
      const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let embedUrl = srcMatch[1];
        if (embedUrl.startsWith('//')) embedUrl = 'https:' + embedUrl;
        return embedUrl;
      }
    } catch (_) {}
  }
  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    let src = iframeMatch[1];
    if (src.startsWith('//')) src = 'https:' + src;
    return src;
  }
  return null;
}

function extractGdriveLinks(html) {
  if (!html) return [];
  const gdrive = new Set();
  const re = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (!id.includes('preview') && !id.includes('toku') && id.length > 15) {
      gdrive.add(`https://drive.google.com/file/d/${id}/preview`);
    }
  }
  return Array.from(gdrive);
}

async function searchTokusatsuIndo(query) {
  const q = encodeURIComponent(query.replace(/[^a-zA-Z0-9 ]/g, ' ').trim());
  const html = await fetchPage(`https://www.tokusatsuindo.com/?s=${q}`);
  if (!html) return [];
  const re = /href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["']/g;
  let m;
  const links = new Set();
  while ((m = re.exec(html)) !== null) {
    const u = m[1];
    if (!u.includes('/tag/') && !u.includes('/category/') && !u.includes('/search/') && !u.includes('/page/')) {
      links.add(u);
    }
  }
  return Array.from(links);
}

// Concurrency helper
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const movieTargets = [
  { id: 'scraped_prod_geats-4-aces_movie', title: 'Kamen Rider Geats: 4 Aces and the Black Fox', query: 'geats 4 aces' },
  { id: 'scraped_prod_shin-kamen-rider_movie', title: 'Shin Kamen Rider', query: 'shin kamen rider' },
  { id: 'scraped_prod_reiwa-the-first-generation_movie', title: 'Kamen Rider: Reiwa The First Generation', query: 'reiwa the first generation' },
  { id: 'scraped_prod_zero-one-realtime_movie', title: 'Kamen Rider Zero-One The Movie: REAL×TIME', query: 'zero one real time' },
  { id: 'scraped_prod_vulcan-valkyrie_movie', title: 'Zero-One Others: Kamen Rider Vulcan & Valkyrie', query: 'vulcan valkyrie' },
  { id: 'scraped_prod_saber-phoenix_movie', title: 'Kamen Rider Saber: The Phoenix Swordsman', query: 'saber phoenix swordsman' },
  { id: 'scraped_prod_super-hero-senki_movie', title: 'Saber + Zenkaiger: Super Hero Senki', query: 'super hero senki' },
  { id: 'scraped_prod_saber-trio_movie', title: 'Kamen Rider Saber: Trio of Deep Sin', query: 'trio of deep sin' },
  { id: 'scraped_prod_beyond-generations_movie', title: 'Kamen Rider: Beyond Generations', query: 'beyond generations' },
  { id: 'scraped_prod_revice-battle-familia_movie', title: 'Kamen Rider Revice The Movie: Battle Familia', query: 'battle familia' },
  { id: 'scraped_prod_geats-revice-battle-royale_movie', title: 'Kamen Rider Geats × Revice: Movie Battle Royale', query: 'geats revice battle royale' },
  { id: 'scraped_prod_gotchard-geats-winter_movie', title: 'Kamen Rider The Winter Movie: Gotchard & Geats', query: 'gotchard geats the winter movie' },
  { id: 'scraped_prod_gotchard-future-daybreak_movie', title: 'Kamen Rider Gotchard: The Future Daybreak', query: 'future daybreak' },
  { id: 'scraped_prod_king-ohger-adventure-heaven_movie', title: 'Ohsama Sentai King-Ohger: Adventure Heaven', query: 'adventure heaven' },
  { id: 'scraped_prod_king-ohger-vs-donbrothers_movie', title: 'King-Ohger vs. Donbrothers', query: 'king ohger vs donbrothers' },
  { id: 'scraped_prod_ultraman-trigger-episode-z_movie', title: 'Ultraman Trigger: Episode Z', query: 'trigger episode z' },
  { id: 'scraped_prod_ultraman-blazar-movie_movie', title: 'Ultraman Blazar The Movie: Tokyo Kaiju Showdown', query: 'blazar tokyo kaiju showdown' },
  { id: 'scraped_prod_ultraman-arc-movie_movie', title: 'Ultraman Arc The Movie: The Clash of Light and Evil', query: 'ultraman arc movie' },
  { id: 'scraped_prod_ryuki-episode-final_movie', title: 'Kamen Rider Ryuki: Episode Final', query: 'ryuki episode final' },
  { id: 'scraped_prod_ryuki-13-riders_movie', title: 'Kamen Rider Ryuki Special: 13 Riders', query: 'ryuki 13 riders' },
  { id: 'scraped_prod_den-o-im-born_movie', title: 'Kamen Rider Den-O: I\'m Born!', query: 'den o im born' },
  { id: 'scraped_prod_den-o-kiva-climax-deka_movie', title: 'Kamen Rider Den-O & Kiva: Climax Deka', query: 'climax deka' },
  { id: 'scraped_prod_saraba-den-o_movie', title: 'Saraba Kamen Rider Den-O: Final Countdown', query: 'saraba den o' },
  { id: 'scraped_prod_cho-den-o-onigashima_movie', title: 'Cho Kamen Rider Den-O & Decade Neo Generations', query: 'cho den o onigashima' },
  { id: 'scraped_prod_cho-den-o-red_movie', title: 'Kamen Rider Cho-Den-O Trilogy: Episode Red', query: 'cho den o red' },
  { id: 'scraped_prod_cho-den-o-blue_movie', title: 'Kamen Rider Cho-Den-O Trilogy: Episode Blue', query: 'cho den o blue' },
  { id: 'scraped_prod_cho-den-o-yellow_movie', title: 'Kamen Rider Cho-Den-O Trilogy: Episode Yellow', query: 'cho den o yellow' },
  { id: 'scraped_prod_ooo-movie-war-core_movie', title: 'Kamen Rider × Kamen Rider OOO & W: Movie War Core', query: 'movie war core' },
  { id: 'scraped_prod_ooo-wonderful-shogun_movie', title: 'Kamen Rider OOO Wonderful: The Shogun and the 21 Core Medals', query: 'ooo wonderful 21 core' },
  { id: 'scraped_prod_fourze-ooo-mega-max_movie', title: 'Kamen Rider × Kamen Rider Fourze & OOO: Movie War Mega Max', query: 'movie war mega max' },
  { id: 'scraped_prod_ooo-10th-core-medal_movie', title: 'Kamen Rider OOO 10th: Core Medal of Resurrection', query: 'ooo 10th' },
  { id: 'scraped_prod_gokaiger-goseiger-199_movie', title: 'Gokaiger Goseiger Super Sentai 199 Hero Great Battle', query: 'gokaiger 199 hero' },
  { id: 'scraped_prod_gokaiger-flying-ghost-ship_movie', title: 'Kaizoku Sentai Gokaiger The Movie: The Flying Ghost Ship', query: 'flying ghost ship' },
  { id: 'scraped_prod_gokaiger-vs-gavan_movie', title: 'Kaizoku Sentai Gokaiger vs. Space Sheriff Gavan', query: 'gokaiger vs gavan' },
  { id: 'scraped_prod_super-hero-taisen_movie', title: 'Kamen Rider × Super Sentai: Super Hero Taisen', query: 'super hero taisen' },
  { id: 'scraped_prod_go-busters-vs-gokaiger_movie', title: 'Tokumei Sentai Go-Busters vs. Kaizoku Sentai Gokaiger', query: 'go busters vs gokaiger' }
];

async function main() {
  console.log(`Resolving real URLs and embeds for ${movieTargets.length} movies...`);

  const results = await mapConcurrent(movieTargets, 4, async (target) => {
    // 1. Try search
    const candidates = await searchTokusatsuIndo(target.query);
    console.log(`\n[Search: "${target.query}"] Found ${candidates.length} candidate URLs`);

    let workingUrl = null;
    let embed = null;
    let gdrive = [];

    for (const cand of candidates) {
      // Must look like a post
      if (!cand.endsWith('/')) continue;
      const html = await fetchPage(cand);
      if (!html) continue;

      const em = extractEmbed(html);
      if (em) {
        workingUrl = cand;
        embed = em;
        gdrive = extractGdriveLinks(html);
        console.log(`  ✅ FOUND WORKING EMBED for "${target.title}":`);
        console.log(`     URL: ${workingUrl}`);
        console.log(`     Embed: ${embed.slice(0, 60)}...`);
        break;
      }
    }

    return {
      target,
      workingUrl,
      embed,
      gdrive
    };
  });

  // Now update scrapedTokusatsu.json
  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let updatedCount = 0;
  results.forEach(r => {
    if (!r.embed || !r.workingUrl) {
      console.log(`❌ No embed found for ${r.target.title}`);
      return;
    }

    const item = data.episodes.find(e => e.id === r.target.id);
    if (item) {
      item.sourceUrl = r.workingUrl;
      item.servers = [
        {
          id: `srv_real_${r.target.id}`,
          name: 'Server 1 (Direct Embed HD)',
          embedUrl: r.embed,
          directUrl: null,
          type: 'embed',
          status: 'online'
        }
      ];
      if (r.gdrive.length > 0) {
        item.servers.push({
          id: `srv_real_gdrive_${r.target.id}`,
          name: 'Server 2 (Google Drive Preview)',
          embedUrl: r.gdrive[0],
          directUrl: r.gdrive[0].replace('/preview', '/view?usp=sharing'),
          type: 'gdrive',
          status: 'online'
        });
        item.driveDownloadUrl1 = r.gdrive[0].replace('/preview', '/view?usp=sharing');
      }
      updatedCount++;
    }
  });

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n========================================`);
  console.log(`✅ Successfully updated ${updatedCount} / ${movieTargets.length} movies with REAL embeds!`);
  console.log(`========================================`);
}

main().catch(console.error);
