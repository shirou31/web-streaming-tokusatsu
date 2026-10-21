async function getPageInfoboxImage(wiki, pageTitle) {
  try {
    const url = `https://${wiki}.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=images&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'TokuBot/1.0' } });
    const data = await res.json();
    const images = data.parse?.images || [];
    console.log(`Images in page [${pageTitle}]:`, images.slice(0, 10));

    // Find the first image that has "Poster", "poster", or main image
    const posterFile = images.find(img => /poster/i.test(img)) || images.find(img => !/logo|icon|box/i.test(img));
    if (posterFile) {
      const infoUrl = `https://${wiki}.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(posterFile)}&prop=imageinfo&iiprop=url&format=json`;
      const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'TokuBot/1.0' } });
      const infoData = await infoRes.json();
      const p = Object.values(infoData.query?.pages || {})[0];
      const fileUrl = p?.imageinfo?.[0]?.url;
      console.log(`-> Selected ${posterFile}:`, fileUrl);
      return fileUrl;
    }
  } catch (err) {
    console.error(err.message);
  }
  return null;
}

async function run() {
  await getPageInfoboxImage('kamenrider', 'Kamen Rider Saber: The Phoenix Swordsman and the Book of Ruin');
  await getPageInfoboxImage('ultra', 'Ultraman Z (series)');
  await getPageInfoboxImage('ultra', 'Ultraman Trigger: New Generation Tiga');
  await getPageInfoboxImage('powerrangers', 'Avataro Sentai Donbrothers');
  await getPageInfoboxImage('powerrangers', 'King-Ohger vs. Donbrothers');
  await getPageInfoboxImage('garo', 'Garo: Hagane o Tsugu Mono');
}

run();
