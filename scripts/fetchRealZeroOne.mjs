async function fetchZeroOneEps() {
  const results = [];
  for (let i = 1; i <= 6; i++) {
    const pageUrl = `https://www.tokusatsuindo.com/kamen-rider-zero-one-episode-${i}-sub-indonesia/`;
    try {
      console.log(`Fetching Ep ${i}...`);
      const res = await fetch(pageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const html = await res.text();
      const embedMatches = [...html.matchAll(/data-embed=["']([^"']+)["']/g)];
      
      let foundDrive = null;
      for (const em of embedMatches) {
        const rawB64 = em[1];
        const decodedIframe = Buffer.from(rawB64, 'base64').toString('utf8');
        const pUrlMatch = decodedIframe.match(/src=["']([^"']+)["']/);
        if (pUrlMatch) {
          const pUrl = pUrlMatch[1];
          const pRes = await fetch(pUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Referer': pageUrl
            }
          });
          const pText = await pRes.text();
          const dataSrcMatch = pText.match(/data-src=["']([^"']+)["']/);
          if (dataSrcMatch) {
            const m = dataSrcMatch[1].match(/t=([A-Za-z0-9_-]+)\./);
            if (m) {
              let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
              while (b64.length % 4) b64 += '=';
              const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
              foundDrive = decoded;
              break;
            }
          }
        }
      }

      if (foundDrive) {
        console.log(`\n=== Zero-One Episode ${i} Found! ===`);
        console.log('Title:', foundDrive.title);
        console.log('Drive 1:', foundDrive.google_drive_url_1);
        console.log('Drive 2:', foundDrive.google_drive_url_2);
        console.log('Poster:', foundDrive.poster_url);
        results.push({ ep: i, data: foundDrive });
      } else {
        console.log(`Ep ${i}: No stream found.`);
      }
    } catch (err) {
      console.log(`Ep ${i} error:`, err.message);
    }
  }
  return results;
}

fetchZeroOneEps().then(res => {
  console.log(`\nCompleted fetching ${res.length}/6 episodes!`);
});
