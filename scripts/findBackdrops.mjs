import fs from 'fs';

async function testShinUltraman() {
  const res = await fetch('https://www.themoviedb.org/movie/634429-shin-ultraman', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  const tmdbImages = text.match(/https:\/\/image\.tmdb\.org\/t\/p\/[^\s"'>]+/g);
  console.log('Found images:', tmdbImages ? [...new Set(tmdbImages)].slice(0, 10) : 'None');
}

testShinUltraman();
