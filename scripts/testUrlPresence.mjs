async function check(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tokusatsuindo.com/' }
    });
    return res.status === 200;
  } catch (_) {
    return false;
  }
}

async function main() {
  const urls = [
    'https://www.tokusatsuindo.com/kamen-rider-geats-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-zero-one-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-saber-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-revice-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-gotchard-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/ultraman-arc-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/ultraman-blazar-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/ultraman-z-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-w-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-build-episode-1-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-agito-episode-1-sub-indonesia/',
  ];
  for (const u of urls) {
    const ok = await check(u);
    console.log((ok ? '✅' : '❌') + ' ' + u);
  }
}

main().catch(console.error);
