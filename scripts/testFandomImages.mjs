async function getPageImages(wiki, title) {
  const url = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TokuBot/1.0' } });
  const data = await res.json();
  const pages = data.query?.pages;
  const pageId = Object.keys(pages)[0];
  const images = pages[pageId]?.images || [];
  console.log(`Images for ${title}:`, images.map(i => i.title));
}

getPageImages('kamenrider', 'Kamen_Rider_Zero-One');
getPageImages('kamenrider', 'Kamen_Rider_Saber');
getPageImages('kamenrider', 'Kamen_Rider_Revice');
getPageImages('ultra', 'Ultraman_Z_(character)');
getPageImages('powerrangers', 'Kikai_Sentai_Zenkaiger');
