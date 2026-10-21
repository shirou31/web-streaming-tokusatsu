async function inspect() {
  const res = await fetch('https://www.tokusatsuindo.com/ultraman-arc-the-movie-the-clash-of-light-and-evil-sub-indonesia/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  console.log('HTML length:', html.length);
  const embeds = [...html.matchAll(/data-embed=["']([^"']+)["']/g)];
  console.log('data-embed count:', embeds.length);
  embeds.forEach((e, i) => {
    try {
      console.log('Embed', i, Buffer.from(e[1], 'base64').toString('utf8'));
    } catch(err) {
      console.log('Embed', i, e[1]);
    }
  });

  const links = [...html.matchAll(/href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)];
  const interesting = links.filter(l => l[1].includes('drive.google.com') || l[1].includes('mega') || l[1].includes('mediafire') || l[1].includes('stream') || l[1].includes('player') || l[2].includes('1080') || l[2].includes('720') || l[2].includes('480') || l[2].includes('Download'));
  console.log('Interesting links count:', interesting.length);
  interesting.slice(0, 30).forEach(l => console.log('Link:', l[2].replace(/<[^>]+>/g, '').trim(), '->', l[1]));
}
inspect();
