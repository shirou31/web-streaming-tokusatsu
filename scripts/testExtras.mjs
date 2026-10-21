async function searchExtras() {
  const targets = [
    { id: 'scraped_sawidago_no-1-sentai-gozyuger-vs-boonboomger-movie_ep1_mvhzpw7s', q: 'gozyuger vs boonboomger' },
    { id: 'scraped_sawidago_bakuage-sentai-boonboomger-8211-movie-boon-promise-the-circuit_ep1_mvhzqg54', q: 'boonboomger movie promise circuit' },
    { id: 'scraped_sawidago_ohsama-sentai-king-ohger-vs-kyoryuger_ep1_mvhzqk7j', q: 'king-ohger vs kyoryuger' }
  ];

  for (const t of targets) {
    const res = await fetch('https://www.tokusatsuindo.com/?s=' + encodeURIComponent(t.q), { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const matches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
    console.log(`Query "${t.q}" -> ${matches.length} articles`);
    matches.forEach(a => {
      const l = a[1].match(/<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      const tt = a[1].match(/<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/i);
      console.log('  -', tt ? tt[1].replace(/<[^>]+>/g, '').trim() : '', '->', l ? l[1] : '');
    });
  }
}
searchExtras();
