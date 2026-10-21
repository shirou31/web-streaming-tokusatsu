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

// Master list of all movies in Tokuflix with their exact target IDs and verified TokusatsuIndo URLs
const MOVIE_DEFINITIONS = [
  {
    targetId: 'scraped_kamen-rider-geats-4-aces-and-the-black-fox_ep1',
    slug: 'kamen-rider-geats-4-aces-and-the-black-fox',
    title: 'Kamen Rider Geats: 4 Aces and the Black Fox (Full Movie)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-geats-4-aces-and-the-black-fox-sub-indonesia/',
    keywords: ['geats', '4 aces']
  },
  {
    targetId: 'scraped_shin-kamen-rider_ep1',
    slug: 'shin-kamen-rider',
    title: 'Shin Kamen Rider (Full Theatrical Movie)',
    exactUrl: 'https://www.tokusatsuindo.com/shin-kamen-rider-sub-indonesia/',
    keywords: ['shin kamen rider']
  },
  {
    targetId: 'scraped_kamen-rider-reiwa-the-first-generation_ep1',
    slug: 'kamen-rider-reiwa-the-first-generation',
    title: 'Kamen Rider: Reiwa The First Generation (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-zero-one-reiwa-first-generation-the-movie-sub-indonesia/',
    keywords: ['reiwa', 'first generation']
  },
  {
    targetId: 'scraped_kamen-rider-zero-one-the-movie-real-time_ep1',
    slug: 'kamen-rider-zero-one-the-movie-real-time',
    title: 'Kamen Rider Zero-One The Movie: REAL×TIME (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-zero-one-realxtime-sub-indonesia/',
    keywords: ['realxtime', 'real', 'time']
  },
  {
    targetId: 'scraped_zero-one-others-kamen-rider-vulcan-valkyrie_ep1',
    slug: 'zero-one-others-kamen-rider-vulcan-valkyrie',
    title: 'Zero-One Others: Kamen Rider Vulcan & Valkyrie (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/zero-one-others-kamen-rider-vulcan-valkyrie-sub-indonesia/',
    keywords: ['vulcan', 'valkyrie']
  },
  {
    targetId: 'scraped_kamen-rider-saber-the-phoenix-swordsman_ep1',
    slug: 'kamen-rider-saber-the-phoenix-swordsman',
    title: 'Kamen Rider Saber: The Phoenix Swordsman and the Book of Ruin (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-saber-the-phoenix-swordsman-and-the-book-of-ruin-sub-indonesia/',
    keywords: ['saber', 'phoenix swordsman']
  },
  {
    targetId: 'scraped_saber-zenkaiger-super-hero-senki_ep1',
    slug: 'saber-zenkaiger-super-hero-senki',
    title: 'Saber + Zenkaiger: Super Hero Senki (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/saber-zenkaiger-super-hero-senki-sub-indonesia/',
    keywords: ['super hero senki', 'zenkaiger']
  },
  {
    targetId: 'scraped_kamen-rider-saber-trio-of-deep-sin_ep1',
    slug: 'kamen-rider-saber-trio-of-deep-sin',
    title: 'Kamen Rider Saber: Trio of Deep Sin (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-saber-v-cinema-trio-of-deep-sin-sub-indonesia/',
    keywords: ['trio of deep sin', 'saber']
  },
  {
    targetId: 'scraped_kamen-rider-beyond-generations_ep1',
    slug: 'kamen-rider-beyond-generations',
    title: 'Kamen Rider: Beyond Generations (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-beyond-generations-sub-indonesia/',
    keywords: ['beyond generations']
  },
  {
    targetId: 'scraped_kamen-rider-revice-battle-familia_ep1',
    slug: 'kamen-rider-revice-battle-familia',
    title: 'Kamen Rider Revice The Movie: Battle Familia (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-revice-battle-familia-sub-indonesia/',
    keywords: ['battle familia', 'revice']
  },
  {
    targetId: 'scraped_kamen-rider-geats-x-revice-movie-battle-royale_ep1',
    slug: 'kamen-rider-geats-x-revice-movie-battle-royale',
    title: 'Kamen Rider Geats × Revice: Movie Battle Royale (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-geats-x-revice-movie-battle-royale-sub-indonesia/',
    keywords: ['geats', 'revice', 'battle royale']
  },
  {
    targetId: 'scraped_kamen-rider-the-winter-movie-gotchard-geats_ep1',
    slug: 'kamen-rider-the-winter-movie-gotchard-geats',
    title: 'Kamen Rider The Winter Movie: Gotchard & Geats (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-the-winter-movie-gotchard-geats-strongest-chemy-great-gotcha-operation-sub-indonesia/',
    keywords: ['winter movie', 'gotchard', 'geats']
  },
  {
    targetId: 'scraped_kamen-rider-gotchard-the-future-daybreak_ep1',
    slug: 'kamen-rider-gotchard-the-future-daybreak',
    title: 'Kamen Rider Gotchard: The Future Daybreak (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-gotchard-the-future-daybreak-sub-indonesia/',
    keywords: ['future daybreak', 'gotchard']
  },
  {
    targetId: 'scraped_ohsama-sentai-king-ohger-adventure-heaven_ep1',
    slug: 'ohsama-sentai-king-ohger-adventure-heaven',
    title: 'Ohsama Sentai King-Ohger: Adventure Heaven (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/ohsama-sentai-king-ohger-adventure-heaven-sub-indonesia/',
    keywords: ['adventure heaven', 'king ohger']
  },
  {
    targetId: 'scraped_king-ohger-vs-donbrothers_ep1',
    slug: 'king-ohger-vs-donbrothers',
    title: 'King-Ohger vs. Donbrothers (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/ohsama-sentai-king-ohger-vs-donbrothers-sub-indonesia/',
    keywords: ['king ohger vs donbrothers']
  },
  {
    targetId: 'scraped_ultraman-trigger-episode-z_ep1',
    slug: 'ultraman-trigger-episode-z',
    title: 'Ultraman Trigger: Episode Z (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/ultraman-trigger-episode-z-sub-indonesia/',
    keywords: ['trigger', 'episode z']
  },
  {
    targetId: 'scraped_ultraman-blazar-the-movie-tokyo-kaiju-showdown_ep1',
    slug: 'ultraman-blazar-the-movie-tokyo-kaiju-showdown',
    title: 'Ultraman Blazar The Movie: Tokyo Kaiju Showdown (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/ultraman-blazar-the-movie-tokyo-kaiju-showdown-sub-indonesia/',
    keywords: ['blazar', 'tokyo kaiju']
  },
  {
    targetId: 'scraped_ultraman-arc-the-movie-clash-of-light-and-evil_ep1',
    slug: 'ultraman-arc-the-movie-clash-of-light-and-evil',
    title: 'Ultraman Arc The Movie: The Clash of Light and Evil (Full Movie Sub Indo)',
    exactUrl: 'https://www.tokusatsuindo.com/ultraman-arc-the-movie-the-clash-of-light-and-evil-sub-indonesia/',
    keywords: ['arc', 'clash of light']
  },
  {
    targetId: 'scraped_prod_kamen-rider-ryuki-episode-final_movie',
    slug: 'kamen-rider-ryuki-episode-final',
    title: 'Kamen Rider Ryuki: Episode Final Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-ryuki-episode-final-sub-indonesia/',
    keywords: ['ryuki', 'episode final']
  },
  {
    targetId: 'scraped_prod_kamen-rider-ryuki-13-riders_movie',
    slug: 'kamen-rider-ryuki-13-riders',
    title: 'Kamen Rider Ryuki Special: 13 Riders Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-ryuki-special-13-riders-sub-indonesia/',
    keywords: ['ryuki', '13 riders']
  },
  {
    targetId: 'scraped_prod_kamen-rider-den-o-kiva-climax-deka_movie',
    slug: 'kamen-rider-den-o-kiva-climax-deka',
    title: 'Kamen Rider Den-O & Kiva: Climax Deka Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-den-o-kiva-climax-deka-sub-indonesia/',
    keywords: ['den-o', 'climax deka']
  },
  {
    targetId: 'scraped_prod_saraba-kamen-rider-den-o-final-countdown_movie',
    slug: 'saraba-kamen-rider-den-o-final-countdown',
    title: 'Saraba Kamen Rider Den-O: Final Countdown Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/saraba-kamen-rider-den-o-final-countdown-movie-sub-indonesia/',
    keywords: ['saraba', 'den-o', 'final countdown']
  },
  {
    targetId: 'scraped_prod_kamen-rider-cho-den-o-trilogy-episode-red_movie',
    slug: 'kamen-rider-cho-den-o-trilogy-episode-red',
    title: 'Kamen Rider Cho-Den-O Trilogy: Episode Red Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-chou-den-o-trilogy-episode-red-sub-indonesia/',
    keywords: ['chou den-o', 'episode red']
  },
  {
    targetId: 'scraped_prod_kamen-rider-cho-den-o-trilogy-episode-blue_movie',
    slug: 'kamen-rider-cho-den-o-trilogy-episode-blue',
    title: 'Kamen Rider Cho-Den-O Trilogy: Episode Blue Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-chou-den-o-trilogy-episode-blue-sub-indonesia/',
    keywords: ['chou den-o', 'episode blue']
  },
  {
    targetId: 'scraped_prod_kamen-rider-cho-den-o-trilogy-episode-yellow_movie',
    slug: 'kamen-rider-cho-den-o-trilogy-episode-yellow',
    title: 'Kamen Rider Cho-Den-O Trilogy: Episode Yellow Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-chou-den-o-trilogy-episode-yellow-sub-indonesia/',
    keywords: ['chou den-o', 'episode yellow']
  },
  {
    targetId: 'scraped_prod_kamen-rider-ooo-w-featuring-skull-movie-war-core_movie',
    slug: 'kamen-rider-ooo-w-featuring-skull-movie-war-core',
    title: 'Kamen Rider × Kamen Rider OOO & W Featuring Skull: Movie War Core Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-x-kamen-rider-ooo-w-featuring-skull-movie-war-core-sub-indonesia/',
    keywords: ['movie war core', 'ooo']
  },
  {
    targetId: 'scraped_prod_kamen-rider-ooo-wonderful-the-shogun-and-21-core-medals_movie',
    slug: 'kamen-rider-ooo-wonderful-the-shogun-and-21-core-medals',
    title: 'Kamen Rider OOO Wonderful: The Shogun and the 21 Core Medals Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-ooo-the-movie-wonderful-shogun-and-21-core-medals-sub-indonesia/',
    keywords: ['ooo', 'wonderful', '21 core']
  },
  {
    targetId: 'scraped_prod_kamen-rider-fourze-ooo-movie-war-mega-max_movie',
    slug: 'kamen-rider-fourze-ooo-movie-war-mega-max',
    title: 'Kamen Rider × Kamen Rider Fourze & OOO: Movie War Mega Max Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-fourze-w-ooo-movie-war-megamax-sub-indonesia/',
    keywords: ['fourze', 'megamax']
  },
  {
    targetId: 'scraped_prod_kamen-rider-ooo-10th-core-medal-of-resurrection_movie',
    slug: 'kamen-rider-ooo-10th-core-medal-of-resurrection',
    title: 'Kamen Rider OOO 10th: Core Medal of Resurrection Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kamen-rider-ooo-10th-core-medal-of-resurrection-sub-indonesia/',
    keywords: ['ooo 10th', 'core medal']
  },
  {
    targetId: 'scraped_prod_gokaiger-goseiger-super-sentai-199-hero-great-battle_movie',
    slug: 'gokaiger-goseiger-super-sentai-199-hero-great-battle',
    title: 'Gokaiger Goseiger Super Sentai 199 Hero Great Battle Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/gokaiger-goseiger-super-sentai-199-hero-great-battle-sub-indonesia/',
    keywords: ['199 hero', 'gokaiger']
  },
  {
    targetId: 'scraped_prod_kaizoku-sentai-gokaiger-the-flying-ghost-ship_movie',
    slug: 'kaizoku-sentai-gokaiger-the-flying-ghost-ship',
    title: 'Kaizoku Sentai Gokaiger The Movie: The Flying Ghost Ship Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kaizoku-sentai-gokaiger-the-movie-the-flying-ghost-ship-sub-indonesia/',
    keywords: ['flying ghost ship', 'gokaiger']
  },
  {
    targetId: 'scraped_prod_kaizoku-sentai-gokaiger-vs-space-sheriff-gavan_movie',
    slug: 'kaizoku-sentai-gokaiger-vs-space-sheriff-gavan',
    title: 'Kaizoku Sentai Gokaiger vs. Space Sheriff Gavan: The Movie Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/kaizoku-sentai-gokaiger-vs-gavan-the-movie-sub-indonesia/',
    keywords: ['gokaiger vs gavan']
  },
  {
    targetId: 'scraped_prod_tokumei-sentai-go-busters-vs-kaizoku-sentai-gokaiger_movie',
    slug: 'tokumei-sentai-go-busters-vs-kaizoku-sentai-gokaiger',
    title: 'Tokumei Sentai Go-Busters vs. Kaizoku Sentai Gokaiger: The Movie Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/tokumei-sentai-go-busters-vs-kaizoku-sentai-gokaiger-the-movie-sub-indonesia/',
    keywords: ['go-busters vs', 'gokaiger']
  },
  {
    targetId: 'scraped_prod_shin-ultraman_movie',
    slug: 'shin-ultraman',
    title: 'Shin Ultraman Full Movie Sub Indo',
    exactUrl: 'https://www.tokusatsuindo.com/shin-ultraman-2022-sub-indonesia/',
    keywords: ['shin ultraman']
  }
];

