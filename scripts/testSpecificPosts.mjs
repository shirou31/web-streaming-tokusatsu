async function testSpecificPosts() {
  const posts = [
    'https://www.tokusatsuindo.com/ultraman-arc-the-movie-the-clash-of-light-and-evil-sub-indonesia/',
    'https://www.tokusatsuindo.com/ultraman-trigger-episode-z-sub-indonesia/',
    'https://www.tokusatsuindo.com/ultraman-blazar-the-movie-tokyo-kaiju-showdown-sub-indonesia/',
    'https://www.tokusatsuindo.com/kaizoku-sentai-ten-gokaiger-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-w-returns-kamen-rider-eternal-movie-sub-indonesia/',
    'https://www.tokusatsuindo.com/garo-movie-red-requiem-sub-indonesia/'
  ];

  for (const url of posts) {
    const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
    console.log(`\nPost: ${url} (Embeds: ${embedMatches.length})`);
    for (const em of embedMatches) {
      try {
        const decoded = Buffer.from(em[1], 'base64').toString('utf8');
        const src = decoded.match(/src=["']([^"']+)["']/i)?.[1];
        console.log('  Embed src:', src);
        if (src && src.includes('player.tokusatsuindo.com')) {
          const pHtml = await (await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url } })).text();
          const dataSrcMatch = pHtml.match(/data-src=["']([^"']+)["']/);
          if (dataSrcMatch) {
            const rawSrc = dataSrcMatch[1];
            const tMatch = rawSrc.match(/t=([A-Za-z0-9+/=_-]+)/);
            if (tMatch) {
              const b64 = tMatch[1].split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
              const pld = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
              console.log('  -> DECODED:', pld.title);
              console.log('     Drive 1:', pld.google_drive_url_1 || pld.file_id_1);
              console.log('     Drive 2:', pld.google_drive_url_2 || pld.file_id_2);
            }
          }
        }
      } catch (err) {
        console.log('  Error:', err.message);
      }
    }
  }
}

testSpecificPosts();
