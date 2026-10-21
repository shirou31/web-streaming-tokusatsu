async function searchArcLiveAction() {
  const titles = [
    'Ultraman_Arc',
    'Ultraman_Arc_(character)',
    'Yuma_Hize',
    'Shagong',
    'Digelos'
  ];
  for (const t of titles) {
    const url = `https://ultra.fandom.com/api.php?action=query&generator=images&titles=${encodeURIComponent(t)}&gimlimit=50&prop=imageinfo&iiprop=url|size&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    const pages = data.query?.pages || {};
    for (const p of Object.values(pages)) {
      const info = p.imageinfo?.[0];
      if (info && info.width >= 1200 && info.width > info.height) {
        console.log(`[${t}] ${p.title} (${info.width}x${info.height}): ${info.url}`);
      }
    }
  }
}
searchArcLiveAction();
