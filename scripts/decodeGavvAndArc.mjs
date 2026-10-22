async function decodeUrl(pageUrl) {
  try {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    const embedMatches = [...html.matchAll(/data-embed=["']([^"']+)["']/g)];
    for (const em of embedMatches) {
      const rawB64 = em[1];
      const decodedIframe = Buffer.from(rawB64, 'base64').toString('utf8');
      const pUrlMatch = decodedIframe.match(/src=["']([^"']+)["']/);
      if (pUrlMatch) {
        const pUrl = pUrlMatch[1];
        const pRes = await fetch(pUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': pageUrl } });
        const pText = await pRes.text();
        const dataSrcMatch = pText.match(/data-src=["']([^"']+)["']/);
        if (dataSrcMatch) {
          const m = dataSrcMatch[1].match(/t=([A-Za-z0-9_-]+)\./);
          if (m) {
            let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
          }
        }
      }
    }
  } catch (e) {}
  return null;
}

(async () => {
  const g1 = await decodeUrl('https://www.tokusatsuindo.com/kamen-rider-gavv-episode-1-sub-indonesia/');
  const g2 = await decodeUrl('https://www.tokusatsuindo.com/kamen-rider-gavv-episode-2-sub-indonesia/');
  const g3 = await decodeUrl('https://www.tokusatsuindo.com/kamen-rider-gavv-episode-3-sub-indonesia/');
  const arc1 = await decodeUrl('https://www.tokusatsuindo.com/ultraman-arc-episode-1-sub-indonesia/');
  console.log('Gavv 1:', g1?.google_drive_url_1);
  console.log('Gavv 2:', g2?.google_drive_url_1);
  console.log('Gavv 3:', g3?.google_drive_url_1);
  console.log('Arc 1:', arc1?.google_drive_url_1);
})();