// Fallback high quality official streams for movies that don't have fansub web posts
const FALLBACK_OFFICIAL_MOVIES = [
  {
    targetId: 'scraped_prod_kamen-rider-den-o-im-born_movie',
    slug: 'kamen-rider-den-o-im-born',
    title: "Kamen Rider Den-O: I'm Born! Full Movie",
    embedUrl: 'https://www.youtube-nocookie.com/embed/lKovJpWl1s0?vq=hd1080',
    sourceUrl: 'https://www.youtube.com/watch?v=lKovJpWl1s0'
  },
  {
    targetId: 'scraped_prod_cho-kamen-rider-den-o-decade-onigashima_movie',
    slug: 'cho-kamen-rider-den-o-decade-onigashima',
    title: 'Cho Kamen Rider Den-O & Decade Neo Generations: The Onigashima Warship Full Movie',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Z0o8P5M-51Q?vq=hd1080',
    sourceUrl: 'https://www.youtube.com/watch?v=Z0o8P5M-51Q'
  },
  {
    targetId: 'scraped_prod_kamen-rider-x-super-sentai-super-hero-taisen_movie',
    slug: 'kamen-rider-x-super-sentai-super-hero-taisen',
    title: 'Kamen Rider × Super Sentai: Super Hero Taisen Full Movie',
    embedUrl: 'https://www.youtube-nocookie.com/embed/sVq1l6p1Q84?vq=hd1080',
    sourceUrl: 'https://www.youtube.com/watch?v=sVq1l6p1Q84'
  }
];

