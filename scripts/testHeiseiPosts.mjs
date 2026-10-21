async function testHeiseiPosts() {
  const posts = [
    'https://www.tokusatsuindo.com/kamen-rider-ryuki-episode-final-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-den-o-kiva-climax-deka-sub-indonesia/',
    'https://www.tokusatsuindo.com/saraba-kamen-rider-den-o-final-countdown-movie-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-chou-den-o-trilogy-episode-red-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-chou-den-o-trilogy-episode-blue-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-chou-den-o-trilogy-episode-yellow-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-x-kamen-rider-ooo-w-featuring-skull-movie-war-core-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-ooo-the-movie-wonderful-shogun-and-21-core-medals-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-fourze-w-ooo-movie-war-megamax-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-ooo-10th-core-medal-of-resurrection-sub-indonesia/',
    'https://www.tokusatsuindo.com/gokaiger-goseiger-super-sentai-199-hero-great-battle-sub-indonesia/',
    'https://www.tokusatsuindo.com/kaizoku-sentai-gokaiger-the-movie-the-flying-ghost-ship-sub-indonesia/',
    'https://www.tokusatsuindo.com/kaizoku-sentai-gokaiger-vs-gavan-the-movie-sub-indonesia/',
    'https://www.tokusatsuindo.com/tokumei-sentai-go-busters-vs-kaizoku-sentai-gokaiger-the-movie-sub-indonesia/'
  ];

  for (const url of posts) {
    const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
    for (const em of embedMatches) {
      try {
        const decoded = Buffer.from(em[1], 'base64').toString('utf8');
        const src = decoded.match(/src=["']([^"']+)["']/i)?.[1];
        if (src && src.includes('player.tokusatsuindo.com')) {
          const pHtml = await (await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url } })).text();
          const dataSrcMatch = pHtml.match(/data-src=["']([^"']+)["']/);
          if (dataSrcMatch) {
            const rawSrc = dataSrcMatch[1];
            const tMatch = rawSrc.match(/t=([A-Za-z0-9+/=_-]+)/);
            if (tMatch) {
              const b64 = tMatch[1].split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
              const pld = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
              console.log(`\nPost: ${url}`);
              console.log('  -> DECODED:', pld.title);
              console.log('     Drive 1:', pld.google_drive_url_1 || pld.file_id_1);
              console.log('     Drive 2:', pld.google_drive_url_2 || pld.file_id_2);
            }
          }
        }
      } catch (err) {
        console.log('  Error for ' + url + ':', err.message);
      }
    }
  }
}

testHeiseiPosts();
