async function testFandom(wiki, title) {
  try {
    const url = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600`;
    const res = await fetch(url, { headers: { 'User-Agent': 'TokuBot/1.0' } });
    const data = await res.json();
    console.log(wiki, title, JSON.stringify(data));
  } catch (e) {
    console.error(e.message);
  }
}

testFandom('kamenrider', 'Kamen_Rider_Zero-One');
testFandom('kamenrider', 'Kamen_Rider_Saber');
testFandom('kamenrider', 'Kamen_Rider_Revice');
testFandom('ultra', 'Ultraman_Z');
testFandom('powerrangers', 'Mashin_Sentai_Kiramager');
