async function searchFile(wiki, q) {
  const url = `https://${wiki}.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TokuBot/1.0' } });
  const data = await res.json();
  const hits = data.query?.search || [];
  console.log(`\nQuery: "${q}" in ${wiki}:`, hits.slice(0, 5).map(h => h.title));
  if (hits.length > 0) {
    const infoUrl = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(hits[0].title)}&prop=imageinfo&iiprop=url&format=json`;
    const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'TokuBot/1.0' } });
    const infoData = await infoRes.json();
    const p = Object.values(infoData.query?.pages || {})[0];
    console.log(`-> URL:`, p?.imageinfo?.[0]?.url);
  }
}

async function run() {
  await searchFile('kamenrider', '13 Riders');
  await searchFile('kamenrider', 'Climax Deka poster');
  await searchFile('kamenrider', 'Final Countdown poster');
  await searchFile('kamenrider', 'Episode Red poster');
  await searchFile('kamenrider', 'Episode Blue poster');
  await searchFile('kamenrider', 'Episode Yellow poster');
  await searchFile('powerrangers', 'Gokaiger vs. Gavan poster');
  await searchFile('powerrangers', 'Super Hero Taisen poster');
}

run();
