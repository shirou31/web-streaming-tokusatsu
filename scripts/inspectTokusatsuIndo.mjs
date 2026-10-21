const res = await fetch('https://www.tokusatsuindo.com/', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
});
const html = await res.text();
const matches = [...html.matchAll(/href="(https:\/\/www\.tokusatsuindo\.com\/[^"]+)"[^>]*>([^<]+)<\/a>/g)];
const series = matches
  .map(m => ({ url: m[1], title: m[2].trim() }))
  .filter(x => x.title.length > 2);
console.log('Total menu links:', series.length);
series.forEach(s => console.log(`${s.title} -> ${s.url}`));
