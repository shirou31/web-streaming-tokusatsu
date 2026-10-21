async function searchFiles(wiki, query) {
  const url = `https://${wiki}.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TokuBot/1.0' } });
  const data = await res.json();
  const results = data.query?.search || [];
  console.log(`Search in ${wiki} for "${query}":`, results.slice(0, 5).map(r => r.title));
  
  if (results.length > 0) {
    const fileTitle = results[0].title;
    const infoUrl = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
    const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'TokuBot/1.0' } });
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages;
    const p = Object.values(pages)[0];
    console.log(`URL for ${fileTitle}:`, p?.imageinfo?.[0]?.url);
  }
}

searchFiles('kamenrider', 'Zero-One poster');
searchFiles('kamenrider', 'Saber poster');
searchFiles('kamenrider', 'Revice poster');
searchFiles('kamenrider', 'Gotchard poster');
searchFiles('powerrangers', 'Zenkaiger poster');
searchFiles('ultra', 'Ultraman Z poster');
searchFiles('ultra', 'Ultraman Trigger poster');
searchFiles('ultra', 'Ultraman Decker poster');
searchFiles('ultra', 'Ultraman Blazar poster');
