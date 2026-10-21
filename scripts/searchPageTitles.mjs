async function searchPages(wiki, query) {
  const url = `https://${wiki}.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TokuBot/1.0' } });
  const data = await res.json();
  console.log(`Pages in ${wiki} for "${query}":`, data.query?.search?.map(s => s.title));
}

searchPages('powerrangers', 'King-Ohger vs. Donbrothers');
searchPages('garo', 'Hagane');
