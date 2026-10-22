async function test() {
  const res = await fetch('https://www.tokusatsuindo.com/ultraman-arc-episode-1-sub-indonesia/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  
  // Find player iframes
  const iframes = [...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/g)];
  console.log('Iframes:', iframes.map(i => i[1]));

  // Find all download links / gdrive / buzzheavier / mediafire / etc
  const allLinks = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)];
  console.log('Total <a> tags:', allLinks.length);
  const dlLinks = allLinks.filter(l => {
    const text = l[2].toLowerCase();
    const href = l[1].toLowerCase();
    return href.includes('drive.google.com') || 
           href.includes('mediafire') || 
           href.includes('mega.nz') || 
           href.includes('buzzheavier') || 
           href.includes('racaty') ||
           href.includes('hxfile') ||
           text.includes('1080p') || 
           text.includes('720p') || 
           text.includes('480p') || 
           text.includes('gdrive') ||
           text.includes('google');
  });

  console.log('DL Links found:');
  dlLinks.forEach(l => {
    console.log(`[${l[2].replace(/<[^>]+>/g, '').trim()}] -> ${l[1]}`);
  });
}
test();
