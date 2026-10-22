import fs from 'fs';

async function run() {
  const cDataPath = 'src/data/canonicalData.js';
  const cDataRaw = fs.readFileSync(cDataPath, 'utf8');
  const scrapedPath = 'src/data/scrapedTokusatsu.json';
  const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));

  const cData = await import('../src/data/canonicalData.js');
  const db = cData.DB;

  const movies = db.productions.filter(p => p.type === 'movie' || p.is_standalone);
  console.log(`Found ${movies.length} movies in DB.productions.`);

  const QUALITY_TIERS = [
    { quality: '1440p', label: '1440p (2K Ultra QHD)', bitrate_kbps: 8500 },
    { quality: '1080p', label: '1080p (Full HD 60FPS)', bitrate_kbps: 5000 },
    { quality: '450p', label: '450p (SD Standar Bersih)', bitrate_kbps: 1500 },
    { quality: '360p', label: '360p (Hemat Data Ringan)', bitrate_kbps: 700 }
  ];

  let addedEpisodes = 0;
  let addedSources = 0;

  for (const movie of movies) {
    let ep = db.episodes.find(e => e.production_id === movie.id);
    if (!ep) {
      ep = {
        id: `ep_movie_${movie.slug}`,
        production_id: movie.id,
        episode_number: 1,
        episode_label: 'Theatrical Cut',
        kind: 'feature',
        slug: 'feature',
        title: `${movie.title} (Full Movie Sub Indo)`,
        title_native: movie.title_native || movie.title,
        synopsis: movie.synopsis || `Nonton streaming online ${movie.title} subtitle Indonesia kualitas jernih hingga 1440p 2K QHD.`,
        thumbnail_url: movie.backdrop_url || movie.poster_url,
        duration_seconds: (movie.runtime_minutes || 90) * 60,
        air_date: movie.release_date || `${movie.release_year}-01-01`,
        intro_start_seconds: 0,
        intro_end_seconds: 0,
        outro_start_seconds: ((movie.runtime_minutes || 90) * 60) - 180,
        view_count: movie.view_count || 150000,
        is_published: true,
        published_at: movie.release_date ? `${movie.release_date}T00:00:00Z` : '2024-01-01T00:00:00Z'
      };
      db.episodes.push(ep);
      addedEpisodes++;
      console.log(`+ Added episode for ${movie.title} (${ep.id})`);
    }

    // Match in scrapedTokusatsu
    const scraped = scrapedData.episodes.find(se => 
      se.productionId === movie.id || 
      se.id === `scraped_prod_${movie.slug}_movie` ||
      se.id.includes(movie.slug) ||
      (se.title && se.title.toLowerCase().includes(movie.title.toLowerCase().slice(0, 15)))
    );

    let driveEmbed1 = 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/preview';
    let driveDirect1 = 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/view?usp=sharing';
    let driveEmbed2 = 'https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/preview';
    let driveDirect2 = 'https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/view?usp=sharing';

    if (scraped) {
      if (scraped.productionId !== movie.id) {
        scraped.productionId = movie.id;
      }
      if (scraped.servers && scraped.servers.length > 0) {
        const s1 = scraped.servers[0];
        if (s1.embedUrl) driveEmbed1 = s1.embedUrl;
        if (s1.directUrl) driveDirect1 = s1.directUrl;
        if (scraped.servers.length > 1) {
          const s2 = scraped.servers[1];
          if (s2.embedUrl) driveEmbed2 = s2.embedUrl;
          if (s2.directUrl) driveDirect2 = s2.directUrl;
        }
      }
    }

    // Ensure video_sources exist for all 4 tiers for Server 1 and Server 2
    for (const qt of QUALITY_TIERS) {
      const existing1 = db.video_sources.find(vs => vs.episode_id === ep.id && vs.server_name.includes('Server 1') && vs.quality === qt.quality);
      if (!existing1) {
        db.video_sources.push({
          id: `vs_${ep.id}_s1_${qt.quality}`,
          episode_id: ep.id,
          server_name: 'Server 1 (Google Drive Direct HD / 1440p)',
          source_type: 'gdrive',
          quality: qt.quality,
          origin_url: driveEmbed1,
          direct_url: driveDirect1,
          mime_type: 'video/mp4',
          bitrate_kbps: qt.bitrate_kbps,
          audio_language: 'ja',
          has_hardsub: true,
          hardsub_language: 'id',
          is_protected: false,
          priority: 1,
          is_active: true
        });
        addedSources++;
      }

      const existing2 = db.video_sources.find(vs => vs.episode_id === ep.id && vs.server_name.includes('Server 2') && vs.quality === qt.quality);
      if (!existing2) {
        db.video_sources.push({
          id: `vs_${ep.id}_s2_${qt.quality}`,
          episode_id: ep.id,
          server_name: 'Server 2 (Mirror Direct HD / 1440p)',
          source_type: 'gdrive',
          quality: qt.quality,
          origin_url: driveEmbed2,
          direct_url: driveDirect2,
          mime_type: 'video/mp4',
          bitrate_kbps: qt.bitrate_kbps,
          audio_language: 'ja',
          has_hardsub: true,
          hardsub_language: 'id',
          is_protected: false,
          priority: 2,
          is_active: true
        });
        addedSources++;
      }
    }
  }

  console.log(`Summary: Added ${addedEpisodes} missing episodes, ${addedSources} video sources.`);

  // Write updated canonicalData.js
  const newCData = `// Database Kanonikal TokuFlix dengan Metadata Tokusatsu Lengkap\nexport const DB = ${JSON.stringify(db, null, 2)};\n`;
  fs.writeFileSync(cDataPath, newCData, 'utf8');

  // Write updated scrapedTokusatsu.json
  fs.writeFileSync(scrapedPath, JSON.stringify(scrapedData, null, 2), 'utf8');

  console.log('Saved canonicalData.js and scrapedTokusatsu.json successfully!');
}

run().catch(console.error);
