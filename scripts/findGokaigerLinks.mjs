async function checkGokaigerEmbeds() {
  for (let ep = 1; ep <= 5; ep++) {
    const url = `https://www.tokusatsuindo.com/gokaiger-episode-${ep}-sub-indonesia/`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const match = html.match(/data-embed="([^"]+)"/i);
      if (match) {
        const decoded = Buffer.from(match[1], 'base64').toString('utf8');
        const srcMatch = decoded.match(/src="([^"]+)"/i);
        console.log(`Episode ${ep}:`, srcMatch ? srcMatch[1] : 'No src in embed');
      } else {
        console.log(`Episode ${ep}: No data-embed found`);
      }
    } catch (e) {
      console.error(`Episode ${ep} error:`, e.message);
    }
  }
}

checkGokaigerEmbeds();