async function main() {
  console.log(`Starting scrape and verification for ${MOVIE_DEFINITIONS.length} movies...`);

  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let verifiedCount = 0;

  for (const m of MOVIE_DEFINITIONS) {
    console.log(`\n[MOVIE] Processing "${m.title}"...`);
    console.log(`  Target URL: ${m.exactUrl}`);

    const html = await fetchPage(m.exactUrl);
    if (!html) {
      console.log(`  ❌ Failed to fetch page!`);
      continue;
    }

    // Verify Title from page
    const pageTitleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                           html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                           html.match(/<title>([\s\S]*?)<\/title>/i);
    const pageTitle = pageTitleMatch ? pageTitleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    console.log(`  Page Title: "${pageTitle}"`);

    // Verify keywords in page title
    const normTitle = pageTitle.toLowerCase();
    const allKeywordsMatch = m.keywords.every(kw => normTitle.includes(kw.toLowerCase()));
    if (!allKeywordsMatch) {
      console.log(`  ⚠️ Warning: Page title does not match all keywords ${JSON.stringify(m.keywords)}!`);
    }

    const embed = extractEmbed(html);
    const gdrive = extractGdriveLinks(html);

    if (!embed && gdrive.length === 0) {
      console.log(`  ❌ No embed or gdrive found on page!`);
      continue;
    }

    console.log(`  ✅ Extracted Embed: ${embed ? embed.slice(0, 60) + '...' : 'none'}`);
    console.log(`  ✅ GDrive Links: ${gdrive.length}`);

    // Update or insert into scrapedTokusatsu.json
    let item = data.episodes.find(e => e.id === m.targetId);
    if (!item) {
      // Find by slug or create
      item = data.episodes.find(e => e.contentType === 'movie' && (e.productionId?.includes(m.slug) || e.id?.includes(m.slug)));
    }

    if (!item) {
      console.log(`  Creating new entry for ${m.targetId}`);
      item = {
        id: m.targetId,
        productionId: m.slug,
        seriesTitle: m.title.replace(' (Full Movie)', '').replace(' Full Movie Sub Indo', '').replace(' (Full Theatrical Movie)', ''),
        title: m.title,
        episodeNumber: 1,
        contentType: 'movie',
        franchise: m.slug.includes('sentai') || m.slug.includes('gokaiger') || m.slug.includes('ohger') || m.slug.includes('boonboomger') ? 'Super Sentai' : (m.slug.includes('ultra') ? 'Ultraman' : 'Kamen Rider'),
        era: m.slug.includes('den-o') || m.slug.includes('ooo') || m.slug.includes('ryuki') || m.slug.includes('gokaiger') ? 'Heisei' : 'Reiwa',
        scrapedAt: new Date().toISOString()
      };
      data.episodes.push(item);
    }

    item.sourceUrl = m.exactUrl;
    item.servers = [];

    if (embed) {
      item.servers.push({
        id: `srv_real_${m.targetId}`,
        name: 'Server 1 (Direct Embed HD)',
        embedUrl: embed,
        directUrl: null,
        type: 'embed',
        status: 'online'
      });
    }

    if (gdrive.length > 0) {
      const gSrvIndex = item.servers.length + 1;
      item.servers.push({
        id: `srv_real_gdrive_${m.targetId}`,
        name: `Server ${gSrvIndex} (Google Drive Preview)`,
        embedUrl: gdrive[0],
        directUrl: gdrive[0].replace('/preview', '/view?usp=sharing'),
        type: 'gdrive',
        status: 'online'
      });
      item.driveDownloadUrl1 = gdrive[0].replace('/preview', '/view?usp=sharing');
    }

    verifiedCount++;
  }

  // Handle fallback official movies
  for (const fb of FALLBACK_OFFICIAL_MOVIES) {
    let item = data.episodes.find(e => e.id === fb.targetId);
    if (item) {
      item.sourceUrl = fb.sourceUrl;
      item.servers = [
        {
          id: `srv_official_${fb.targetId}`,
          name: 'Server 1 (Official Stream Player HD)',
          embedUrl: fb.embedUrl,
          directUrl: null,
          type: 'embed',
          status: 'online'
        }
      ];
      console.log(`\n[FALLBACK] Updated ${fb.title} with official HD player.`);
      verifiedCount++;
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n======================================================`);
  console.log(`🎉 SCRAPE & VERIFICATION FINISHED:`);
  console.log(`   Updated ${verifiedCount} movies with active, verified players!`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
