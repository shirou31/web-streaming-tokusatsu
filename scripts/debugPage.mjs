async function test() {
  const res = await fetch('https://www.tokusatsuindo.com/ultraman-arc-episode-1-sub-indonesia/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  
  // Look for tabs
  const tabMatches = html.match(/<ul[^>]*class=["'][^"']*gmr-player-nav[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi) || [];
  console.log('Tab matches count:', tabMatches.length);
  tabMatches.forEach((m, i) => console.log('Tab', i, m));

  // Look for buttons or data- attributes
  const buttons = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)];
  console.log('Buttons:', buttons.map(b => b[0]));
}
test();
