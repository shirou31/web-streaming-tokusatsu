async function testTmdbWeb(query) {
  try {
    const res = await fetch(`https://www.themoviedb.org/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    console.log(query, 'Status:', res.status);
    const html = await res.text();
    const posterMatches = html.match(/https:\/\/image\.tmdb\.org\/t\/p\/[^\s"'>]+/g);
    console.log('Posters found:', posterMatches ? [...new Set(posterMatches)].slice(0, 5) : 'None');
  } catch (e) {
    console.error(e.message);
  }
}

testTmdbWeb('Kamen Rider Zero-One');
