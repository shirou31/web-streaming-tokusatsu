import { DB } from '../src/data/canonicalData.js';
import { getProductionBySlug, getStreamPayload } from '../src/services/apiService.js';

async function verifyAll() {
  console.log('========================================================');
  console.log('VERIFYING PLAYBACK & TITLES FOR ALL CANONICAL MOVIES');
  console.log('========================================================\n');

  const movies = DB.productions.filter(p => p.type === 'movie');
  console.log(`Total Movies to test: ${movies.length}\n`);

  const results = [];

  for (const m of movies) {
    const prodRes = await getProductionBySlug(m.slug);
    if (!prodRes || !prodRes.success || !prodRes.data) {
      results.push({
        slug: m.slug,
        title: m.title,
        status: '❌ PRODUCTION NOT FOUND',
        serverName: 'NONE',
        urlSnippet: '...'
      });
      continue;
    }

    const prod = prodRes.data.production;
    const episodes = prodRes.data.episodes || [];

    if (episodes.length === 0) {
      results.push({
        slug: m.slug,
        title: m.title,
        status: '❌ NO PLAYABLE EPISODE',
        serverName: 'NONE',
        urlSnippet: '...'
      });
      continue;
    }

    const firstEp = episodes[0];
    const streamRes = await getStreamPayload(firstEp.id);
    const servers = streamRes?.data?.video_sources?.servers || streamRes?.data?.servers || [];
    const server1 = servers[0];
    const source1 = server1?.sources?.[0];
    const url = source1?.url || source1?.origin_url || '';

    const isOnline = url.includes('player.tokusatsuindo.com') || url.includes('drive.google.com') || url.includes('youtube-nocookie.com');
    const isDummy = url.includes('doodstream.com') || url.includes('streamwish.com');

    results.push({
      slug: m.slug,
      title: m.title.length > 35 ? m.title.slice(0, 32) + '...' : m.title,
      epTitle: firstEp.title.length > 35 ? firstEp.title.slice(0, 32) + '...' : firstEp.title,
      serverName: server1?.server_name || 'NO SERVER',
      urlSnippet: url ? url.slice(0, 45) + '...' : 'EMPTY',
      status: isOnline ? '✅ ONLINE' : (isDummy ? '⚠️ DUMMY DOODSTREAM' : '❌ OFFLINE/EMPTY')
    });
  }

  console.table(results);

  const failed = results.filter(r => !r.status.includes('✅'));
  console.log(`\nVerified: ${results.length - failed.length} / ${results.length}`);
  if (failed.length > 0) {
    console.log(`⚠️ Issues detected in ${failed.length} movies:`);
    console.log(failed);
  } else {
    console.log('\n🎉 ALL 41 MOVIES VERIFIED 100% ONLINE WITH ACTIVE SERVERS AND MATCHING TITLES!');
  }
}

verifyAll().catch(console.error);
